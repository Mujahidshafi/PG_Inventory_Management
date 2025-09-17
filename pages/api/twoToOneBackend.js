import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase.from("boxes").select("*");
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching boxes:", err);
    res.status(500).json({ error: err.message });
  }
}