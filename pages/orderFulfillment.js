import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import ScrollingLayout from "../components/scrollingLayout";

const LS_KEY = "orderFulfillmentDraft_v2";

const nowISO = () => new Date().toISOString();

const siloOrder = [
  "HQ-1","HQ-2","HQ-3","HQ-4","HQ-5","HQ-6","HQ-7","HQ-8","HQ-9","HQ-10",
  "HQ-11","HQ-12","HQ-13","HQ-14","HQ-15","HQ-16","HQ-17","HQ-18",
  "BEN-5","BEN-6","BEN-7","BEN-8","BEN-9","BEN-10","BEN-11","BEN-12",
  "Co2-1","Co2-2","Boxes-Mill"
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const safeNum = (v) => (v === "" || v === null ? 0 : Number(v) || 0);

const normToken = (v) =>
  String(v ?? "")
    .trim()
    .replace(/\s+/g, " ")
    

const dedupeCsv = (csv) => {
  const tokens = String(csv ?? "")
    .split(",")
    .map(normToken)
    .filter(Boolean);

  return Array.from(new Set(tokens)).join(", ");
}

const normalizeJsonArray = (val) => {
  if (!val && val !== 0) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [val];
    }
  }
  return [String(val)];
};

const DEFAULT_STATE = {
  processId: "",
  jobDate: todayISO(),
  employee: "",
  customer: "",
  notes: "",
  items: [], // all removals live here
};

function HeaderField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold tabular-nums break-words">
        {value}
      </div>
    </div>
  );
}

export default function OrderFulfillmentPage() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [bins, setBins] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [scanId, setScanId] = useState("");
  const [selectedBin, setSelectedBin] = useState("");
  const [binRemoveWeight, setBinRemoveWeight] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  const dirtyRef = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ---------- Load draft once ----------
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setState((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn("Failed to load draft:", e);
    }
  }, []);

  // ---------- Fetch bins / employees / customers ----------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Field run bins
        const { data: binData, error: binErr } = await supabase
          .from("field_run_storage_test")
          .select("*");
        if (binErr) throw binErr;

        const sortedBins = [...(binData || [])].sort((a, b) => {
          const ia = siloOrder.indexOf(a.location);
          const ib = siloOrder.indexOf(b.location);
          if (ia === -1 && ib === -1) return a.location.localeCompare(b.location);
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });
        setBins(sortedBins);

        // Employees
        const { data: empData, error: empErr } = await supabase
          .from("employees")
          .select("name, active")
          .eq("active", true)
          .order("name", { ascending: true });
        if (empErr) throw empErr;
        setEmployees(empData || []);

        // Customers (optional)
        const { data: custData, error: custErr } = await supabase
          .from("customers")
          .select("name")
          .order("name", { ascending: true });
        if (!custErr) setCustomers(custData || []);
      } catch (e) {
        console.error("Error loading data:", e);
        setStatusMsg("Error loading data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---------- Small helpers ----------
  const setField = useCallback((key, value) => {
    setState(prev => ({ ...prev, [key]: value }));
    dirtyRef.current = true;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) {
        try {
          const snapshot = JSON.stringify(stateRef.current);
          const prev = window.localStorage.getItem(LS_KEY);
          if (snapshot !== prev) {
            window.localStorage.setItem(LS_KEY, snapshot);
            dirtyRef.current = false;
            setStatusMsg("Draft autosaved.");
          }
        } catch (err) {
          console.warn("Autosave failed:", err);
        }
      }
    }, 5000); // every 5 seconds
    return () => clearInterval(interval);
  }, []);


  // ---------- Summary (lots/products/suppliers/total) ----------
  const summary = useMemo(() => {
    const lots = new Set();
    const products = new Set();
    const suppliers = new Set();
    let total = 0;

    for (const item of state.items || []) {
      if (item.lotNumbers) {
        item.lotNumbers
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((ln) => lots.add(ln));
      }
      if (item.products) {
        item.products
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((p) => products.add(p));
      }
      if (item.supplier) suppliers.add(item.supplier);
      total += safeNum(item.removeWeight);
    }

    return {
      lots: Array.from(lots).join(", "),
      products: Array.from(products).join(", "),
      suppliers: Array.from(suppliers).join(", "),
      totalWeight: total,
    };
  }, [state.items]);

  // ---------- Add removal from Field Run bin ----------
  const handleAddBinRemoval = () => {
    if (!selectedBin) {
      alert("Select a bin first.");
      return;
    }
    const amt = safeNum(binRemoveWeight);
    if (amt <= 0) {
      alert("Enter a valid weight to remove.");
      return;
    }
    const bin = bins.find((b) => b.location === selectedBin);
    if (!bin) {
      alert("Bin not found.");
      return;
    }
    const current = safeNum(bin.weight);
    if (amt > current) {
      alert(
        `Cannot remove more than available. Bin ${selectedBin} has ${current} lbs.`
      );
      return;
    }

    const lots = normalizeJsonArray(bin.lot_number).join(", ");
    const prods = normalizeJsonArray(bin.product).join(", ");

    const newItem = {
      id: `bin-${selectedBin}-${Date.now()}`,
      sourceType: "field_run",
      identifier: selectedBin,
      description: `Field Run Bin ${selectedBin}`,
      lotNumbers: lots,
      products: prods,
      supplier: null,
      availableWeight: current,
      removeWeight: amt,
      isPartial: true,
      newRemainingWeight: Math.max(current - amt, 0),
      scannedAt: nowISO(),
    };

    setState((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setBinRemoveWeight("");
    setStatusMsg("");
  };

  // ---------- Scan box/pallet ID ----------
  const handleScan = async () => {
    const code = scanId.trim();
    if (!code) return;

    if (state.items.some((it) => it.identifier === code)) {
      alert("This ID is already added.");
      return;
    }

    setStatusMsg("Looking up ID...");
    try {
      // 1) Pallet (bagged_storage)
      {
        const { data, error } = await supabase
          .from("bagged_storage")
          .select("*")
          .eq("pallet_id", code)
          .maybeSingle();
        if (error && error.code !== "PGRST116") {
          console.warn("Bagged lookup error:", error.message);
        }
        if (data) {
          const newItem = {
            id: `pallet-${code}`,
            sourceType: "pallet",
            identifier: code,
            description: `Pallet ${code}`,
            lotNumbers: data.lot_number || "",
            products: data.product || "",
            supplier: data.supplier || null,
            availableWeight: safeNum(data.total_weight),
            removeWeight: safeNum(data.total_weight),
            isPartial: false,
            newRemainingWeight: "",
            bagType: data.bag_type,
            scannedAt: nowISO(),
          };
          setState((prev) => ({
            ...prev,
            items: [...prev.items, newItem],
          }));
          setScanId("");
          setStatusMsg("");
          return;
        }
      }

      // 2) Clean box
      {
        const { data, error } = await supabase
          .from("clean_product_storage")
          .select("*")
          .eq("Box_ID", code)
          .maybeSingle();
        if (error && error.code !== "PGRST116") {
          console.warn("Clean lookup error:", error.message);
        }
        if (data) {
          const newItem = {
            id: `clean-${code}`,
            sourceType: "clean",
            identifier: code,
            tableId: data.ID,
            description: `Clean Box ${code}`,
            lotNumbers: data.Lot_Number || "",
            products: data.Product || "",
            supplier: data.Supplier || null,
            availableWeight: safeNum(data.Amount),
            removeWeight: safeNum(data.Amount),
            isPartial: false,
            newRemainingWeight: "",
            location: data.Location || "",
            scannedAt: nowISO(),
          };
          setState((prev) => ({
            ...prev,
            items: [...prev.items, newItem],
          }));
          setScanId("");
          setStatusMsg("");
          return;
        }
      }

      // 3) Rerun
      {
        const { data, error } = await supabase
          .from("rerun_product_storage")
          .select("*")
          .eq("Box_ID", code)
          .maybeSingle();
        if (error && error.code !== "PGRST116") {
          console.warn("Rerun lookup error:", error.message);
        }
        if (data) {
          const newItem = {
            id: `rerun-${code}`,
            sourceType: "rerun",
            identifier: code,
            tableId: data.ID,
            description: `Rerun Box ${code}`,
            lotNumbers: data.Lot_Number || "",
            products: data.Product || "",
            supplier: data.Supplier || null,
            availableWeight: safeNum(data.Amount),
            removeWeight: safeNum(data.Amount),
            isPartial: false,
            newRemainingWeight: "",
            location: data.Location || "",
            scannedAt: nowISO(),
          };
          setState((prev) => ({
            ...prev,
            items: [...prev.items, newItem],
          }));
          setScanId("");
          setStatusMsg("");
          return;
        }
      }

      // 4) Screenings
      {
        const { data, error } = await supabase
          .from("screening_storage_shed")
          .select("*")
          .eq("Box_ID", code)
          .maybeSingle();
        if (error && error.code !== "PGRST116") {
          console.warn("Screening lookup error:", error.message);
        }
        if (data) {
          const newItem = {
            id: `screen-${code}`,
            sourceType: "screenings",
            identifier: code,
            tableId: data.ID,
            description: `Screenings Box ${code} (${data.Type})`,
            lotNumbers: data.Lot_Number || "",
            products: data.Product || "",
            supplier: data.Supplier || null,
            availableWeight: safeNum(data.Amount),
            removeWeight: safeNum(data.Amount),
            isPartial: false,
            newRemainingWeight: "",
            type: data.Type,
            scannedAt: nowISO(),
          };
          setState((prev) => ({
            ...prev,
            items: [...prev.items, newItem],
          }));
          setScanId("");
          setStatusMsg("");
          return;
        }
      }

      alert("ID not found in pallets, clean, rerun, or screenings.");
      setStatusMsg("");
    } catch (e) {
      console.error("Scan lookup failed:", e);
      alert("Error looking up ID: " + e.message);
      setStatusMsg("");
    }
  };

  // ---------- Update & remove items ----------
  const updateItem = (id, changes) => {
  setState((prev) => ({
    ...prev,
    items: prev.items.map((it) => {
      if (it.id !== id) return it;

      const next = { ...it, ...changes };

      // Toggle Partial
      if (changes.isPartial !== undefined) {
        if (changes.isPartial) {
          // Turning ON partial: blank the field; don't force 0 into the input
          next.isPartial = true;
          next.newRemainingWeight = "";      // <-- stays blank in the UI
          next.removeWeight = 0;             // nothing removed until user types
        } else {
          // Turning OFF partial: clear field; full remove by default
          next.isPartial = false;
          next.newRemainingWeight = "";      // keep blank/disabled when not partial
          next.removeWeight = safeNum(next.availableWeight);
        }
      }

      // Editing New Remaining while Partial is ON
      if (changes.newRemainingWeight !== undefined && next.isPartial) {
        const v = changes.newRemainingWeight;
        if (v === "" || v == null) {
          // keep it blank in state and show 0 removed
          next.newRemainingWeight = "";
          next.removeWeight = 0;
        } else {
          const nr = Number(v);
          if (Number.isFinite(nr)) {
            // keep as string so the input displays exactly what user typed
            next.newRemainingWeight = v;
            next.removeWeight = Math.max(safeNum(next.availableWeight) - nr, 0);
          } else {
            // invalid number: keep prior values
          }
        }
      }

      return next;
    }),
  }));
};


  const removeItem = (id) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  // ---------- Manual draft save / clear ----------
  const handleSaveDraft = () => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(state));
      setStatusMsg("Draft saved.");
    } catch (e) {
      console.error(e);
      setStatusMsg("Could not save draft.");
    }
  };

  const handleClearDraft = () => {
    if (!confirm("Clear this order draft?")) return;
    setState(DEFAULT_STATE);
    try {
      window.localStorage.removeItem(LS_KEY);
    } catch {}
    setStatusMsg("Draft cleared.");
  };

  // ---------- Validation ----------
  const validate = () => {
    const errs = [];
    if (!state.processId.trim()) errs.push("Order ID is required.");
    if (!state.employee) errs.push("Employee is required.");
    if (!state.items || state.items.length === 0)
      errs.push("Add at least one item to fulfill.");

    for (const it of state.items) {
      const rw = safeNum(it.removeWeight);
      if (rw <= 0) {
        errs.push(`Invalid remove weight for ${it.description || it.identifier}.`);
      }
      if (it.isPartial) {
        const nr = safeNum(it.newRemainingWeight);
        const av = safeNum(it.availableWeight);
        if (nr < 0) {
          errs.push(
            `New remaining weight cannot be negative for ${it.description || it.identifier}.`
          );
        }
        if (nr > av) {
          errs.push(
            `New remaining weight cannot exceed available for ${it.description || it.identifier}.`
          );
        }
      }
    }
    return errs;
  };

  // ---------- Complete (apply removals + report) ----------
  const handleComplete = async () => {
    const errs = validate();
    setShowValidation(true);
    if (errs.length) {
      alert("Please fix the following:\n\n" + errs.join("\n"));
      return;
    }

    const items = state.items || [];
    const totalWeight = summary.totalWeight;

    const lotSet = new Set();
    const prodSet = new Set();
    const suppSet = new Set();

    for (const it of items) {
      (it.lotNumbers || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((ln) => lotSet.add(ln));
      (it.products || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((p) => prodSet.add(p));
      if (it.supplier) suppSet.add(it.supplier);
    }

    const lot_numbers = Array.from(lotSet).join(", ");
    const products = Array.from(prodSet).join(", ");
    const suppliers = Array.from(suppSet).join(", ");

     try {
      // 1) Apply removals
      for (const it of items) {
        const rw = safeNum(it.removeWeight);
        if (rw <= 0) continue;

        if (it.sourceType === "field_run") {
          const { data: existing, error: fErr } = await supabase
            .from("field_run_storage_test")
            .select("weight")
            .eq("location", it.identifier)
            .maybeSingle();
          if (!fErr && existing) {
            const current = safeNum(existing.weight);
            const newWeight = Math.max(current - rw, 0);
            const { error: uErr } = await supabase
              .from("field_run_storage_test")
              .update({ weight: newWeight })
              .eq("location", it.identifier);
            if (uErr) console.error("Field run update failed:", uErr.message);
          }
        }

        if (it.sourceType === "clean") {
          if (it.isPartial && safeNum(it.newRemainingWeight) > 0) {
            const { error } = await supabase
              .from("clean_product_storage")
              .update({ Amount: safeNum(it.newRemainingWeight) })
              .eq("Box_ID", it.identifier);
            if (error) console.error("Clean partial update failed:", error.message);
          } else {
            const { error } = await supabase
              .from("clean_product_storage")
              .delete()
              .eq("Box_ID", it.identifier);
            if (error) console.error("Clean delete failed:", error.message);
          }
        }

        if (it.sourceType === "rerun") {
          if (it.isPartial && safeNum(it.newRemainingWeight) > 0) {
            const { error } = await supabase
              .from("rerun_product_storage")
              .update({ Amount: safeNum(it.newRemainingWeight) })
              .eq("Box_ID", it.identifier);
            if (error) console.error("Rerun partial update failed:", error.message);
          } else {
            const { error } = await supabase
              .from("rerun_product_storage")
              .delete()
              .eq("Box_ID", it.identifier);
            if (error) console.error("Rerun delete failed:", error.message);
          }
        }

        if (it.sourceType === "screenings") {
          if (it.isPartial && safeNum(it.newRemainingWeight) > 0) {
            const { error } = await supabase
              .from("screening_storage_shed")
              .update({ Amount: safeNum(it.newRemainingWeight) })
              .eq("Box_ID", it.identifier);
            if (error)
              console.error("Screenings partial update failed:", error.message);
          } else {
            const { error } = await supabase
              .from("screening_storage_shed")
              .delete()
              .eq("Box_ID", it.identifier);
            if (error) console.error("Screenings delete failed:", error.message);
          }
        }

        if (it.sourceType === "pallet") {
          if (it.isPartial && safeNum(it.newRemainingWeight) > 0) {
            const { error } = await supabase
              .from("bagged_storage")
              .update({ total_weight: safeNum(it.newRemainingWeight) })
              .eq("pallet_id", it.identifier);
            if (error) console.error("Pallet partial update failed:", error.message);
          } else {
            const { error } = await supabase
              .from("bagged_storage")
              .delete()
              .eq("pallet_id", it.identifier);
            if (error) console.error("Pallet delete failed:", error.message);
          }
        }
      }

      const toNumOrNull = (v) => (v === "" || v == null ? null : Number(v));

      // Use converted items in the report
      const itemsForReport = (state.items || []).map((row) => ({
        ...row,
        lotNumbers: dedupeCsv(row.lotNumbers),
        products: dedupeCsv(row.products),
        supplier: row.supplier ? String(row.supplier).trim() : null,
        newRemainingWeight: toNumOrNull(row.newRemainingWeight),
      }));

      // 2) Insert report
      const reportPayload = {
        process_id: state.processId.trim(),
        process_type: "Order Fulfillment",
        employee: state.employee || null,
        customer: state.customer || null,
        lot_numbers,
        products,
        suppliers: suppliers || null,
        notes: state.notes || null,
        total_weight: totalWeight,
        items: itemsForReport,
      };

      const { error: repErr } = await supabase
        .from("order_fulfillment_reports")
        .insert(reportPayload);

      if (repErr) {
        console.error("Report insert failed:", repErr.message);
        alert("Order saved but report insert failed: " + repErr.message);
      } else {
        alert("✅ Order fulfillment completed and logged.");
      }

      // 3) Reset
      setState(DEFAULT_STATE);
      try {
        window.localStorage.removeItem(LS_KEY);
      } catch {}
      setStatusMsg("Job completed and draft cleared.");
      setShowValidation(false);
    } catch (e) {
      console.error("Order completion error:", e);
      alert("Error completing order: " + e.message);
    }
  };

  // ---------- UI ----------
  return (
    <ScrollingLayout title="Order Fulfillment" showBack={true}>
      <div className="mx-auto max-w-6xl p-6 bg-[#D9D9D9] flex flex-col  h-full">  

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1.4fr] gap-6 mb-6">
          {/* Left: Controls */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <HeaderField label="Order ID">
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="e.g., OF-2025-11-001"
                  value={state.processId}
                  onChange={(e) => setField("processId", e.target.value)}
                />
              </HeaderField>

              <HeaderField label="Job Date">
                <input
                  type="date"
                  className="w-full rounded-lg border px-3 py-2"
                  value={state.jobDate}
                  onChange={(e) => setField("jobDate", e.target.value)}
                />
              </HeaderField>

              <HeaderField label="Employee">
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  value={state.employee}
                  onChange={(e) => setField("employee", e.target.value)}
                >
                  <option value="">Select employee…</option>
                  {employees.map((emp) => (
                    <option key={emp.name} value={emp.name}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </HeaderField>

              <HeaderField label="Customer (Optional)">
                <select
                  className="w-full rounded-lg border px-3 py-2"
                  value={state.customer}
                  onChange={(e) => setField("customer", e.target.value)}
                >
                  <option value="">Select customer…</option>
                  {customers.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </HeaderField>

              <HeaderField label="Lot Numbers (auto)">
                <input
                  className="w-full rounded-lg border px-3 py-2 bg-gray-50"
                  value={summary.lots}
                  readOnly
                />
              </HeaderField>

              <HeaderField label="Products (auto)">
                <input
                  className="w-full rounded-lg border px-3 py-2 bg-gray-50"
                  value={summary.products}
                  readOnly
                />
              </HeaderField>
            </div>

            <HeaderField label="Notes">
              <textarea
                className="w-full rounded-lg border px-3 py-2"
                rows={2}
                placeholder="Optional notes about this shipment..."
                value={state.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </HeaderField>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleClearDraft}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Clear Draft
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="rounded-xl bg-[#5D1214] text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                Complete Fulfillment
              </button>
            </div>

            {showValidation && (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                Ensure Order ID, Employee, and at least one valid removal line are set.
              </div>
            )}

            {statusMsg && (
              <div className="mt-2 text-xs text-gray-600">{statusMsg}</div>
            )}
          </div>

          {/* Right: Summary */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-base font-semibold">Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Total Removed (lbs)"
                value={summary.totalWeight.toLocaleString()}
              />
              <Stat label="Unique Lots" value={summary.lots || "—"} />
              <Stat label="Products" value={summary.products || "—"} />
              <Stat label="Suppliers" value={summary.suppliers || "—"} />
            </div>
          </div>
        </div>

        {/* Field Run Bin Removal */}
        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold mb-3">
            Remove from Field Run Bin
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1fr] gap-3 items-end">
            <div>
              <label className="text-xs text-gray-600">Bin</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={selectedBin}
                onChange={(e) => setSelectedBin(e.target.value)}
              >
                <option value="">Select bin…</option>
                {bins.map((b) => (
                  <option key={b.location} value={b.location}>
                    {b.location}
                  </option>
                ))}
              </select>
              {selectedBin && (() => {
                const bin = bins.find((b) => b.location === selectedBin);
                if (!bin) return null;
                const lots = normalizeJsonArray(bin.lot_number).join(", ");
                const prods = normalizeJsonArray(bin.product).join(", ");
                return (
                  <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                    <div>
                      Lots: <span className="font-medium">{lots || "—"}</span>
                    </div>
                    <div>
                      Products:{" "}
                      <span className="font-medium">{prods || "—"}</span>
                    </div>
                    <div>
                      Current:{" "}
                      <span className="font-medium">
                        {safeNum(bin.weight).toLocaleString()} lbs
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div>
              <label className="text-xs text-gray-600">
                Weight to remove (lbs)
              </label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border px-3 py-2"
                value={binRemoveWeight}
                onChange={(e) => setBinRemoveWeight(e.target.value)}
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleAddBinRemoval}
                className="w-full rounded-lg bg-[#3D5147] text-white px-3 py-2 text-sm font-semibold hover:opacity-90"
              >
                + Add Bin Removal
              </button>
            </div>
          </div>
        </div>

        {/* Scan Sources */}
        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold mb-3">
            Scan Box / Pallet
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 rounded-lg border px-3 py-2"
              placeholder="Scan or enter Box ID / Pallet ID"
              value={scanId}
              onChange={(e) => setScanId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleScan();
                }
              }}
            />
            <button
              type="button"
              onClick={handleScan}
              className="rounded-lg bg-[#3D5147] text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
            >
              Add
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Supports IDs from clean, rerun, screenings, and bagged pallets.
          </p>
        </div>

        {/* Items Table */}
        <div className="mb-10 rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold mb-3">Items to Fulfill</h3>
          {(!state.items || state.items.length === 0) ? (
            <p className="text-sm text-gray-500">
              No items yet. Add bin removals or scan boxes/pallets.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs table-fixed min-w-[900px]">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-2 py-2 w-28 text-left">Source</th>
                    <th className="px-2 py-2 w-32 text-left">ID / Bin</th>
                    <th className="px-2 py-2 w-40 text-left">Lots</th>
                    <th className="px-2 py-2 w-40 text-left">Products</th>
                    <th className="px-2 py-2 w-24 text-right">Avail (lbs)</th>
                    <th className="px-2 py-2 w-24 text-right">Remove (lbs)</th>
                    <th className="px-2 py-2 w-24 text-center">Partial?</th>
                    <th className="px-2 py-2 w-32 text-right">
                      New Remaining (lbs)
                    </th>
                    <th className="px-2 py-2 w-10 text-center">✕</th>
                  </tr>
                </thead>
                <tbody>
                  {state.items.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="px-2 py-2">
                        {it.sourceType === "field_run"
                          ? "Field Run"
                          : it.sourceType === "clean"
                          ? "Clean"
                          : it.sourceType === "rerun"
                          ? "Rerun"
                          : it.sourceType === "screenings"
                          ? "Screenings"
                          : it.sourceType === "pallet"
                          ? "Pallet"
                          : it.sourceType}
                      </td>
                      <td className="px-2 py-2">{it.identifier}</td>
                      <td className="px-2 py-2">{it.lotNumbers || "—"}</td>
                      <td className="px-2 py-2">{it.products || "—"}</td>
                      <td className="px-2 py-2 text-right">
                        {safeNum(it.availableWeight).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          className="w-full rounded border px-1 py-1 text-right"
                          value={it.removeWeight ?? ""}
                          onChange={(e) =>
                            updateItem(it.id, {
                              removeWeight: e.target.value,
                            })
                          }
                          disabled={!!it.isPartial}
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={!!it.isPartial}
                          onChange={(e) => updateItem(it.id, { isPartial: e.target.checked })}
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-full rounded border px-1 py-1 text-right"
                        placeholder="Enter lbs…"
                        disabled={!it.isPartial}
                        value={it.isPartial ? (it.newRemainingWeight ?? "") : ""}
                        onChange={(e) =>
                          updateItem(it.id, {
                            newRemainingWeight: e.target.value === "" ? "" : e.target.value,
                          })
                        }
                      />
                    </td>

                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="rounded border px-2 py-1 hover:bg-gray-50"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Tip: Use this page only for confirmed outgoing product. All changes are
          applied to inventory when you click <strong>Complete Fulfillment</strong>.
        </p>
      </div>
    </ScrollingLayout>
  );
}
