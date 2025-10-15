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
      try {
        const [{ data: locs, error: locErr }, { data: crops, error: cropErr }] =
          await Promise.all([
            supabase
              .from("storage_location_list")
              .select("id, storage_location_name")
              .order("storage_location_name", { ascending: true }),
            supabase
              .from("crop_types")
              .select("id, name")
              .order("name", { ascending: true }),
          ]);

        if (locErr) throw locErr;
        if (cropErr) throw cropErr;

        if (locs) setLocations(locs);
        if (crops) setSuggestions(crops.map((c) => c.name));
      } catch (e) {
        setErrorMsg(e?.message || "Failed to load reference data.");
      }
    })();
  }, []);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const normalizedCrop = useMemo(() => form.crop_type.trim(), [form.crop_type]);

  const requiredOk = useMemo(() => {
    const w = (form.weight_kg || "").toString().replace(/,/g, "").trim();
    const weight = Number(w);
    return (
      !!normalizedCrop &&
      !!form.location_id &&
      w.length > 0 &&
      Number.isFinite(weight) &&
      weight > 0
    );
  }, [form.weight_kg, form.location_id, normalizedCrop]);

  // Upsert crop name into catalog (Supabase JS v2)
  const ensureInCatalog = async () => {
    if (!saveToCatalog || !normalizedCrop) return;

    const { error } = await supabase
      .from("crop_types")
      .upsert(
        [{ name: normalizedCrop }],
        {
          onConflict: "name",
          ignoreDuplicates: true, // do nothing if it already exists
        }
      );

    if (!error) {
      setSuggestions((prev) =>
        [...new Set([...prev, normalizedCrop])].sort((a, b) =>
          a.localeCompare(b)
        )
      );
    }
    // If there's an error, we don't fail the whole submit—catalog is a convenience.
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setErrorMsg("");

    // Validate
    const weightSanitized = (form.weight_kg || "").toString().replace(/,/g, "");
    const weight = Number(weightSanitized);
    if (!requiredOk) {
      setErrorMsg("Crop type, positive weight, and storage location are required.");
      return;
    }

    try {
      setSaving(true);

      // Add to catalog first (safe: ignores duplicates)
      await ensureInCatalog();

      const payload = {
        crop_type: normalizedCrop,
        weight_kg: weight,
        quality: form.quality,
        notes: (form.notes || "").trim(),
        location_id: isNaN(Number(form.location_id))
          ? form.location_id
          : Number(form.location_id),
      };

      const { error } = await supabase.from("clean_storage").insert([payload]);
      if (error) throw error;

      router.push("/cleanStorage");
    } catch (err) {
      setErrorMsg(err?.message || "Insert failed.");
    } finally {
      setSaving(false);
    }
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
            <label htmlFor="crop_type" className={label}>
              Product (Crop Type)
            </label>

            <input
              id="crop_type"
              list="cropOptions"
              name="crop_type"
              className={input}
              placeholder="Type or pick… (e.g., Wheat, Potatoes, Corn)"
              value={form.crop_type}
              onChange={onChange}
              autoComplete="off"
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
            <label htmlFor="weight_kg" className={label}>
              Weight (kg)
            </label>
            <input
              id="weight_kg"
              name="weight_kg"
              className={input}
              placeholder="e.g., 1500"
              value={form.weight_kg}
              onChange={onChange}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
            />
          </div>

          {/* Quality */}
          <div className="flex flex-col items-start">
            <label htmlFor="quality" className={label}>
              Quality
            </label>
            <select
              id="quality"
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
            <label htmlFor="location_id" className={label}>
              Storage Location
            </label>
            <select
              id="location_id"
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
            <label htmlFor="notes" className={label}>
              Notes
            </label>
            <textarea
              id="notes"
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
          <button
            type="submit"
            className={`${btn} disabled:opacity-60 disabled:cursor-not-allowed`}
            disabled={!requiredOk || saving}
            aria-disabled={!requiredOk || saving}
          >
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
