// /pages/api/delStorageLocation.js
import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.body; 

  const { error } = await supabase
    .from("field_run_storage_test")
    .delete()
    .eq("location", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: "Storage location deleted successfully" });
}