import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from("field_run_storage")
    .select("location, lot_number, product, weight, date_stored");

  if (error) {
    console.error("Error fetching storage data:", error);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data);
}