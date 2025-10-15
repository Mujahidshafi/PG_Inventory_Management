// pages/CropMenu.js
"use client";
import { useEffect, useState, useTransition } from "react";
import { supabase } from "../lib/supabase";
import Layout from "../components/layout";

const normalize = (s) => s.trim().replace(/\s+/g, " ");

export default function CropMenu() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crop_types")
      .select("id, name, show_in_dropdown")
      .order("name", { ascending: true });
    if (!error) setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("crop_types_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crop_types" },
        load
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const addCrop = (e) => {
    e.preventDefault();
    setMsg("");
    const cleaned = normalize(name);
    if (!cleaned) return setMsg("Enter a crop name.");

    startTransition(async () => {
      // prevent duplicates (case insensitive)
      const { data: exists } = await supabase
        .from("crop_types")
        .select("id")
        .ilike("name", cleaned);
      if (exists?.length) return setMsg("That crop already exists.");

      const { error } = await supabase
        .from("crop_types")
        .insert([{ name: cleaned, show_in_dropdown: true }]);

      if (error) setMsg("Error adding crop.");
      else {
        setMsg(`Added: ${cleaned}`);
        setName("");
      }
    });
  };

  // Optimistic toggle so the checkbox updates immediately
  const toggleVisible = async (id, checked) => {
    setMsg("");

    // 1) Optimistically update local state
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, show_in_dropdown: checked } : row
      )
    );

    // 2) Persist to Supabase
    const { error } = await supabase
      .from("crop_types")
      .update({ show_in_dropdown: checked })
      .eq("id", id);

    // 3) Revert on error
    if (error) {
      console.error(error);
      setMsg("Error updating visibility.");
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, show_in_dropdown: !checked } : row
        )
      );
    }
  };

  const deleteCrop = async (id, cropName) => {
    setMsg("");
    if (!confirm(`Delete "${cropName}"?`)) return;

    // Optimistically remove from UI
    const prevRows = rows;
    setRows((r) => r.filter((x) => x.id !== id));

    const { error } = await supabase.from("crop_types").delete().eq("id", id);
    if (error) {
      console.error(error);
      setMsg("Error deleting crop.");
      // revert if failed
      setRows(prevRows);
    } else {
      setMsg(`Deleted: ${cropName}`);
    }
  };

  return (
    <Layout title="Crop Menu" showBack={true}>
      <div className="w-full px-8 flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow">
          <h1 className="text-black text-3xl font-bold mb-6 text-center">Crop Menu</h1>

          {/* Add new crop */}
          <form
            onSubmit={addCrop}
            className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-6 max-w-xl mx-auto"
          >
            <div>
              <label className="block mb-2 font-semibold text-black">Add Crop Type</label>
              <input
                className="border p-2 rounded border-gray-400 placeholder-gray-400 w-full"
                placeholder="Enter crop name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="md:self-end">
              <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="bg-[#5D1214] text-white px-6 py-2 rounded-[10px] text-base font-semibold text-center hover:bg-[#3D5147] transition-all duration-300 disabled:opacity-60"
              >
                {isPending ? "Adding…" : "Save"}
              </button>
            </div>
          </form>

          {msg ? <p className="text-center text-sm text-black mb-4">{msg}</p> : null}

          {/* Sticky header for the list */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 rounded-md font-semibold text-black sticky top-0 z-10">
            <div className="col-span-7">Crop Name</div>
            <div className="col-span-3">Show in Dropdown</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Scrollable list area */}
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="px-4 py-3">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-3">No crop types yet.</div>
            ) : (
              <div className="divide-y">
                {rows.map((r) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-12 gap-2 px-4 py-2 items-center"
                  >
                    <div className="col-span-7 text-black">{r.name}</div>
                    <div className="col-span-3">
                      <input
                        type="checkbox"
                        checked={!!r.show_in_dropdown}
                        onChange={(e) => toggleVisible(r.id, e.target.checked)}
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => deleteCrop(r.id, r.name)}
                        className="bg-[#5D1214] text-white px-4 py-2 rounded-[10px] text-sm font-semibold hover:bg-[#3D5147] transition-all duration-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
