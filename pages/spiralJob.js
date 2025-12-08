// pages/spiralJob.js
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import ScrollingLayout from "../components/scrollingLayout";
import { printBoxLabel } from "../lib/labelPrint";

/* -------------------------------- Helpers -------------------------------- */

const todayISO = () => new Date().toISOString().slice(0, 10);
const safeNum = (v) => (v === "" || v === null ? 0 : Number(v) || 0);
// bump key to avoid conflicts with older drafts that had reruns in state
const LS_KEY = "spiralCleaningDraft_v2_noReruns";

const siloOrder = [
  "HQ-1","HQ-2","HQ-3","HQ-4","HQ-5","HQ-6","HQ-7","HQ-8","HQ-9","HQ-10",
  "HQ-11","HQ-12","HQ-13","HQ-14","HQ-15","HQ-16","HQ-17","HQ-18",
  "BEN-5","BEN-6","BEN-7","BEN-8","BEN-9","BEN-10","BEN-11","BEN-12",
  "Co2-3","Co2-4","Boxes-Mill"
];

// Generate box id prefix per output type
const BOX_PREFIX = {
  clean: "C",
  screenings: "SCR", // Spiral Screenings use SCR
};

/* ----------------------------- Default State ----------------------------- */

const DEFAULT_STATE = {
  processID: "",
  jobDate: todayISO(),
  selectedEmployee: "",
  selectedSupplier: "",
  notes: "",
  binsUsed: [],   // [{ bin_location, lot_numbers, products }]
  boxSources: [], // scanned box sources (kept if you use it later)
  inbound: [],    // inbound boxes (pre-mill)
  clean: [],
  screenings: [],
};

/* ------------------------------ Box Helpers ------------------------------ */

const makeInboundRow = () => ({
  sourceType: "Bin", // "Bin" | "BoxID" | "Custom"
  binLocation: "",
  boxNumber: "",
  weightLbsRaw: "",
  weightLbs: 0,
  physicalBoxId: "",
  usePhysicalBox: false,
  lotNumber: "",
  product: "",
});

const makeOutputRow = () => ({
  boxNumber: "",
  weightLbsRaw: "",
  weightLbs: 0, // net stored here
  storageLocation: "",
  physicalBoxId: "",
  usePhysicalBox: false,

  // ✅ custom product tracking
  productOverride: "",
  useCustomProduct: false,
  customProduct: "",
  resolvedProduct: "",
  productSource: "auto", // "auto" | "custom"

  // ✅ optional but nice for clarity/debug/reporting
  grossWeight: 0,
  physicalBoxWeight: 0,
  netWeight: 0,
});

/* --------------------------- Physical Box Lookup ------------------------- */

const findPhysicalBoxWeight = (physicalBoxes, id) => {
  if (!id) return 0;
  const match = physicalBoxes.find(
    (b) => b.physical_box_id?.toLowerCase() === id.toLowerCase()
  );
  return match ? Number(match.weight) || 0 : 0;
};

/* ------------------------------ UI Pieces -------------------------------- */

function HeaderField({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
      {hint ? <p className="text-[10px] text-gray-500">{hint}</p> : null}
    </div>
  );
}

function Stat({ name, value }) {
  return (
    <div className="rounded-2xl border p-3 bg-white">
      <div className="text-[10px] text-gray-500">{name}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/**
 * Output table for Clean / Screenings
 */
function OutputBoxTable({
  kind,              // "clean" | "screenings"
  title,
  color,
  rows,
  processID,
  onAdd,
  onUpdate,
  onRemove,
  physicalBoxes,
}) {
  const prefix = BOX_PREFIX[kind] || "";

  const subtotal = useMemo(() => {
    return (rows || []).reduce((sum, b) => sum + safeNum(b.weightLbs), 0);
  }, [rows]);

  const getPBWeight = useCallback(
    (id) => findPhysicalBoxWeight(physicalBoxes, id),
    [physicalBoxes]
  );

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${color}`} />
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={onAdd}
            className="rounded-xl border px-3 py-1.5 hover:bg-gray-50"
          >
            + Add Box
          </button>
          <div className="text-gray-600">
            Subtotal:{" "}
            <span className="font-semibold">
              {subtotal.toLocaleString()} lbs
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 w-24">Box ID</th>
              <th className="px-3 py-2 w-16">Box #</th>
              <th className="px-3 py-2 w-32">Weight (lbs)</th>
              <th className="px-3 py-2 w-32">Physical Box ID</th>
              <th className="px-3 py-2 w-16">Use PB</th>
              <th className="px-4 py-2 w-20">Net Weight (lbs)</th>
              <th className="px-3 py-2 w-40">Custom Product</th>
              <th className="px-3 py-2 w-40">Storage Location</th>
              <th className="px-4 py-2 w-20">print</th>
              <th className="px-3 py-2 w-16">Remove</th>
            </tr>
          </thead>
          <tbody>
            {!rows || rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                  No boxes yet. Click “Add Box”.
                </td>
              </tr>
            ) : (
              rows.map((b, i) => {
                const boxNum = b.boxNumber || i + 1;
                const boxId =
                  processID && prefix
                    ? `${processID}${prefix}${boxNum}`
                    : "";

                return (
                  <tr key={`${kind}-${i}`} className="border-t">
                    {/* Box ID (read-only) */}
                    <td className="px-3 py-2 tabular-nums text-center">
                      {boxId || "—"}
                    </td>

                    {/* Box # */}
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded border px-2 py-1 text-center"
                        type="number"
                        value={boxNum}
                        onChange={(e) =>
                          onUpdate(i, "boxNumber", e.target.value)
                        }
                      />
                    </td>

                    {/* Weight input (gross). Net computed immediately */}
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded border px-2 py-1 tabular-nums"
                        type="number"
                        step="any"
                        value={
                          b.weightLbsRaw !== undefined
                            ? b.weightLbsRaw
                            : b.weightLbs || ""
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const gross = Number(raw) || 0;

                          const pbw =
                            b.usePhysicalBox && b.physicalBoxId
                              ? getPBWeight(b.physicalBoxId)
                              : 0;

                          const net = Math.max(gross - pbw, 0);

                          onUpdate(i, "weightLbsRaw", raw);

                          // ✅ store detailed fields
                          onUpdate(i, "grossWeight", gross);
                          onUpdate(i, "physicalBoxWeight", pbw);
                          onUpdate(i, "netWeight", net);

                          // ✅ keep legacy field used everywhere else
                          onUpdate(i, "weightLbs", net);
                        }}
                      />
                    </td>

                    {/* Physical Box ID */}
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded border px-2 py-1"
                        type="text"
                        value={b.physicalBoxId || ""}
                        onChange={(e) =>
                          onUpdate(i, "physicalBoxId", e.target.value)
                        }
                        placeholder="e.g., PB0001"
                      />
                    </td>

                    {/* Use Physical Box checkbox */}
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!b.usePhysicalBox}
                        onChange={(e) => {
                          const usePB = e.target.checked;
                          const gross = Number(b.weightLbsRaw ?? b.weightLbs) || 0;

                          const pbw =
                            usePB && b.physicalBoxId
                              ? getPBWeight(b.physicalBoxId)
                              : 0;

                          const net = Math.max(gross - pbw, 0);

                          onUpdate(i, "usePhysicalBox", usePB);

                          // ✅ store detailed fields
                          onUpdate(i, "grossWeight", gross);
                          onUpdate(i, "physicalBoxWeight", pbw);
                          onUpdate(i, "netWeight", net);

                          // ✅ main field
                          onUpdate(i, "weightLbs", net);
                        }}
                      />
                    </td>

                    {/* Net Weight (auto) */}
                    <td className="px-3 py-2 tabular-nums text-center">
                      {(() => {
                        const gross = Number(b.weightLbsRaw ?? b.weightLbs) || 0;
                        const pbw =
                          b.usePhysicalBox && b.physicalBoxId
                            ? getPBWeight(b.physicalBoxId)
                            : 0;
                        const net = Math.max(gross - pbw, 0);
                        return net.toLocaleString();
                      })()}
                    </td>

                    {/* Product (override) */}
                   <td className="px-3 py-2">
                     <input
                      className="w-full rounded border px-2 py-1"
                      type="text"
                      placeholder="Leave blank to use auto products"
                      value={b.productOverride || ""}
                      onChange={(e) => {
                        const val = e.target.value;

                        onUpdate(i, "productOverride", val);

                        const hasCustom = !!String(val || "").trim();

                        // ✅ fields Reports modal knows
                        onUpdate(i, "useCustomProduct", hasCustom);
                        onUpdate(i, "customProduct", val);
                        onUpdate(i, "productSource", hasCustom ? "custom" : "auto");
                      }}
                    />
                   </td>

                    {/* Storage Location */}
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded border px-2 py-1"
                        type="text"
                        value={b.storageLocation || ""}
                        onChange={(e) =>
                          onUpdate(i, "storageLocation", e.target.value)
                        }
                        placeholder={
                          kind === "clean"
                            ? "Refrigerator / Co2 / Other"
                            : "Screening Shed"
                        }
                      />
                    </td>

                    {/* Print (barcode for Box_ID) */}
                    <td className="px-4 py-2 text-center space-x-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!boxId) return;
                          await printBoxLabel(boxId);
                        }}
                        className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
                        title="Print barcode label"
                      >
                        🖨️ Print
                      </button>
                    </td>

                    {/* Remove */}
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(i)}
                        className="rounded border px-2 py-1 hover:bg-gray-50"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------- Inbound Table UI --------------------------- */

function InboundTable({ binsUsed, rows, onAdd, onUpdate, onRemove, physicalBoxes }) {
  const getPBWeight = useCallback(
    (id) => findPhysicalBoxWeight(physicalBoxes, id),
    [physicalBoxes]
  );

  return (
    <div className="rounded-2xl border bg-white shadow-sm mb-6">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-sky-500" />
          <h3 className="text-base font-semibold">Inbound (Pre-Spiral)</h3>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={!binsUsed || binsUsed.length === 0}
          className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40"
        >
          + Add Inbound Box
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 w-32">Bin</th>
              <th className="px-3 py-2 w-16">Box #</th>
              <th className="px-3 py-2 w-32">Gross Weight</th>
              <th className="px-3 py-2 w-28">Physical Box ID</th>
              <th className="px-3 py-2 w-16">Use PB</th>
              <th className="px-3 py-2 w-32">Net Input (auto)</th>
              <th className="px-3 py-2 w-16">Remove</th>
            </tr>
          </thead>
          <tbody>
            {!rows || rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No inbound boxes yet. Add a source bin and click “Add Inbound Box”.
                </td>
              </tr>
            ) : (
              rows.map((b, i) => {
                const gross =
                  Number(b.weightLbsRaw !== undefined ? b.weightLbsRaw : b.weightLbs) || 0;
                const pbw = b.usePhysicalBox && b.physicalBoxId ? getPBWeight(b.physicalBoxId) : 0;
                const net = Math.max(b.weightLbs !== undefined ? b.weightLbs : gross - pbw, 0);

                return (
                  <tr key={i} className="border-t">
                    {/* Bin select */}
                    <td className="px-3 py-2">
                      <select
                        className="w-full rounded border px-2 py-1"
                        value={b.binLocation || ""}
                        onChange={(e) => onUpdate(i, "binLocation", e.target.value)}
                      >
                        <option value="">Select bin…</option>
                        {binsUsed?.map((bin, idx) => (
                          <option key={idx} value={bin.bin_location || bin.location}>
                            {bin.bin_location || bin.location}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Box # */}
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded border px-2 py-1 text-center"
                        type="number"
                        value={b.boxNumber || i + 1}
                        onChange={(e) => onUpdate(i, "boxNumber", e.target.value)}
                      />
                    </td>

                    {/* Gross Weight */}
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded border px-2 py-1 tabular-nums"
                        type="number"
                        step="any"
                        value={b.weightLbsRaw !== undefined ? b.weightLbsRaw : b.weightLbs || ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const g = Number(raw) || 0;
                          let netVal = g;
                          if (b.usePhysicalBox && b.physicalBoxId) {
                            const pb = getPBWeight(b.physicalBoxId);
                            netVal = Math.max(g - pb, 0);
                          }
                          onUpdate(i, "weightLbsRaw", raw);
                          onUpdate(i, "weightLbs", netVal);
                        }}
                      />
                    </td>

                    {/* Physical Box ID */}
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded border px-2 py-1"
                        type="text"
                        placeholder="PB0001"
                        value={b.physicalBoxId || ""}
                        onChange={(e) => onUpdate(i, "physicalBoxId", e.target.value)}
                      />
                    </td>

                    {/* Use PB */}
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!b.usePhysicalBox}
                        onChange={(e) => {
                          const usePB = e.target.checked;
                          let netVal = gross;
                          if (usePB && b.physicalBoxId) {
                            const pb = getPBWeight(b.physicalBoxId);
                            netVal = Math.max(gross - pb, 0);
                          }
                          onUpdate(i, "usePhysicalBox", usePB);
                          onUpdate(i, "weightLbs", netVal);
                        }}
                      />
                    </td>

                    {/* Net Input (read-only) */}
                    <td className="px-3 py-2 tabular-nums text-center">
                      {net.toLocaleString()}
                    </td>

                    {/* Remove */}
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(i)}
                        className="rounded border px-2 py-1 hover:bg-gray-50"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================ Main Page ================================== */

export default function SpiralCleaningPage() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [employees, setEmployees] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bins, setBins] = useState([]);
  const [physicalBoxes, setPhysicalBoxes] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  const [customRows, setCustomRows] = useState([{ lot: "", product: "", weight: "" }]);

  const dirtyRef = useRef(false);
  const saveTimer = useRef(null);

  // Keep input_total synced with inbound (handles add/edit/remove)
  useEffect(() => {
    const sum = (state.inbound || []).reduce(
      (acc, b) => acc + (Number(b?.weightLbs) || 0),
      0
    );
    setState((prev) => ({ ...prev, input_total: sum }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.inbound]);

  // Keep header lot numbers / products deduped from inbound (handles edits/removals)
  useEffect(() => {
    const lots = new Set();
    const prods = new Set();

    for (const b of state.inbound || []) {
      String(b?.lotNumber || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((x) => lots.add(x));

      String(b?.product || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((x) => prods.add(x));
    }

    setState((prev) => ({
      ...prev,
      lotNumbers: Array.from(lots).join(", "),
      products: Array.from(prods).join(", "),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.inbound]);

  /* -------------------------- Load initial data -------------------------- */

  useEffect(() => {
    (async () => {
      // Employees
      const { data: emp } = await supabase
        .from("employees")
        .select("name, active")
        .eq("active", true)
        .order("name", { ascending: true });
      setEmployees(emp || []);

      // Suppliers (customers)
      const { data: cust } = await supabase
        .from("customers")
        .select("name")
        .order("name", { ascending: true });
      setSuppliers(cust || []);

      // Bins
      const { data: binData } = await supabase
        .from("field_run_storage_test")
        .select("location, lot_number, product, weight");
      const sortedBins = (binData || []).sort((a, b) => {
        const ia = siloOrder.indexOf(a.location);
        const ib = siloOrder.indexOf(b.location);
        if (ia === -1 && ib === -1) return a.location.localeCompare(b.location);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
      setBins(sortedBins);

      // Physical boxes
      const { data: pb } = await supabase
        .from("physical_boxes")
        .select("physical_box_id, weight")
        .order("physical_box_id", { ascending: true });
      setPhysicalBoxes(pb || []);

      // Draft
      try {
        const raw =
          typeof window !== "undefined"
            ? window.localStorage.getItem(LS_KEY)
            : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          // drop any legacy rerun keys if present
          const { reruns, ...rest } = parsed || {};
          setState({ ...DEFAULT_STATE, ...rest });
        }
      } catch (e) {
        console.warn("Failed to load draft:", e);
      }
    })();
  }, []);

  /* ---------------------------- Autosave logic --------------------------- */

  const markDirty = () => {
    dirtyRef.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!dirtyRef.current) return;
      try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(state));
        setStatusMsg("Draft autosaved.");
        dirtyRef.current = false;
      } catch (e) {
        console.warn("Autosave failed:", e);
      }
    }, 3000);
  };

  useEffect(() => {
    if (!dirtyRef.current) return;
    markDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  /* -------------------------- Derived aggregate data --------------------- */

  const getPBWeight = useCallback(
    (id) => findPhysicalBoxWeight(physicalBoxes, id),
    [physicalBoxes]
  );

  // Inbound total uses net weights with physical box if flagged
  const inputAmount = useMemo(() => {
    return (state.inbound || []).reduce((sum, b) => {
      const gross =
        Number(b.weightLbsRaw !== undefined ? b.weightLbsRaw : b.weightLbs) || 0;
      if (b.usePhysicalBox && b.physicalBoxId) {
        const pb = getPBWeight(b.physicalBoxId);
        return sum + Math.max(gross - pb, 0);
      }
      return sum + (b.weightLbs !== undefined ? safeNum(b.weightLbs) : gross);
    }, 0);
  }, [state.inbound, getPBWeight]);

  const sumOutputs = (arr = []) =>
    arr.reduce((acc, b) => {
      const gross =
        Number(b.weightLbsRaw !== undefined ? b.weightLbsRaw : b.weightLbs) || 0;
      if (b.usePhysicalBox && b.physicalBoxId) {
        const pb = getPBWeight(b.physicalBoxId);
        return acc + Math.max(gross - pb, 0);
      }
      return acc + (b.weightLbs !== undefined ? safeNum(b.weightLbs) : gross);
    }, 0);

  const totals = useMemo(() => {
    const clean = sumOutputs(state.clean);
    const screenings = sumOutputs(state.screenings);
    const outputTotal = clean + screenings;
    const balance = inputAmount - outputTotal;

    return {
      inputAmount,
      outputTotal,
      clean,
      screenings,
      balance,
    };
  }, [state.clean, state.screenings, inputAmount]);

  const combinedLotNumbers = useMemo(() => {
    const lots = new Set();
    (state.binsUsed || []).forEach((b) => {
      if (Array.isArray(b.lot_numbers)) {
        b.lot_numbers.forEach((ln) => lots.add(String(ln).trim()));
      } else if (typeof b.lot_numbers === "string") {
        b.lot_numbers
          .split(",")
          .map((s) => s.trim())
          .forEach((ln) => ln && lots.add(ln));
      }
    });
    (state.inbound || []).forEach((b) => {
      String(b?.lotNumber || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((ln) => lots.add(ln));
    });
    return Array.from(lots).join(", ");
  }, [state.binsUsed, state.inbound]);

  const combinedProducts = useMemo(() => {
    const prods = new Set();
    (state.binsUsed || []).forEach((b) => {
      if (Array.isArray(b.products)) {
        b.products.forEach((p) => prods.add(String(p).trim()));
      } else if (typeof b.products === "string") {
        b.products
          .split(",")
          .map((s) => s.trim())
          .forEach((p) => p && prods.add(p));
      }
    });
    (state.inbound || []).forEach((b) => {
      String(b?.product || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((p) => prods.add(p));
    });
    return Array.from(prods).join(", ");
  }, [state.binsUsed, state.inbound]);

  /* ----------------------------- Mutators -------------------------------- */

  const setField = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
    dirtyRef.current = true;
  };

  const addBin = () => {
    setState((prev) => ({
      ...prev,
      binsUsed: [
        ...(prev.binsUsed || []),
        { bin_location: "", lot_numbers: [], products: [], weight: 0 },
      ],
    }));
    dirtyRef.current = true;
  };

  const updateBin = (index, key, value) => {
    setState((prev) => {
      const binsUsed = [...(prev.binsUsed || [])];
      const updated = { ...(binsUsed[index] || {}) };

      if (key === "bin_location") {
        updated.bin_location = value;

        const selectedBin = bins.find((b) => b.location === value);
        if (selectedBin) {
          updated.lot_numbers = Array.isArray(selectedBin.lot_number)
            ? selectedBin.lot_number
            : typeof selectedBin.lot_number === "string"
            ? selectedBin.lot_number.split(",").map((s) => s.trim())
            : [];
          updated.products = Array.isArray(selectedBin.product)
            ? selectedBin.product
            : typeof selectedBin.product === "string"
            ? selectedBin.product.split(",").map((s) => s.trim())
            : [];
          updated.weight = Number(selectedBin.weight) || 0;
        } else {
          updated.lot_numbers = [];
          updated.products = [];
          updated.weight = 0;
        }
      } else {
        updated[key] = value;
      }

      binsUsed[index] = updated;
      return { ...prev, binsUsed };
    });
    dirtyRef.current = true;
  };

  const removeBin = (index) => {
    setState((prev) => {
      const binsUsed = [...(prev.binsUsed || [])];
      binsUsed.splice(index, 1);
      return { ...prev, binsUsed };
    });
    dirtyRef.current = true;
  };

  // Inbound mutations
  const addInbound = () => {
    setState((prev) => ({ ...prev, inbound: [...(prev.inbound || []), makeInboundRow()] }));
    dirtyRef.current = true;
  };

  const updateInbound = (index, field, value) => {
    setState((prev) => {
      const inbound = [...(prev.inbound || [])];
      const row = { ...(inbound[index] || {}) };

      // Always set the changed field first
      row[field] = value;

      if (field === "binLocation") {
        row.sourceType = "Bin";
        const selected = bins.find((b) => (b.location || b.bin_location) === value);
        if (selected) {
          const toList = (v) =>
            Array.isArray(v)
              ? v.map((s) => String(s).trim()).filter(Boolean)
              : String(v || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);

          const lots = toList(selected.lot_number);
          const prods = toList(selected.product);

          const merge = (existing, incomingArr) => {
            const seen = new Set(
              String(existing || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            );
            for (const x of incomingArr) seen.add(x);
            return Array.from(seen).join(", ");
          };

          row.lotNumber = merge(row.lotNumber, lots);
          row.product = merge(row.product, prods);
        }
      }

      if (field === "usePhysicalBox" || field === "physicalBoxId" || field === "weightLbsRaw") {
        const gross = Number(row.weightLbsRaw !== undefined ? row.weightLbsRaw : row.weightLbs) || 0;
        let net = gross;
        if (row.usePhysicalBox && row.physicalBoxId) {
          const pb = findPhysicalBoxWeight(physicalBoxes, row.physicalBoxId) || 0;
          net = Math.max(gross - pb, 0);
        }
        row.weightLbs = net;
      }

      inbound[index] = row;
      return { ...prev, inbound };
    });
    dirtyRef.current = true;
  };

  const removeInbound = (index) => {
    setState((prev) => {
      const inbound = [...(prev.inbound || [])];
      inbound.splice(index, 1);
      return { ...prev, inbound };
    });
    dirtyRef.current = true;
  };

  // Add inbound by existing Box ID (Clean / Screenings only)
  async function addInboundFromBoxID(boxId) {
    if (!boxId) return;

    let found = null;

    const { data: clean } = await supabase
      .from("clean_product_storage")
      .select("*")
      .eq("Box_ID", boxId);
    if (clean?.length) {
      const r = clean[0];
      found = {
        lotNumber: r.Lot_Number,
        product: r.Product,
        weightLbs: Number(r.Amount) || 0,
        physicalBoxId: r.physical_box_id || "",
        location: r.Location,
        type: "Clean",
      };
    }

    if (!found) {
      const { data: scr } = await supabase
        .from("screening_storage_shed")
        .select("*")
        .eq("Box_ID", boxId);
      if (scr?.length) {
        const r = scr[0];
        found = {
          lotNumber: r.Lot_Number,
          product: r.Product,
          weightLbs: Number(r.Amount) || 0,
          physicalBoxId: r.physical_box_id || "",
          location: r.Location,
          type: r.Type || "Screenings",
        };
      }
    }

    if (!found) {
      alert("Box ID not found: " + boxId);
      return;
    }

    const newInbound = {
      sourceType: "BoxID",
      binLocation: "",
      boxNumber: (state.inbound?.length || 0) + 1,
      physicalBoxId: found.physicalBoxId,
      usePhysicalBox: false,
      weightLbsRaw: found.weightLbs,
      weightLbs: found.weightLbs,
      lotNumber: found.lotNumber,
      product: found.product,
    };

    setState((prev) => ({ ...prev, inbound: [...(prev.inbound || []), newInbound] }));
    updateHeaderLotsAndProducts(newInbound.lotNumber, newInbound.product);
    addToInputTotal(newInbound.weightLbs);
  }

  async function addInboundCustom(lot, product, weight) {
    const w = Number(weight) || 0;
    const newInbound = {
      sourceType: "Custom",
      binLocation: "",
      boxNumber: (state.inbound?.length || 0) + 1,
      physicalBoxId: "",
      usePhysicalBox: false,
      weightLbs: w,
      lotNumber: lot,
      product: product,
    };
    setState((prev) => ({ ...prev, inbound: [...(prev.inbound || []), newInbound] }));
    updateHeaderLotsAndProducts(lot, product);
    addToInputTotal(w);
  }

  const mergeTokens = (s1, s2) => {
    const toList = (s) =>
      String(s || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    const seen = new Set(toList(s1));
    for (const t of toList(s2)) seen.add(t);
    return Array.from(seen).join(", ");
  };

  function updateHeaderLotsAndProducts(lot, product) {
    setState((prev) => ({
      ...prev,
      lotNumbers: mergeTokens(prev.lotNumbers, lot),
      products: mergeTokens(prev.products, product),
    }));
  }

  function addToInputTotal(amount) {
    const w = Number(amount) || 0;
    if (!w) return;
    setState((prev) => ({ ...prev, input_total: Number(prev.input_total || 0) + w }));
  }

  // Generic output mutators
  const addOutputBox = (kind) => {
    setState((prev) => ({ ...prev, [kind]: [...(prev[kind] || []), makeOutputRow()] }));
    dirtyRef.current = true;
  };

  const updateOutputBox = (kind, index, field, value) => {
    setState((prev) => {
      const list = [...(prev[kind] || [])];
      list[index] = { ...(list[index] || {}), [field]: value };
      return { ...prev, [kind]: list };
    });
    dirtyRef.current = true;
  };

  const removeOutputBox = (kind, index) => {
    setState((prev) => {
      const list = [...(prev[kind] || [])];
      list.splice(index, 1);
      return { ...prev, [kind]: list };
    });
    dirtyRef.current = true;
  };

  /* ----------------------------- Validation ------------------------------ */

  const validate = () => {
    const errors = [];
    if (!state.processID.trim()) errors.push("Process ID is required.");
    if (!state.selectedEmployee) errors.push("Employee must be selected.");
    if (inputAmount <= 0) errors.push("Inbound input must be greater than 0.");

    const anyOutputs =
      (state.clean || []).length ||
      (state.screenings || []).length;

    if (!anyOutputs)
      errors.push("Add at least one output box (Clean or Screenings).");

    return errors;
  };

  /* ----------------------------- Handle Complete ------------------------- */

  const handleComplete = async () => {
    const errs = validate();
    setShowValidation(true);
    if (errs.length) {
      alert("Please fix the following before completing:\n\n" + errs.join("\n"));
      return;
    }

    try {
      // Build normalized inbound with net weights
      const normalizedInbound = (state.inbound || [])
        .filter((b) => safeNum(b.weightLbs || b.weightLbsRaw) > 0)
        .map((b, idx) => {
          const gross = Number(b.weightLbsRaw !== undefined ? b.weightLbsRaw : b.weightLbs) || 0;
          const pbw = b.usePhysicalBox && b.physicalBoxId ? getPBWeight(b.physicalBoxId) : 0;
          const net = Math.max(b.weightLbs !== undefined ? b.weightLbs : gross - pbw, 0);
          return {
            ...b,
            index: idx,
            grossWeight: gross,
            physicalBoxWeight: pbw,
            netWeight: net,
          };
        });

      const normOutputsForKind = (kind) => {
        const prefix = BOX_PREFIX[kind] || "";
        return (state[kind] || [])
          .filter(
            (b) => safeNum(b.weightLbs !== undefined ? b.weightLbs : b.weightLbsRaw) > 0
          )
          .map((b, idx) => {
            const defaultProductStr = combinedProducts || ""; // already in scope above
            const boxNumber = b.boxNumber || idx + 1;
            const gross = Number(b.weightLbsRaw !== undefined ? b.weightLbsRaw : b.weightLbs) || 0;
            const pbw = b.usePhysicalBox && b.physicalBoxId ? getPBWeight(b.physicalBoxId) : 0;
            const net = Math.max(b.weightLbs !== undefined ? b.weightLbs : gross - pbw, 0);
            const Box_ID =
              state.processID && prefix ? `${state.processID}${prefix}${boxNumber}` : null;

            const override = String(b.productOverride || "").trim();
            const resolvedProduct = override || defaultProductStr;
            const isCustom = !!override;

            return {
              ...b,
              boxNumber,
              grossWeight: gross,
              physicalBoxWeight: pbw,
              netWeight: net,

              // ✅ unify field usage
              weightLbs: net,

              // ✅ Reports-friendly fields
              resolvedProduct,
              productSource: isCustom ? "custom" : "auto",
              useCustomProduct: isCustom,
              customProduct: isCustom ? override : "",

              Box_ID,
              date: new Date().toISOString(),
            };
          });
      };

      const cleanOut = normOutputsForKind("clean");
      const screeningsOut = normOutputsForKind("screenings");

      // Insert into storage tables
      const lotNumberStr = combinedLotNumbers || "";
      const defaultProductStr = combinedProducts || "";
      const supplier = state.selectedSupplier || null;
      const notes = state.notes?.trim() || null;
      const employee = state.selectedEmployee || null;

      // Clean
      for (const b of cleanOut) {
        const rowProducts = (b.productOverride && b.productOverride.trim())
          ? b.productOverride.trim()
          : defaultProductStr;

        await supabase.from("clean_product_storage").insert({
          Process_ID: state.processID,
          Box_ID: b.Box_ID,
          Location: b.storageLocation || "",
          Lot_Number: lotNumberStr,
          Product: rowProducts,
          Amount: b.weightLbs,
          Supplier: supplier,
          Notes: notes,
        });
      }

      // Screenings
      for (const b of screeningsOut) {
        const rowProducts = (b.productOverride && b.productOverride.trim())
          ? b.productOverride.trim()
          : defaultProductStr;

        await supabase.from("screening_storage_shed").insert({
          Process_ID: state.processID,
          Box_ID: b.Box_ID,
          Location: b.storageLocation || "Screening Shed",
          Lot_Number: lotNumberStr,
          Product: rowProducts,
          Amount: b.weightLbs,
          Type: "Screenings",
          Supplier: supplier,
          Notes: notes,
        });
      }

      // Update source bins based on normalized inbound net weights
      if (normalizedInbound.length) {
        const byBin = {};
        normalizedInbound.forEach((b) => {
          if (!b.binLocation) return;
          byBin[b.binLocation] = (byBin[b.binLocation] || 0) + b.netWeight;
        });

        for (const [location, removed] of Object.entries(byBin)) {
          const { data: existing, error: selErr } = await supabase
            .from("field_run_storage_test")
            .select("weight")
            .eq("location", location)
            .single();
          if (selErr) continue;
          const current = Number(existing.weight) || 0;
          const next = Math.max(current - removed, 0);
          await supabase
            .from("field_run_storage_test")
            .update({ weight: next })
            .eq("location", location);
        }
      }

      // Prepare inbound_custom snapshot (any row added via "Custom")
      const inboundCustom = normalizedInbound.filter((r) => r.sourceType === "Custom");

      // Insert Spiral report snapshot (no reruns anywhere)
      await supabase.from("spiral_reports").insert({
        process_id: state.processID,
        process_type: "Spiral",
        employee,
        suppliers: supplier,
        lot_numbers: lotNumberStr,
        products: defaultProductStr,
        notes,
        input_total: totals.inputAmount,
        output_total: totals.outputTotal,
        clean_total: totals.clean,
        screenings_total: totals.screenings,
        balance: totals.balance,
        bins_used: state.binsUsed,
        inbound_boxes: normalizedInbound,
        inbound_custom: inboundCustom,
        outputs: {
          clean: cleanOut,
          screenings: screeningsOut,
        },
        totals,
      });

      // Clear state + localStorage
      setState(DEFAULT_STATE);
      try {
        window.localStorage.removeItem(LS_KEY);
      } catch {}
      dirtyRef.current = false;
      setStatusMsg("Job completed and saved.");
      setShowValidation(false);
      alert("Spiral job completed and saved.");
    } catch (err) {
      console.error("Error completing Spiral job:", err);
      alert("Error completing job: " + err.message);
    }
  };

  /* ------------------------------ Render --------------------------------- */

  return (
    <ScrollingLayout title="Spiral Job" showBack={true}>
      <div className="mx-auto max-w-6xl p-6 bg-[#D9D9D9] flex flex-col h-full">
        <div className="mx-auto max-w-6xl p-6 space-y-6">
          {/* Header: left = form, right = summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-2xl border bg-white p-4 shadow-sm space-y-3">
              <h1 className="mb-4 text-2xl font-bold">Spiral Cleaning Process</h1>

              <div className="grid grid-cols-1 sm-grid-cols-3 sm:grid-cols-3 gap-3">
                <HeaderField label="Process ID">
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    value={state.processID}
                    onChange={(e) => setField("processID", e.target.value)}
                    placeholder="e.g., SPR-2025-11-001"
                  />
                </HeaderField>

                <HeaderField label="Job Date">
                  <input
                    type="date"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    value={state.jobDate}
                    onChange={(e) => setField("jobDate", e.target.value)}
                  />
                </HeaderField>

                <HeaderField label="Employee">
                  <select
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    value={state.selectedEmployee}
                    onChange={(e) => setField("selectedEmployee", e.target.value)}
                  >
                    <option value="">Select employee…</option>
                    {employees.map((e) => (
                      <option key={e.name} value={e.name}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </HeaderField>

                <HeaderField label="Supplier">
                  <select
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    value={state.selectedSupplier}
                    onChange={(e) => setField("selectedSupplier", e.target.value)}
                  >
                    <option value="">Select supplier…</option>
                    {suppliers.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </HeaderField>

                <HeaderField label="Lot Numbers (auto)">
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-xs bg-gray-50"
                    value={combinedLotNumbers}
                    readOnly
                  />
                </HeaderField>

                <HeaderField label="Products (auto)">
                  <input
                    className="w-full rounded-lg border px-3 py-2 text-xs bg-gray-50"
                    value={combinedProducts}
                    readOnly
                  />
                </HeaderField>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  className="rounded-xl border px-3 py-2 hover:bg-gray-50"
                  onClick={() => {
                    try {
                      window.localStorage.setItem(LS_KEY, JSON.stringify(state));
                      setStatusMsg("Draft saved.");
                    } catch {
                      setStatusMsg("Could not save draft.");
                    }
                  }}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  className="rounded-xl border px-3 py-2 hover:bg-gray-50"
                  onClick={() => {
                    if (window.confirm("Clear this Spiral draft? This cannot be undone.")) {
                      setState(DEFAULT_STATE);
                      try {
                        window.localStorage.removeItem(LS_KEY);
                      } catch {}
                      setStatusMsg("Draft cleared.");
                      dirtyRef.current = false;
                    }
                  }}
                >
                  Clear Draft
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-[#5D1214] text-white px-3 py-2 font-semibold hover:opacity-90"
                  onClick={handleComplete}
                >
                  Complete Job
                </button>
              </div>
              <span className="text-xs text-gray-500">State autosaves locally while editing.</span>

              {statusMsg && <div className="text-[10px] text-gray-600">{statusMsg}</div>}

              {showValidation && (
                <div className="mt-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] text-amber-900">
                  Please ensure Process ID, Employee, inbound, and outputs are correctly filled.
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm flex flex-col gap-2">
              <h3 className="text-sm font-semibold mb-1">Summary (Net Weights)</h3>
              <div className="grid grid-cols-2 gap-2">
                <Stat name="Inbound (lbs)" value={totals.inputAmount.toLocaleString()} />
                <Stat name="Outputs Total (lbs)" value={totals.outputTotal.toLocaleString()} />
                <Stat name="Clean (lbs)" value={totals.clean.toLocaleString()} />
                <Stat name="Screenings (lbs)" value={totals.screenings.toLocaleString()} />
                <Stat name="Balance (lbs)" value={totals.balance.toLocaleString()} />
              </div>
            </div>
          </div>

          {/* Bins Used */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold">Source Bins</h3>
              <button
                type="button"
                onClick={addBin}
                className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                + Add Bin
              </button>
            </div>
            {(!state.binsUsed || state.binsUsed.length === 0) && (
              <p className="text-xs text-gray-500">
                No bins added yet. Add bins to track which field-run locations feed this Spiral run.
              </p>
            )}
            <div className="space-y-2">
              {(state.binsUsed || []).map((bin, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center border-t pt-2 mt-1">
                  <select
                    className="rounded border px-2 py-1 text-xs"
                    value={bin.bin_location || ""}
                    onChange={(e) => updateBin(i, "bin_location", e.target.value)}
                  >
                    <option value="">Select bin…</option>
                    {bins.map((b) => (
                      <option key={b.location} value={b.location}>
                        {b.location}
                      </option>
                    ))}
                  </select>
                  <input
                    className="rounded border px-2 py-1 text-[10px]"
                    placeholder="Lots (comma-separated)"
                    value={Array.isArray(bin.lot_numbers) ? bin.lot_numbers.join(", ") : bin.lot_numbers || ""}
                    onChange={(e) => updateBin(i, "lot_numbers", e.target.value)}
                  />
                  <input
                    className="rounded border px-2 py-1 text-[10px]"
                    placeholder="Products (comma-separated)"
                    value={Array.isArray(bin.products) ? bin.products.join(", ") : bin.products || ""}
                    onChange={(e) => updateBin(i, "products", e.target.value)}
                  />
                  <input
                    className="rounded border px-2 py-1 text-[10px]"
                    placeholder="Current weight (info only)"
                    value={bin.weight || ""}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => removeBin(i)}
                    className="justify-self-start md:justify-self-end rounded border px-2 py-1 text-[10px] hover:bg-gray-50"
                  >
                    ✕ Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Inbound */}
          <InboundTable
            binsUsed={state.binsUsed || []}
            rows={state.inbound || []}
            onAdd={addInbound}
            onUpdate={updateInbound}
            onRemove={removeInbound}
            physicalBoxes={physicalBoxes}
          />

          {/* Add inbound by Box ID */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm mt-6">
            <h3 className="text-base font-semibold mb-2">Add Inbound by Box ID</h3>
            <p className="text-xs text-gray-500 mb-2">
              Pull weight / lot / product data from existing boxes (Clean / Screenings).
            </p>

            <div className="flex gap-2">
              <input
                id="spiralBoxIdInput"
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                placeholder="Enter Box ID (e.g., 1192C1)"
              />
              <button
                type="button"
                onClick={async () => {
                  const el = document.getElementById("spiralBoxIdInput");
                  const value = el.value.trim();
                  if (!value) return;
                  await addInboundFromBoxID(value);
                  el.value = "";
                }}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                + Add Box
              </button>
            </div>
          </div>

          {/* Custom inbound rows */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm mt-6">
            <h3 className="text-base font-semibold mb-2">Add Custom Inbound</h3>
            <p className="text-xs text-gray-500 mb-2">Add any number of custom inbound entries.</p>

            {customRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center mb-2">
                <input
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Lot Number"
                  value={row.lot}
                  onChange={(e) =>
                    setCustomRows((prev) => {
                      const list = [...prev];
                      list[idx].lot = e.target.value;
                      return list;
                    })
                  }
                />

                <input
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Product"
                  value={row.product}
                  onChange={(e) =>
                    setCustomRows((prev) => {
                      const list = [...prev];
                      list[idx].product = e.target.value;
                      return list;
                    })
                  }
                />

                <input
                  type="number"
                  step="any"
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Weight (lbs)"
                  value={row.weight}
                  onChange={(e) =>
                    setCustomRows((prev) => {
                      const list = [...prev];
                      list[idx].weight = e.target.value;
                      return list;
                    })
                  }
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCustomRows((prev) => prev.filter((_, i) => i !== idx))}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setCustomRows((prev) => [...prev, { lot: "", product: "", weight: "" }])}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 mb-2"
            >
              + Add Custom Row
            </button>

            <button
              type="button"
              onClick={async () => {
                for (const row of customRows) {
                  if (!row.lot || !row.product || !row.weight) continue;
                  await addInboundCustom(row.lot, row.product, row.weight);
                }
                setCustomRows([{ lot: "", product: "", weight: "" }]);
              }}
              className="rounded-xl bg-[#5D1214] px-3 py-2 text-sm font-semibold text-white hover:bg-opacity-90"
            >
              Add to Inbound
            </button>
          </div>

          {/* Outputs */}
          <div className="space-y-4">
            <OutputBoxTable
              kind="clean"
              title="Clean Output"
              color="bg-emerald-500"
              rows={state.clean || []}
              processID={state.processID}
              onAdd={() => addOutputBox("clean")}
              onUpdate={(i, f, v) => updateOutputBox("clean", i, f, v)}
              onRemove={(i) => removeOutputBox("clean", i)}
              physicalBoxes={physicalBoxes}
            />
            <OutputBoxTable
              kind="screenings"
              title="Screenings"
              color="bg-amber-500"
              rows={state.screenings || []}
              processID={state.processID}
              onAdd={() => addOutputBox("screenings")}
              onUpdate={(i, f, v) => updateOutputBox("screenings", i, f, v)}
              onRemove={(i) => removeOutputBox("screenings", i)}
              physicalBoxes={physicalBoxes}
            />
          </div>

          {/* Notes */}
          <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
            <HeaderField label="Notes">
              <textarea
                className="w-full rounded-lg border px-3 py-2 text-sm min-h-[80px]"
                value={state.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Additional details about this Spiral process…"
              />
            </HeaderField>
          </div>

          <p className="mt-4 text-[10px] text-gray-500">
            Net weights use physical box deduction whenever a Physical Box is selected.
          </p>
        </div>
      </div>
    </ScrollingLayout>
  );
}
