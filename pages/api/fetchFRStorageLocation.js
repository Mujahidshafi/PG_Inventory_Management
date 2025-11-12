import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  try {
    // select empty records only for deletion
    const { data, error } = await supabase
    .from("field_run_storage_test")
    .select("location, lot_number, product, weight, moisture")
    .eq("lot_number", "[]")
    .eq("product", "[]")
    .eq("weight", 0)
    .eq("moisture", 0);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data ?? []);
  } catch (err) {
    return res.status(500).json({ error: err.message});
  }
}