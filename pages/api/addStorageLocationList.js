import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { storage_location_name } = req.body;

    const { data, error } = await supabase
      .from("storage_location_list")
      .insert([{ storage_location_name }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  }

  res.status(405).json({error: "Method not allowed" });
}