// pages/api/fetchSaleOrders.js
import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  const { status } = req.query;

  // Optional filter (if status provided)
  const query = supabase.from("sale_orders").select("*").order("date", { ascending: false });

  if (status) query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching sale orders:", error);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json(data || []);
}
