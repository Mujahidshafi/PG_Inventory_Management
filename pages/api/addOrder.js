// pages/api/addOrder.js
import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { customer_id, sale_type } = req.body;

  if (!customer_id || !sale_type) {
    return res.status(400).json({ message: "Missing customer_id or sale_type" });
  }

  const { data, error } = await supabase
    .from("sale_orders")
    .insert([
      {
        customer_id,
        sale_type,
        status: "in_progress",
        date: new Date().toISOString(),
      },
    ])
    .select();

  if (error) {
    console.error("Supabase insert error:", error);
    return res.status(500).json({ message: error.message });
  }

  return res.status(200).json(data[0]);
}
