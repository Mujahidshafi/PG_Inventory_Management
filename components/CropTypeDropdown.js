import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function CropTypeDropdown({ value, onChange }) {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("crop_types")
        .select("id, name")
        .eq("show_in_dropdown", true)            // only showing items marked ON
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching crops:", error.message);
        setCrops([]);
      } else {
        setCrops(data ?? []);
      }
      setLoading(false);
    };

    fetchCrops();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={loading}
      style={{ padding: "6px 10px", margin: "8px 0" }}
    >
      <option value="">{loading ? "Loading..." : "Select crop type"}</option>
      {crops.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
