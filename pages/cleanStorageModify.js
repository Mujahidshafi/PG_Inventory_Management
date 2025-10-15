import React, { useEffect, useState, useMemo } from "react";
import Layout from "../components/layout";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";


const label = "text-black text-[20px] my-2 font-semibold";
const input = "p-4 w-[320px] bg-white text-black border rounded-lg my-1";
const btn =
  "bg-[#5D1214] text-white px-6 py-3 rounded-[12px] font-semibold hover:bg-[#3D5147] transition-all";

export default function CleanStorageModify() {
  const router = useRouter();

  const [locations, setLocations] = useState([]);
  const [suggestions, setSuggestions] = useState([]); // from crop_types
  const [form, setForm] = useState({
    crop_type: "",
    weight_kg: "",
    quality: "A",
    notes: "",
    location_id: "",
  });
  const [saveToCatalog, setSaveToCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load storage locations + crop type suggestions
  useEffect(() => {
    (async () => {
      const [{ data: locs }, { data: crops }] = await Promise.all([
        supabase
          .from("storage_location_list")
          .select("id, storage_location_name")
          .order("storage_location_name", { ascending: true }),
        supabase
          .from("crop_types")
          .select("id, name")
          .order("name", { ascending: true }),
      ]);
      if (locs) setLocations(locs);
      if (crops) setSuggestions(crops.map((c) => c.name));
    })();
  }, []);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const normalizedCrop = useMemo(
    () => form.crop_type.trim(),
    [form.crop_type]
  );

  const ensureInCatalog = async () => {
    if (!saveToCatalog) return;
    if (!normalizedCrop) return;

    // if already present (case-insensitive), skip insert
    const exists =
      suggestions.find(
        (s) => s.toLowerCase() === normalizedCrop.toLowerCase()
      ) !== undefined;
    if (exists) return;

    // Insert into crop_types (make sure crop_types.name has UNIQUE constraint)
    const { error } = await supabase
      .from("crop_types")
      .insert([{ name: normalizedCrop }]);
    if (!error) {
      setSuggestions((prev) => [...prev, normalizedCrop].sort((a, b) => a.localeCompare(b)));
    }
    // if UNIQUE constraint blocks (duplicate), it's fine—ignore
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!normalizedCrop || !form.weight_kg || !form.location_id) {
      setErrorMsg("Crop type, weight, and storage location are required.");
      return;
    }

    const weight = Number(form.weight_kg);
    if (Number.isNaN(weight) || weight <= 0) {
      setErrorMsg("Weight must be a positive number.");
      return;
    }

    setSaving(true);
    // Optionally add to catalog first (won’t block on duplicate)
    await ensureInCatalog();

    const { error } = await supabase.from("clean_storage").insert([
      {
        crop_type: normalizedCrop, // still stored as TEXT in clean_storage
        weight_kg: weight,
        quality: form.quality,
        notes: form.notes.trim(),
        location_id: form.location_id,
      },
    ]);
    setSaving(false);

    if (error) {
      setErrorMsg(error.message || "Insert failed.");
      return;
    }

    router.push("/cleanStorage");
  };

  return (
    <Layout title="Add Clean Product">
      <form
        onSubmit={onSubmit}
        className="max-w-3xl mx-auto mt-8 p-6 rounded-2xl bg-white shadow"
      >
        <div className="grid md:grid-cols-2 gap-6">
          {/* Product with suggestions, but free text allowed */}
          <div className="flex flex-col items-start">
            <label className={label}>Product (Crop Type)</label>

            {/* Input with datalist suggestions */}
            <input
              list="cropOptions"
              name="crop_type"
              className={input}
              placeholder="Type or pick… (e.g., Wheat, Potatoes, Corn)"
              value={form.crop_type}
              onChange={onChange}
            />
            <datalist id="cropOptions">
              {suggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>

            <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={saveToCatalog}
                onChange={(e) => setSaveToCatalog(e.target.checked)}
              />
              Save new name to catalog
            </label>
          </div>

          {/* Weight */}
          <div className="flex flex-col items-start">
            <label className={label}>Weight (kg)</label>
            <input
              name="weight_kg"
              className={input}
              placeholder="e.g., 1500"
              value={form.weight_kg}
              onChange={onChange}
              inputMode="numeric"
            />
          </div>

          {/* Quality */}
          <div className="flex flex-col items-start">
            <label className={label}>Quality</label>
            <select
              name="quality"
              className={input}
              value={form.quality}
              onChange={onChange}
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>

          {/* Storage Location */}
          <div className="flex flex-col items-start">
            <label className={label}>Storage Location</label>
            <select
              name="location_id"
              className={input}
              value={form.location_id}
              onChange={onChange}
            >
              <option value="">Select a location…</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.storage_location_name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className={label}>Notes</label>
            <textarea
              name="notes"
              className={`${input} h-[110px] resize-y`}
              placeholder="Washed & ready to ship…"
              value={form.notes}
              onChange={onChange}
            />
          </div>
        </div>

        {errorMsg && <div className="text-red-600 mt-4">{errorMsg}</div>}

        <div className="flex items-center gap-3 mt-6">
          <button type="submit" className={btn} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <Link href="/cleanStorage" className="underline">
            Cancel
          </Link>
        </div>
      </form>
    </Layout>
  );
}
