import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from("field_run_storage_test")
    .select("location, lot_number, product, weight, date_stored, moisture");

  if (error) {
    console.error("Error fetching storage data:", error);
    return res.status(500).json({ error: error.message });
  }

  // Fixed silo order
  const siloOrder = [
    "HQ-1","HQ-2","HQ-3","HQ-4","HQ-5","HQ-6","HQ-7","HQ-8","HQ-9","HQ-10",
    "HQ-11","HQ-12","HQ-13","HQ-14","HQ-15","HQ-16","HQ-17","HQ-18",
    "BEN-5","BEN-6","BEN-7","BEN-8","BEN-9","BEN-10","BEN-11","BEN-12",
    "Co2-3","Co2-4","Boxes-Mill"
  ];

  const sortedData = data.sort(
    (a, b) => siloOrder.indexOf(a.location) - siloOrder.indexOf(b.location)
  );

  res.status(200).json(sortedData);
}