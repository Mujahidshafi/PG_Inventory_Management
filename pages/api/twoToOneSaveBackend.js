import { supabase } from "../../lib/supabaseClient";

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

    // Fetch all boxes once
    const { data: allBoxes, error: allBoxesError } = await supabase.from("boxes").select("*");
    if (allBoxesError) throw allBoxesError;

    for (let row of boxes) {
      for (let key of ["box1", "box2"]) {
        const boxNumber = row[key];
        if (!boxNumber) continue;

        const box = allBoxes.find((b) => b.box_number === boxNumber);
        if (!box) return res.status(400).json({ error: `Box ${boxNumber} not found` });
        if (box.location !== "Mill") return res.status(400).json({ error: `Box ${boxNumber} already moved to ${box.location}` });

        totalWeightToAdd += box.weight;

        // Update products
        const productIndex = productsToAdd.findIndex(p => p.product === box.product);
        if (productIndex >= 0) productsToAdd[productIndex].weight += box.weight;
        else productsToAdd.push({ product: box.product, weight: box.weight });

        // Update field lots
        if (!fieldLotsToAdd.includes(box.field_lot_number)) fieldLotsToAdd.push(box.field_lot_number);

        // Update box
        const { error: boxError } = await supabase
          .from("boxes")
          .update({ location: storeTo, weight: 0 })
          .eq("box_number", boxNumber);
        if (boxError) throw boxError;

        // Log box history
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

    // Update storage location
    const { error: updateStorageError } = await supabase
      .from("storage_locations")
      .update({
        total_weight: storageData.total_weight + totalWeightToAdd,
        products: productsToAdd,
        field_lots: fieldLotsToAdd,
      })
      .eq("storage_name", storeTo);
    if (updateStorageError) throw updateStorageError;

    res.status(200).json({ message: "Mix saved successfully" });
  } catch (err) {
    console.error("Error saving mix:", err);
    res.status(500).json({ error: err.message });
  }
}