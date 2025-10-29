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
  const [cropCode, setCropCode] = useState("");
  const [msg, setMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  // Load crops from Supabase
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crop_types")
      .select("id, name, crop_code, show_in_dropdown")
      .order("name", { ascending: true });

    if (!error) setRows(data || []);
    else console.error(error);
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

  // Add a new crop to DB
  const addCrop = (e) => {
    e.preventDefault();
    setMsg("");

    const cleanedName = normalize(name);
    const cleanedCode = normalize(cropCode).toUpperCase();

    if (!cleanedName) return setMsg("Enter a crop name.");
    if (!cleanedCode) return setMsg("Enter a short code (e.g., YC).");

    startTransition(async () => {
      const { error } = await supabase.from("crop_types").insert([
        {
          name: cleanedName,
          crop_code: cleanedCode,
          show_in_dropdown: true,
        },
      ]);

      if (error) {
        console.error(error);
        setMsg("Error adding crop.");
      } else {
        setMsg(`Added: ${cleanedName} (${cleanedCode})`);
        setName("");
        setCropCode("");
        load();
      }
    });
  };

  // Toggle visibility (this is the boolean)
  const toggleVisible = async (id, checked) => {
    const { error } = await supabase
      .from("crop_types")
      .update({ show_in_dropdown: checked })
      .eq("id", id);

    if (error) {
      console.error(error);
      setMsg("Error updating checkbox.");
    }
  };

  // Delete crop from DB
  const deleteCrop = async (id, cropName) => {
    if (!confirm(`Delete "${cropName}"?`)) return;
    const { error } = await supabase.from("crop_types").delete().eq("id", id);

    if (error) {
      console.error(error);
      setMsg("Error deleting crop.");
    } else {
      setMsg(`Deleted: ${cropName}`);
      load();
    }
  };

  return (
    <Layout title="Crop Menu" showBack={true}>
      <div className="w-full px-8 flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow">
          <h1 className="text-black text-3xl font-bold mb-6 text-center">
            Crop Menu
          </h1>

          {/* Add Crop Form */}
          <form
            onSubmit={addCrop}
            className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-4 mb-6 max-w-2xl mx-auto"
          >
            <div>
              <label className="block mb-2 font-semibold text-black">
                Crop Name
              </label>
              <input
                className="border p-2 rounded border-gray-400 w-full"
                placeholder="e.g., Yellow Corn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold text-black">
                Short Code
              </label>
              <input
                className="border p-2 rounded border-gray-400 w-full uppercase"
                placeholder="e.g., YC"
                value={cropCode}
                onChange={(e) => setCropCode(e.target.value.toUpperCase())}
                disabled={isPending}
                maxLength={6}
              />
            </div>
            <div className="md:self-end">
              <button
                type="submit"
                disabled={isPending || !name.trim() || !cropCode.trim()}
                className="bg-[#5D1214] text-white px-6 py-2 rounded-[10px] font-semibold hover:bg-[#3D5147] transition-all duration-300 disabled:opacity-60"
              >
                {isPending ? "Adding…" : "Save"}
              </button>
            </div>
          </form>

          {msg && <p className="text-center text-sm text-black mb-4">{msg}</p>}

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 rounded-md font-semibold text-black">
            <div className="col-span-6">Crop Name</div>
            <div className="col-span-2">Short Code</div>
            <div className="col-span-2">Show in Dropdown</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3">Loading...</div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-3">No crops yet.</div>
            ) : (
              rows.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-12 gap-2 px-4 py-2 items-center border-t"
                >
                  <div className="col-span-6 text-black">{r.name}</div>
                  <div className="col-span-2 text-black">
                    {r.crop_code || "—"}
                  </div>
                  <div className="col-span-2">
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
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
