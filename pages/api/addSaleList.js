import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { product_quantity } = req.body;

    const { data, error } = await supabase
      .from("sale_list")
      .insert([{ product_quantity }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  }

  res.status(405).json({error: "Method not allowed" });
}