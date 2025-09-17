import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { boxes, storeTo, dateTime } = req.body;

  try {
    // Fetch storage location
    const { data: storageData, error: storageError } = await supabase
      .from("storage_locations")
      .select("*")
      .eq("storage_name", storeTo)
      .single();
    if (storageError) throw storageError;

    let totalWeightToAdd = 0;
    let productsToAdd = [...storageData.products];
    let fieldLotsToAdd = [...storageData.field_lots];

    // Fetch all boxes
    const { data: allBoxes, error: boxesError } = await supabase.from("boxes").select("*");
    if (boxesError) throw boxesError;

    for (let row of boxes) {
      for (let key of ["box1", "box2", "box3"]) {
        const boxNumber = row[key];
        if (!boxNumber) continue;

        const box = allBoxes.find((b) => b.box_number === boxNumber);
        if (!box) {
          return res.status(400).json({ error: `Box ${boxNumber} not found` });
        }

        if (box.location !== "Mill") {
          return res.status(400).json({ error: `Box ${boxNumber} already moved to ${box.location}` });
        }

        totalWeightToAdd += box.weight;

        const productIndex = productsToAdd.findIndex((p) => p.product === box.product);
        if (productIndex >= 0) productsToAdd[productIndex].weight += box.weight;
        else productsToAdd.push({ product: box.product, weight: box.weight });

        if (!fieldLotsToAdd.includes(box.field_lot_number)) fieldLotsToAdd.push(box.field_lot_number);

        const { error: boxUpdateError } = await supabase
          .from("boxes")
          .update({ location: storeTo, weight: 0 })
          .eq("box_number", boxNumber);
        if (boxUpdateError) throw boxUpdateError;

        const { error: historyError } = await supabase
          .from("box_history")
          .insert({
            box_number: boxNumber,
            from_location: box.location,
            to_location: storeTo,
            weight_moved: box.weight,
            moved_at: dateTime || new Date().toISOString(),
          });
        if (historyError) throw historyError;
      }
    }

    const { error: storageUpdateError } = await supabase
      .from("storage_locations")
      .update({
        total_weight: storageData.total_weight + totalWeightToAdd,
        products: productsToAdd,
        field_lots: fieldLotsToAdd,
      })
      .eq("storage_name", storeTo);
    if (storageUpdateError) throw storageUpdateError;

    res.status(200).json({ message: "Mix saved successfully" });
  } catch (error) {
    console.error("Save API error:", error);
    res.status(500).json({ error: error.message });
  }
}