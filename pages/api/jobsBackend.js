import { supabase } from "../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { processId } = req.body;
  if (!processId) {
    return res.status(400).json({ message: "Missing processId" });
  }

  const { data, error } = await supabase
    .from("create_job")
    .update({ is_running: true })
    .eq("process_id", processId)
    .eq("is_running", false)
    .eq("is_complete", false)
    .select("*");

  if (error) {
    console.error("Error updating job:", error.message);
    return res
      .status(500)
      .json({ message: "Failed to update job", error: error.message });
  }

  if (!data || data.length === 0) {
    return res
      .status(409)
      .json({ message: "Not updated (already running or completed?)" });
  }

  console.log("Updated job:", data);
  return res.status(200).json({ message: "Job started", data });
}
