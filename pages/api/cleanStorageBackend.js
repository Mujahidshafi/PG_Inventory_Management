import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { crop_type, weight_kg, quality, notes, location_id } = req.body;

    const { data, error } = await supabase.from("clean_storage").insert([
      {
        crop_type,
        weight_kg,
        quality,
        notes,
        location_id,
      },
    ]);

    if (error) return res.status(500).json({ message: "Insert failed", error });
    return res.status(200).json({ message: "Inserted successfully", data });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("clean_storage")
      .select("id, crop_type, weight_kg, quality, notes, received_at, location_id");

    if (error) return res.status(500).json({ message: "Fetch failed", error });
    return res.status(200).json(data);
  }

  return res.status(405).json({ message: "Method not allowed" });
}
