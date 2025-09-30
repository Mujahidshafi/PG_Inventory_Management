import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { product_quantity } = req.body;

    const { data, error } = await supabase
      .from("sale_items")
      .insert([{ product_quantity }]); // array of objects

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  }

  res.status(405).json({error: "Method not allowed" });
}