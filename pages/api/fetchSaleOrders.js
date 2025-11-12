// pages/api/fetchSaleOrders.js
import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  const { status } = req.query;

  const { data, error } = await supabase
    .from("sale_orders")
    .select("*");

  if (error) return res.status(500).json(error);
  return res.status(200).json(data);
}

