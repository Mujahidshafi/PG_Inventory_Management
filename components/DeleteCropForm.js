import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function DeleteCropForm() {
  const [crops, setCrops] = useState([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("crop_types")
        .select("id, name")
        .order("name");
      if (error) {
        console.error(error.message);
        setMessage("❌ Error loading crops");
      } else {
        setCrops(data ?? []);
      }
      setLoading(false);
    };
    fetchCrops();
  }, []);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!selected) return;

    const target = crops.find((c) => c.id === selected);
    const ok = confirm(`Delete "${target?.name ?? "this crop"}"?`);
    if (!ok) return;

    const { error } = await supabase.from("crop_types").delete().eq("id", selected);

    if (error) {
      console.error(error.message);
      setMessage("❌ Error deleting crop");
    } else {
      setMessage("✅ Crop deleted");
      setCrops((prev) => prev.filter((c) => c.id !== selected));
      setSelected("");
    }
  };

  return (
    <form onSubmit={handleDelete} style={{ marginBottom: 16 }}>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={loading}
        style={{ padding: "6px", marginRight: "8px" }}
      >
        <option value="">{loading ? "Loading..." : "Select crop to delete"}</option>
        {crops.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button type="submit" disabled={!selected || loading}>Delete</button>
      {message && <p>{message}</p>}
    </form>
  );
}

