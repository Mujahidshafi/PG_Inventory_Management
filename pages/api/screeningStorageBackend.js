import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { id } = req.query;
    try {
      if (id) {
        const { data, error } = await supabase
          .from("screening_storage")
          .select("*")
          .eq("Process_ID", id)
          .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      } else {
        const { data, error } = await supabase
          .from("screening_storage")
          .select("*");

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
      }
    } catch (e) {
      console.error("GET error:", e);
      return res.status(500).json({ error: "Server error" });
    }
  }

  if (req.method === "PUT") {
    const { id } = req.query;
    const body = req.body;

    if (!id) return res.status(400).json({ error: "Missing id" });

    const { error } = await supabase
      .from("screening_storage")
      .update(body)
      .eq("Process_ID", id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const { error } = await supabase
      .from("screening_storage")
      .delete()
      .eq("Process_ID", id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}