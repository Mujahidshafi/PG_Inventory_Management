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
  const { id } = router.query;  

  const [locations, setLocations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    crop_type: "",
    crop_code: "",
    weight_kg: "",
    supplier: "",
    notes: "",
    location_id: "",
    date: "",
    box: "",
    process: "",
    lot_number: "",

  });
  const [saveToCatalog, setSaveToCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [{ data: locs, error: locErr }, { data: crops, error: cropErr }, { data: custs, error: custErr }] =
          await Promise.all([
            supabase
              .from("storage_location_list")
              .select("id, storage_location_name")
              .order("storage_location_name", { ascending: true }),
            supabase
              .from("crop_types")
              .select("id, name, crop_code")
              .order("name", { ascending: true }),
            supabase
              .from("customers")
              .select("customer_id, name")
              .order("name", { ascending: true })
          ]);

        if (locErr) throw locErr;
        if (cropErr) throw cropErr;
        if (custErr) throw custErr;

        if (locs) setLocations(locs);
        if (crops) setSuggestions(crops);
        if (custs) setCustomers(custs);
      } catch (e) {
        setErrorMsg(e?.message || "Failed to load reference data.");
      }
    })();
  }, []);
  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const normalizedCrop = useMemo(() => form.crop_code.trim(), [form.crop_code]);

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
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("clean_product_storage")
          .select("*")
          .eq("ID", id)
          .single();

        if (error) throw error;
        if (data) {
          //console.log("loaded record", data)
          setForm({
            //crop_type: data.Product ?? "",
            crop_code: data.Product ?? "",
            weight_kg: (data.Amount ?? "").toString(),
            supplier: data.Supplier ?? "",
            notes: data.Notes ?? "",
            location_id: data.Location ?? "",
            date: data.Date_Stored ?? "",
            box: data.Box_ID ?? "",
            process: data.Process_ID ?? "",
            lot_number: data.Lot_Number ?? "",
          });
        }
      } catch (err) {
        console.error("Error loading record:", err);
        setErrorMsg("Failed to load record data.");
      }
    })();
  }, [id]);
  //console.log("Form", form)
  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setErrorMsg("");
    const weightSanitized = (form.weight_kg || "").toString().replace(/,/g, "");
    const weight = Number(weightSanitized);
    if (!requiredOk) {
      setErrorMsg("Crop type, positive weight, and storage location are required.");
      return;
    }

    try {
      setSaving(true);
      const now = new Date().toISOString();
      const payload = {
        Product: form.crop_code,
        Amount: weight,
        Supplier: form.supplier,
        Notes: (form.notes || "").trim(),
        Location: form.location_id,
        Box_ID: form.box,
        Process_ID: form.process,
        Lot_Number: form.lot_number,
        Date_Stored: form.date ? new Date(form.date).toISOString() : now,

      };
      const raw = Array.isArray(id) ? id[0] : id;
      const hasId = !!raw;
      const recordId = hasId && /^\d+$/.test(raw) ? Number(raw) : raw;
      let error;
      if (hasId) {
        ({ error } = await supabase.from("clean_product_storage").update(payload).eq("ID", recordId));
      } else {
        ({ error } = await supabase.from("clean_product_storage").insert([payload]));
      }
      if (error) throw error;

      router.push("/cleanStorage");
    } catch (err) {
      setErrorMsg(err?.message || "Insert failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title={"Clean Storage Modify"} showBack={true}>
      <form
        onSubmit={onSubmit}
        className="max-w-3xl mx-auto mt-8 p-6 rounded-2xl bg-white shadow"
      >
        <div className="grid md:grid-cols-2 gap-6">

          <div className="flex flex-col items-start">
            <label htmlFor="crop_type" className={label}>
              Product (Crop Type)
            </label>

            <input
              id="crop_code"
              list="cropOptions"
              name="crop_code"
              className={input}
              placeholder="Type or pick… (e.g., Wheat, Potatoes, Corn)"
              value={form.crop_code}
              onChange={onChange}
              autoComplete="off"
            />
            <datalist id="cropOptions">
              {suggestions.map((c) => (
                <option
                  key={c.crop_code}
                  value={c.crop_code}
                  label={`${c.name}`}
                />
              ))}
            </datalist>

          </div>


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


          <div className="flex flex-col items-start">
            <label htmlFor="customer" className={label}>
              Customer
            </label>

            <input
              id="supplier"
              list="customerOptions"
              name="supplier"
              className={input}
              placeholder="Type or pick a customer…"
              value={form.supplier}
              onChange={onChange}
              autoComplete="off"
            />

            <datalist id="customerOptions">
              {customers.map((c) => (
                <option key={c.customer_id} value={c.name} />
              ))}
            </datalist>
          </div>


          <div className="flex flex-col items-start">
            <label htmlFor="location_id" className={label}>
              Storage Location
            </label>

            <input
              id="location_id"
              list="locationOptions"
              name="location_id"
              className={input}
              placeholder="Type or pick a location…"
              value={form.location_id}
              onChange={onChange}
              autoComplete="off"
            />

            <datalist id="locationOptions">
              {locations.map((loc) => (
                <option key={loc.id} value={loc.storage_location_name} />
              ))}
            </datalist>
          </div>


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
