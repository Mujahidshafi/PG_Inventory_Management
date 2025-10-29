"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function DeleteCropForm() {
  const [crops, setCrops] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const field = "border p-2 rounded border-gray-400 w-full text-black";
  const btn =
    "bg-[#5D1214] text-white px-6 py-2 rounded-[10px] text-base font-semibold text-center hover:bg-[#3D5147] transition-all duration-300 disabled:opacity-60";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("crop_types")
        .select("id, name")
        .order("name", { ascending: true });
      setCrops(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const onDelete = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!selectedId) return setMsg("Select a crop to delete.");
    const crop = crops.find((c) => c.id === selectedId);
    if (!confirm(`Delete "${crop?.name}"? This cannot be undone.`)) return;

    // optimistic remove (logic unchanged)
    const prev = crops;
    setCrops((list) => list.filter((c) => c.id !== selectedId));
    setSelectedId("");

    const { error } = await supabase.from("crop_types").delete().eq("id", selectedId);
    if (error) {
      setMsg("Error deleting crop.");
      setCrops(prev);
      console.error(error);
    } else {
      setMsg(`Deleted: ${crop?.name}`);
    }
  };

  return (
    <form onSubmit={onDelete} className="flex flex-col gap-3">
      <select
        className={field}
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? "Loading…" : "Select crop to delete"}</option>
        {crops.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <button type="submit" className={btn} disabled={!selectedId || loading}>
        Delete
      </button>

      {msg ? <p className="text-sm">{msg}</p> : null}
    </form>
  );
}
