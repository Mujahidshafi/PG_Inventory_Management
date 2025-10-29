import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    const { error } = await supabase
      .from("create_job")
      .delete()
      .eq("process_id", id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
