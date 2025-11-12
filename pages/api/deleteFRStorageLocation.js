// /pages/api/delStorageLocation.js
import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.body; 

  
  const { data: record, error: fetchError } = await supabase
    .from("field_run_storage_test")
    .select("lot_number, product, weight, moisture")
    .eq("location", id)
    .single();

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }

  const isLotEmpty = Array.isArray(record.lot_number) && record.lot_number.length === 0;
  const isProductEmpty = Array.isArray(record.product) && record.product.length === 0;
  const isWeightEmpty = Number(record.weight) === 0;
  const isMoistureEmpty = Number(record.moisture) === 0;

  if (!(isLotEmpty && isProductEmpty && isWeightEmpty && isMoistureEmpty)) {
    return res.status(400).json({
      error: `Cannot delete "${id}" — Please Zero Out this location to delete.`,
    });
  }
  
  const { error } = await supabase
    .from("field_run_storage_test")
    .delete()
    .eq("location", id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: `Deleted "${id}" successfully` });
}