// pages/sortexJob.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

/* =========================================================
   Helpers
   ========================================================= */
// Format yyyy-mm-dd for <input type="date" />
const todayISO = () => new Date().toISOString().slice(0, 10);
// Coerce to number safely (treat empty/null/NaN as 0)
const safeNum = (v) => (v === "" || v === null ? 0 : Number(v) || 0);

// Create a blank output box (used by Clean/Reruns/Screenings/Trash)
// NOTE: we keep a lotNumber field internally (hidden in UI), auto-filled from bins.
const emptyBox = (defaults = {}) => ({
  boxNumber: defaults.boxNumber ?? "",
  lotNumber: defaults.lotNumber ?? "", // auto-set from bins (string like "23MB, 25TS")
  weightLbs: defaults.weightLbs ?? "",
  storageLocation: defaults.storageLocation ?? "",
  date: defaults.date ?? todayISO(),
});

/* LocalStorage key for draft */
const LS_KEY = "sortexCleaningDraft";

/* =========================================================
   Default State
   ========================================================= */
const DEFAULT_STATE = {
  processID: "",
  jobDate: todayISO(),

  // Source bins the user selects for this job
  // Each item: { bin_location, product, lot_number, weight }
  // product & lot_number are read-only snapshots for UX; bin DB remains source of truth.
  binsUsed: [],

  boxSources: [], // list of boxes pulled from other storage sources

  customSources: [],

  notes: "",

  // All boxes recorded in the job
  boxes: {
    // Inbound boxes (pre-mill): specify which bin they came from
    // Each row: { fromBin, boxNumber, weightLbs }
    inbound: [],

    // Output sections: all are "standard" box rows (no lot input in UI, auto-attached)
    clean: [],
    reruns: [],
    screenings: {
      Air: [],
      Dust: [],
      Gra: [],
      Graheavy: [],
      Gralight: [],
      Large: [],
      Small: [],
      Spiral: [],
      "Destoner-Light": [],
      "Destoner-Heavy": [],
    },
    trash: [],
  },
};

/* =========================================================
   Small Reusable UI pieces
   ========================================================= */
const HeaderField = ({ label, children, hint }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {children}
    {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
  </div>
);

const Stat = ({ name, value, muted }) => (
  <div className={`rounded-2xl border p-3 ${muted ? "opacity-70" : ""}`}>
    <div className="text-xs text-gray-500">{name}</div>
    <div className="text-lg font-semibold tabular-nums">{value}</div>
  </div>
);

/* =========================================================
   Generic Box Table (for Clean, Reruns, Trash, Screenings subtables)
   - No LOT column (auto-attached internally from bins)
   ========================================================= */
function BoxTable({
  kind,              // "clean" | "reruns" | "trash" | "screenings:<Subtype>" (only for label)
  title,
  color,
  rows = [],
  addBox,
  updateBox,
  removeBox,
}) {
  const subtotal = rows.reduce((acc, b) => acc + safeNum(b.weightLbs), 0);

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${color}`} />
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addBox}
            className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            + Add Box
          </button>
          <div className="text-sm text-gray-600">
            Subtotal: <span className="font-semibold">{subtotal.toLocaleString()} lbs</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed">
          <thead>
            <tr className="text-left text-sm text-gray-600 bg-gray-50">
              <th className="px-4 py-2 w-24">Box #</th>
              <th className="px-4 py-2 w-40">Weight (lbs)</th>
              <th className="px-4 py-2 w-56">Storage Location</th>
              <th className="px-4 py-2 w-44">Date</th>
              <th className="px-4 py-2 w-20">Remove</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                  No boxes yet. Click “Add Box”.
                </td>
              </tr>
            ) : (
              rows.map((b, i) => (
                <tr key={`${kind}-${i}`} className="border-b">
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded-lg border px-2 py-1.5 text-sm"
                      type="number"
                      value={b.boxNumber}
                      onChange={(e) => updateBox(i, "boxNumber", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded-lg border px-2 py-1.5 text-sm tabular-nums"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={b.weightLbsRaw ?? b.weightLbs ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;

                        // Save the raw string immediately (so typing is smooth)
                        updateBox(i, "weightLbsRaw", val);

                        // Only update numeric weight if it’s valid
                        if (!isNaN(Number(val)) && val.trim() !== "") {
                          updateBox(i, "weightLbs", Number(val));
                        }
                      }}
                    />
                  </td>
                  {kind === "clean" || kind === "reruns" ? (
                    <td className="px-4 py-2">
                      <select
                        className="w-full rounded-lg border px-2 py-1.5 text-sm bg-white"
                        value={b.storageLocation || ""}
                        onChange={(e) => updateBox(i, "storageLocation", e.target.value)}  
                      >
                        <option value="">Select location…</option>
                        <option value="Refrigerator">Refrigerator</option>
                        <option value="Refer-Trailer">Refer-Trailer</option>
                        <option value="Inside Co2">Inside Co2</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                  ) : (
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded-lg border px-2 py-1.5 text-sm"
                        type="text"
                        placeholder="e.g., Storage Area"
                        value={b.storageLocation || ""}
                        onChange={(e) => updateBox(i, "storageLocation", e.target.value)}  
                      />
                    </td>
                  )}

                  <td className="px-4 py-2">
                    <input
                      type="date"
                      className="w-full rounded-lg border px-2 py-1.5 text-sm"
                      value={b.date || todayISO()}
                      onChange={(e) => updateBox(i, "date", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeBox(i)}
                      className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   Screenings (Tabbed)
   - Reuses BoxTable for the active tab
   ========================================================= */
function ScreeningsTabs({ screenings, onAdd, onUpdate, onRemove }) {
  const [active, setActive] = useState("Air");
  const tabs = Object.keys(screenings || {});
  const rows = screenings?.[active] || [];

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                active === t ? "bg-amber-500 text-white border-amber-500" : "bg-white hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <h3 className="text-base font-semibold text-gray-700">Screenings Boxes</h3>
      </div>

      <div className="p-4">
        <BoxTable
          kind={`screenings:${active}`}
          title={`${active} Screenings`}
          color="bg-amber-500"
          rows={rows}
          addBox={() => onAdd(active)}
          updateBox={(i, field, value) => onUpdate(active, i, field, value)}
          removeBox={(i) => onRemove(active, i)}
        />
      </div>
    </div>
  );
}

/* =========================================================
   Inbound Table (special columns, per-bin dropdown)
   ========================================================= */
function InboundTable({ binsUsed, rows = [], onAdd, onUpdate, onRemove }) {
  const subtotal = rows.reduce((acc, b) => acc + safeNum(b.weightLbs), 0);

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-sky-500" />
          <h3 className="text-base font-semibold">Inbound Boxes (Pre-Mill)</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAdd}
            className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
            disabled={binsUsed.length === 0}
            title={binsUsed.length === 0 ? "Add at least one source bin first" : ""}
          >
            + Add Box
          </button>
          <div className="text-sm text-gray-600">
            Subtotal: <span className="font-semibold">{subtotal.toLocaleString()} lbs</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] table-fixed">
          <thead>
            <tr className="text-left text-sm text-gray-600 bg-gray-50">
              <th className="px-4 py-2 w-48">From Bin</th>
              <th className="px-4 py-2 w-24">Box #</th>
              <th className="px-4 py-2 w-40">Weight (lbs)</th>
              <th className="px-4 py-2 w-20">Remove</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  No inbound boxes yet. Click “Add Box”.
                </td>
              </tr>
            ) : (
              rows.map((b, i) => (
                <tr key={`inbound-${i}`} className="border-b">
                  <td className="px-4 py-2">
                    <select
                      value={b.fromBin || ""}
                      onChange={(e) => onUpdate(i, "fromBin", e.target.value)}
                      className="border rounded-lg px-2 py-1.5 text-sm w-full"
                    >
                      <option value="">Select Bin…</option>
                      {binsUsed.map((bin, idx) => (
                        <option key={`${bin.bin_location}-${idx}`} value={bin.bin_location}>
                          {bin.bin_location}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded-lg border px-2 py-1.5 text-sm"
                      type="number"
                      value={b.boxNumber}
                      onChange={(e) => onUpdate(i, "boxNumber", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded-lg border px-2 py-1.5 text-sm tabular-nums"
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={b.weightLbsRaw ?? b.weightLbs ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;

                        // Save raw string immediately (prevents flicker)
                        onUpdate(i, "weightLbsRaw", val);

                        // Only update numeric weight if valid
                        if (!isNaN(Number(val)) && val.trim() !== "") {
                          onUpdate(i, "weightLbs", Number(val));
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => onRemove(i)}
                      className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   Main Page
   ========================================================= */
export default function SortexCleaningPage() {
  const supabase = useSupabaseClient();

  // Full UI state
  const [state, setState] = useState(DEFAULT_STATE);

  // Live list of bins from DB (field_run_storage_test)
  const [availableBins, setAvailableBins] = useState([]);
  const [loadingBins, setLoadingBins] = useState(true);

  // UI helpers
  const [statusMsg, setStatusMsg] = useState("");
  const [showValidation, setShowValidation] = useState(false);

  //for the supplyer dropdown
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const [newBoxId, setNewBoxId] = useState("");

  /* -------------------------
     Idle-aware Autosave
     - Keep refs to avoid re-render resets while typing
     ------------------------- */
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const lastSavedRef = useRef(Date.now());
  const stateRef = useRef(state);
  const dirtyRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const markTyping = () => {
    isTypingRef.current = true;
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false; // no typing for 5s
    }, 5000);
  };

  /* -------------------------
     Load draft (normalize any old shapes)
     ------------------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const scr = parsed?.boxes?.screenings || {};
        const normalized = {
          processID: parsed.processID ?? DEFAULT_STATE.processID,
          jobDate: parsed.jobDate ?? DEFAULT_STATE.jobDate,
          binsUsed: Array.isArray(parsed.binsUsed) ? parsed.binsUsed : [],
          notes: parsed.notes ?? "",
          boxes: {
            inbound: Array.isArray(parsed?.boxes?.inbound) ? parsed.boxes.inbound : [],
            clean: Array.isArray(parsed?.boxes?.clean) ? parsed.boxes.clean : [],
            reruns: Array.isArray(parsed?.boxes?.reruns) ? parsed.boxes.reruns : [],
            screenings: {
              Air: Array.isArray(scr.Air) ? scr.Air : [],
              Dust: Array.isArray(scr.Dust) ? scr.Dust : [],
              Gra: Array.isArray(scr.Gra) ? scr.Gra : [],
              Graheavy: Array.isArray(scr.Graheavy) ? scr.Graheavy : [],
              Gralight: Array.isArray(scr.Gralight) ? scr.Gralight : [],
              Large: Array.isArray(scr.Large) ? scr.Large : [],
              Small: Array.isArray(scr.Small) ? scr.Small : [],
              Spiral: Array.isArray(scr.Spiral) ? scr.Spiral : [],
              "Destoner-Light": Array.isArray(scr["Destoner-Light"]) ? scr["Destoner-Light"] : [],
              "Destoner-Heavy": Array.isArray(scr["Destoner-Heavy"]) ? scr["Destoner-Heavy"] : [],
            },
            trash: Array.isArray(parsed?.boxes?.trash) ? parsed.boxes.trash : [],
          },
        };
        setState({ ...DEFAULT_STATE, ...normalized });
      }
    } catch (e) {
      console.warn("Draft load error", e);
    }
  }, []);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data, error } = await supabase.from("customers").select("name");
        if (error) throw error;
        setSuppliers(data || []);
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);

  /* -------------------------
     Autosave every minute (check every 5s)
     ------------------------- */
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      if (!isTypingRef.current && dirtyRef.current && now - lastSavedRef.current >= 60000) {
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(stateRef.current));
          setStatusMsg("Draft autosaved.");
          lastSavedRef.current = now;
          dirtyRef.current = false;
        } catch (e) {
          console.warn("Autosave failed:", e);
        }
      }
    }, 5000);
    return () => clearInterval(t);
  }, []);

  /* -------------------------
     Fetch bins from Supabase
     ------------------------- */

  const siloOrder = [
  "HQ-1","HQ-2","HQ-3","HQ-4","HQ-5","HQ-6","HQ-7","HQ-8","HQ-9","HQ-10",
  "HQ-11","HQ-12","HQ-13","HQ-14","HQ-15","HQ-16","HQ-17","HQ-18",
  "BEN-5","BEN-6","BEN-7","BEN-8","BEN-9","BEN-10","BEN-11","BEN-12",
  "Co2-1","Co2-2","Boxes-Mill"
];

  useEffect(() => {
    const fetchBins = async () => {
      setLoadingBins(true);
      const { data, error } = await supabase
        .from("field_run_storage_test")
        .select("location, lot_number, product, weight");

      if (error) {
        console.error("Error loading bins:", error);
        setAvailableBins([]);
      } else {
        // Normalize: Supabase jsonb -> JS arrays/strings
        const normalized = (data || []).map((row) => ({
          location: row.location,
          // Ensure arrays (lot_number/product could be JSONB arrays)
          lot_number: Array.isArray(row.lot_number)
            ? row.lot_number
            : typeof row.lot_number === "string"
            ? [row.lot_number]
            : [],
          product: Array.isArray(row.product)
            ? row.product
            : typeof row.product === "string"
            ? [row.product]
            : [],
          weight: Number(row.weight) || 0,
        }));
        // Sort bins in fixed order
        const ordered = [...normalized].sort((a, b) => {
          const ai = siloOrder.indexOf(a.location);
          const bi = siloOrder.indexOf(b.location);
          // Put known bins first in the specified order, others alphabetically
          if (ai === -1 && bi === -1) return a.location.localeCompare(b.location);
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        });
        setAvailableBins(ordered);
      }
      setLoadingBins(false);
    };

    fetchBins();
  }, [supabase]);

  /* -------------------------
     Header helpers
     ------------------------- */
  // 🔹 Combined Lot Numbers (bins + box sources)
  const combinedLotString = useMemo(() => {
    const lots = [
      ...(state.binsUsed?.flatMap((b) => b.lot_number || []) || []),
      ...(state.boxSources?.map((b) => b.lotNumber) || []),
      ...(state.customSources?.map((b) => b.lotNumber) || []),
    ]
      .filter(Boolean)
      .map((x) => x.trim().toUpperCase());

    const uniqueLots = [...new Set(lots)];
    return uniqueLots.join(", ");
  }, [state.binsUsed, state.boxSources, state.customSources]);


  // ✅ Collect unique Products
  const combinedProductString = useMemo(() => {
    const products = [
      ...(state.binsUsed?.flatMap((b) => b.product || []) || []),
      ...(state.boxSources?.map((b) => b.product) || []),
      ...(state.customSources?.map((b) => b.product) || []),
    ]
      .filter(Boolean)
      .map((x) => x.trim().toUpperCase());

    // Remove duplicates
    const uniqueProducts = [...new Set(products)];
    return uniqueProducts.join(", ");
  }, [state.binsUsed, state.boxSources, state.customSources]);

  // Amount Removed is the sum of inbound weights
  const inputAmount = useMemo(() => {
    const inbound = state.boxes.inbound || [];
    return inbound.reduce((sum, b) => sum + safeNum(b.weightLbs), 0);
  }, [state.boxes.inbound]);

  /* -------------------------
     Utilities to mark typing + dirty
     ------------------------- */
  const touch = () => {
    dirtyRef.current = true;
    markTyping();
  };

  const setField = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
    touch();
  };

  /* -------------------------
     Source Bins Handlers
     ------------------------- */
  const addBin = () => {
    setState((prev) => ({
      ...prev,
      binsUsed: [...prev.binsUsed, { bin_location: "", product: "", lot_number: "", weight: 0 }],
    }));
    touch();
  };

  const removeBin = (index) => {
    setState((prev) => ({
      ...prev,
      binsUsed: prev.binsUsed.filter((_, i) => i !== index),
    }));
    touch();
  };

  const handleBinChange = (index, field, value) => {
    setState((prev) => {
      const bins = [...prev.binsUsed];
      bins[index][field] = value;

      // If bin changed, copy product/lot/weight from DB for display (read-only)
      if (field === "bin_location") {
        const dbBin = availableBins.find((b) => b.location === value);
        if (dbBin) {
          bins[index].product = dbBin.product.join(", ");
          bins[index].lot_number = dbBin.lot_number.join(", ");
          bins[index].weight = dbBin.weight || 0;
        } else {
          bins[index].product = "";
          bins[index].lot_number = "";
          bins[index].weight = 0;
        }
      }
      return { ...prev, binsUsed: bins };
    });
    touch();
  };

  /* -------------------------
     Inbound Handlers
     ------------------------- */
  const addInbound = () => {
    setState((prev) => {
      const nextNum =
        (prev.boxes.inbound.reduce((m, b) => Math.max(m, Number(b.boxNumber) || 0), 0) || 0) + 1;
      const row = { fromBin: "", boxNumber: nextNum, weightLbs: "" };
      return { ...prev, boxes: { ...prev.boxes, inbound: [...prev.boxes.inbound, row] } };
    });
    touch();
  };

  const updateInbound = (index, field, value) => {
    setState((prev) => {
      const inbound = [...prev.boxes.inbound];
      inbound[index] = { ...inbound[index], [field]: value };
      return { ...prev, boxes: { ...prev.boxes, inbound } };
    });
    touch();
  };

  const removeInbound = (index) => {
    setState((prev) => {
      const inbound = [...prev.boxes.inbound];
      inbound.splice(index, 1);
      return { ...prev, boxes: { ...prev.boxes, inbound } };
    });
    touch();
  };

  // Remove a scanned box source and its linked inbound row
  function removeBoxSource(index) {
    setState((prev) => {
      const removed = prev.boxSources[index];
      if (!removed) return prev;

      const nextBoxSources = prev.boxSources.filter((_, i) => i !== index);

      // Remove any inbound rows linked to that box
      const nextInbound = (prev.boxes?.inbound || []).filter(
        (b) => !(b.fromBoxId === removed.boxId && b.fromSourceTable === removed.table)
      );

      return {
        ...prev,
        boxSources: nextBoxSources,
        boxes: { ...(prev.boxes || {}), inbound: nextInbound },
      };
    });

    if (dirtyRef?.current !== undefined) dirtyRef.current = true;
  }

  /* -------------------------
     Add/Update/Remove for output sections
     - Clean, Reruns, Trash: standard arrays
     - Screenings: per-subtype arrays
     - When adding, auto-attach lotNumber = combinedLotString (current)
     ------------------------- */
  const addOutputBox = (section, subtype = null) => {
    setState((prev) => {
      const next = structuredClone(prev);
      const lotStr = combinedLotString; // attach snapshot of lots at add-time

      let arr;
      if (section === "screenings" && subtype) {
        arr = next.boxes.screenings[subtype];
      } else {
        arr = next.boxes[section];
      }

      const nextNum = (arr.reduce((m, b) => Math.max(m, Number(b.boxNumber) || 0), 0) || 0) + 1;
      const newBox = emptyBox({
        boxNumber: nextNum,
        lotNumber: state.siloLotNumber || "",
        date: prev.jobDate || todayISO(),
      });

      arr.push(newBox);
      return next;
    });
    touch();
  };

  const updateOutputBox = (section, index, field, value, subtype = null) => {
    setState((prev) => {
      const next = structuredClone(prev);

      // Handle screenings subtype safety
      if (section === "screenings" && subtype) {
        if (!next.boxes.screenings[subtype]) next.boxes.screenings[subtype] = [];
        if (!next.boxes.screenings[subtype][index])
          next.boxes.screenings[subtype][index] = {};
        next.boxes.screenings[subtype][index][field] = value;
      } else {
        if (!next.boxes[section]) next.boxes[section] = [];
        if (!next.boxes[section][index]) next.boxes[section][index] = {};
        next.boxes[section][index][field] = value;
      }

      return next;
    });
    touch();
  };

  const removeOutputBox = (section, index, subtype = null) => {
    setState((prev) => {
      const next = structuredClone(prev);
      if (section === "screenings" && subtype) {
        next.boxes.screenings[subtype].splice(index, 1);
      } else {
        next.boxes[section].splice(index, 1);
      }
      return next;
    });
    touch();
  };

  /* -------------------------
     Totals & Summary
     ------------------------- */
  const sumArr = (arr) => arr.reduce((t, b) => t + safeNum(b.weightLbs), 0);
  const totals = useMemo(() => {
    const screeningsTotal = Object.values(state.boxes.screenings).reduce(
      (acc, arr) => acc + sumArr(arr),
      0
    );
    return {
      clean: sumArr(state.boxes.clean),
      reruns: sumArr(state.boxes.reruns),
      screenings: screeningsTotal,
      trash: sumArr(state.boxes.trash),
    };
  }, [state.boxes]);

  const outputsGrandTotal = totals.clean + totals.reruns + totals.screenings + totals.trash;
  const balance = inputAmount - outputsGrandTotal;

  /* -------------------------
     Validation & Complete (UI only; DB wiring is next step)
     ------------------------- */
  function validate() {
    const errs = [];

    if (!state.processID.trim()) errs.push("Process ID is required.");

    // ✅ Require at least one input source (bin or box)
    const hasBinSource = state.binsUsed?.length > 0;
    const hasBoxSource = state.boxSources?.length > 0;

    if (
      (!state.binsUsed || state.binsUsed.length === 0) &&
      (!state.boxSources || state.boxSources.length === 0) &&
      (!state.customSources || state.customSources.length === 0)
    ) {
      errors.push("Please select at least one source bin, source box, or custom box.");
    }

    // ✅ Ensure inbound exists (either from bins or box sources)
    if ((state.boxes.inbound?.length || 0) === 0) {
      errs.push("Please add at least one inbound box (from bin or box source).");
    }

    return errs;
  }


  // 🔹 Add Box Source by BoxID
  async function handleAddBoxSource(boxId) {
    if (!boxId.trim()) {
      alert("Please enter a Box ID.");
      return;
    }

    const { supabase } = await import("../lib/supabaseClient");
    let found = null;
    const tables = ["clean_product_storage", "rerun_product_storage", "screening_storage_shed"];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("Box_ID", boxId.trim())
        .maybeSingle();

      if (data) {
        found = { ...data, sourceTable: table };
        break;
      }
    }

    if (!found) {
      alert("❌ Box not found in any source table.");
      return;
    }

    const newSource = {
      boxId: found.Box_ID,
      table: found.sourceTable,
      lotNumber: found.Lot_Number || "",
      product: found.Product || "",
      weightLbs: Number(found.Amount) || 0,
    };

    setState((prev) => ({
      ...prev,
      boxSources: [...prev.boxSources, newSource],
      boxes: {
        ...prev.boxes,
        inbound: [
          ...prev.boxes.inbound,
          {
            fromBoxId: found.Box_ID,
            fromSourceTable: found.sourceTable,
            weightLbs: Number(found.Amount) || 0,
            // ⬇ add these so header & save logic can “see” them
            lotNumber: found.Lot_Number || "",
            product: found.Product || "",
          },
        ],
      },
    }));

    setNewBoxId("");
    setStatusMsg(`✅ Added ${boxId} as a source box.`);
  }


  // ✅ Complete Job handler (saves all data to Supabase)
  // ✅ Complete Job handler (saves all data to Supabase)
const handleComplete = async () => {
  const errs = validate();
  setShowValidation(true);
  if (errs.length) {
    alert("Please fix the following before completing:\n\n" + errs.join("\n"));
    return;
  }

  // --- Supabase client ---
  const { supabase } = await import("../lib/supabaseClient");

  // --- Safe lot number, supplier, and product (use memoized strings) ---
  const lotNumber = combinedLotString || "";
  const supplier = selectedSupplier || null;
  const productName = combinedProductString || "";

  // --- Helper: safely sum weights ---
  const sum = (arr) =>
    Array.isArray(arr)
      ? arr.reduce((acc, b) => acc + (Number(b.weightLbs) || 0), 0)
      : 0;

  const inputAmount = sum(state.boxes.inbound) + sum(state.customSources);
  const outputsGrandTotal =
    sum(state.boxes.clean) +
    sum(state.boxes.reruns) +
    sum(state.boxes.trash) +
    Object.values(state.boxes.screenings || {}).reduce(
      (acc, list) => acc + sum(list),
      0
    );
  const balance = inputAmount - outputsGrandTotal;

  const totals = {
    inputAmount,
    clean: sum(state.boxes.clean),
    reruns: sum(state.boxes.reruns),
    screenings: Object.values(state.boxes.screenings || {}).reduce(
      (acc, list) => acc + sum(list),
      0
    ),
    trash: sum(state.boxes.trash),
    outputsGrandTotal,
    balance,
  };

  try {
    // ✅ CLEAN STORAGE
    for (const box of state.boxes.clean) {
      const boxId = `${state.processID}C${box.boxNumber}`;
      await supabase.from("clean_product_storage").insert({
        Process_ID: state.processID,
        Box_ID: boxId,
        Location: box.storageLocation || "",
        Lot_Number: lotNumber,
        Product: productName,
        Amount: Number(box.weightLbs) || 0,
        Supplier: supplier,
        Date_Stored: new Date().toISOString(),
        Notes: state.notes?.trim() || null,
      });
    }

    // ✅ RERUN STORAGE
    for (const box of state.boxes.reruns) {
      const boxId = `${state.processID}R${box.boxNumber}`;
      await supabase.from("rerun_product_storage").insert({
        Process_ID: state.processID,
        Box_ID: boxId,
        Location: box.storageLocation || "",
        Lot_Number: lotNumber,
        Product: productName,
        Amount: Number(box.weightLbs) || 0,
        Supplier: supplier,
        Date_Stored: new Date().toISOString(),
        Notes: state.notes?.trim() || null,
      });
    }

    // ✅ SCREENING STORAGE
    for (const [type, boxes] of Object.entries(state.boxes.screenings || {})) {
      const typeCode = {
        Air: "SA",
        Dust: "SD",
        Gra: "SG",
        Graheavy: "SGH",
        Gralight: "SGL",
        Large: "SL",
        Small: "SS",
        Spiral: "SSP",
        "Destoner-Light": "SDL",
        "Destoner-Heavy": "SDH",
      }[type] || "S";

      for (const box of boxes) {
        const boxId = `${state.processID}${typeCode}${box.boxNumber}`;
        await supabase.from("screening_storage_shed").insert({
          Process_ID: state.processID,
          Box_ID: boxId,
          Location: "Screening Shed",
          Lot_Number: lotNumber,
          Product: productName,
          Amount: Number(box.weightLbs) || 0,
          Type: type,
          Supplier: supplier,
          Date_Stored: new Date().toISOString(),
          Notes: state.notes?.trim() || null,
        });
      }
    }

    // ✅ TRASH STORAGE
    for (const box of state.boxes.trash) {
      await supabase.from("trash").insert({
        Process_ID: state.processID,
        Location: "Trash Shed",
        Lot_Number: lotNumber,
        Product: productName,
        Amount: Number(box.weightLbs) || 0,
        Supplier: supplier,
        Date_Stored: new Date().toISOString(),
        Notes: state.notes?.trim() || null,
      });
    }

    // ✅ Update bin weights
    const weightByBin = {};
        for (const box of state.boxes.inbound || []) {
        const loc = box.fromBin || box.binLocation || box.location || ""; // ✅ FIXED HERE
        const weight = Number(box.weightLbs) || 0;
        if (!loc) continue;
        weightByBin[loc] = (weightByBin[loc] || 0) + weight;
    }

    for (const [location, removedWeight] of Object.entries(weightByBin)) {
      const { data: existing, error: fetchError } = await supabase
        .from("field_run_storage_test")
        .select("weight")
        .eq("location", location)
        .single();

      if (fetchError) {
        console.warn(`Failed to fetch bin ${location}:`, fetchError.message);
        continue;
      }

      const currentWeight = Number(existing?.weight) || 0;
      const newWeight = Math.max(currentWeight - removedWeight, 0);

      const { error: updateError } = await supabase
        .from("field_run_storage_test")
        .update({ weight: newWeight })
        .eq("location", location);

      if (updateError)
        console.error(`Failed to update bin ${location}:`, updateError.message);
      else console.log(`✅ Updated ${location}: ${currentWeight} → ${newWeight}`);
    }

    // ✅ Delete used box sources from their source tables
    for (const source of state.boxSources || []) {
      const { error: deleteError } = await supabase
        .from(source.table)
        .delete()
        .eq("Box_ID", source.boxId);

      if (deleteError) {
        console.error(
          `❌ Failed to delete ${source.boxId} from ${source.table}:`,
          deleteError.message
        );
      } else {
        console.log(`✅ Deleted ${source.boxId} from ${source.table}`);
      }
    }

    // ✅ Save Full Detailed sortex Report
    try {
      const reportPayload = {
        process_id: state.processID,
        suppliers: supplier || null,
        lot_numbers: combinedLotString || "",
        products: combinedProductString || "",
        notes: state.notes?.trim() || null,
        input_total: totals.inputAmount,
        output_total: totals.outputsGrandTotal,
        clean_total: totals.clean,
        rerun_total: totals.reruns,
        screenings_total: totals.screenings,
        trash_total: totals.trash,
        balance: totals.balance,

        bins_used: JSON.stringify(state.binsUsed || []),
        inbound_boxes: JSON.stringify({
          fromBins: state.boxes.inbound || [],
          fromSources: state.boxSources || [],
          fromCustom: state.customSources || [],
        }),
        outputs: JSON.stringify({
          clean: (state.boxes.clean || []).map((b) => ({
            ...b,
            Box_ID: `${state.processID}C${b.boxNumber}`,
          })),
          reruns: (state.boxes.reruns || []).map((b) => ({
            ...b,
            Box_ID: `${state.processID}R${b.boxNumber}`,
          })),
          screenings: Object.fromEntries(
            Object.entries(state.boxes.screenings || {}).map(([type, arr]) => {
              const typeCode = {
                Air: "SA",
                Dust: "SD",
                Gra: "SG",
                Graheavy: "SGH",
                Gralight: "SGL",
                Large: "SL",
                Small: "SS",
                Spiral: "SSP",
                "Destoner-Light": "SDL",
                "Destoner-Heavy": "SDH",
              }[type] || "S";
              return [
                type,
                (arr || []).map((b) => ({
                  ...b,
                  Box_ID: `${state.processID}${typeCode}${b.boxNumber}`,
                })),
              ];
            })
          ),
          trash: (state.boxes.trash || []).map((b) => ({
            ...b,
            Box_ID: `${state.processID}T${b.boxNumber || ""}`,
          })),
        }),

        totals: JSON.stringify(totals),
      };

      const { error: reportError } = await supabase
        .from("sortex_reports")
        .insert(reportPayload);

      if (reportError) {
        console.error("❌ Failed to save Sortex report:", reportError.message);
      } else {
        console.log("✅ Detailed Sortex report saved successfully.");
      }
    } catch (err) {
      console.error("❌ Unexpected error saving Sortex report:", err);
    }

    // ✅ Clear draft & reset UI
    setState(DEFAULT_STATE);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
    setStatusMsg("Job completed and saved to Supabase!");
    setShowValidation(false);
    dirtyRef.current = false;

    alert("✅ Job successfully saved to Supabase!");
  } catch (err) {
    console.error("❌ Error saving job:", err);
    alert("Error saving job: " + err.message);
  }
};


  /* =========================================================
     Render
     ========================================================= */
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-center">Sortex Cleaning Process</h1>

        {/* ================= Header + Summary Side by Side ================ */}
<div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Left: Process + Lot + Job controls */}
  <div className="rounded-2xl border bg-white p-4 shadow-sm">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Row 1 */}
      <HeaderField label="Process ID">
        <input
          className="w-full rounded-lg border px-3 py-2"
          placeholder="e.g., QS-2025-10-0012"
          value={state.processID}
          onChange={(e) => setField("processID", e.target.value)}
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

      {/* Row 2 */}
      <HeaderField label="Lot #">
        <input
          className="w-full rounded-lg border px-3 py-2 bg-gray-100 text-gray-700"
          value={combinedLotString ? `Lot #: ${combinedLotString}` : "Lot #: —"}
          readOnly
        />
      </HeaderField>

      <HeaderField label="Amount Removed (lbs)" hint="Calculated from inbound boxes.">
        <input
          className="w-full rounded-lg border px-3 py-2 bg-gray-100 text-gray-700"
          value={inputAmount.toLocaleString()}
          readOnly
        />
      </HeaderField>

      <HeaderField label="Product">
        <input
          className="w-full rounded-lg border px-3 py-2 bg-gray-100"
          type="text"
          readOnly
          value={combinedProductString || ""}
        />
      </HeaderField>
      
      <HeaderField label="Supplier" hint="Select supplier for this Sortex run.">
        <select
          className="w-full rounded-lg border px-3 py-2 bg-white"
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
        >
          <option value="">Select a supplier…</option>
          {suppliers.map((s, idx) => (
            <option key={idx} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </HeaderField>

      {/* Buttons */}
      <div className="flex items-end gap-2 col-span-full">
        <button
          type="button"
          className="flex-1 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          onClick={() => {
            try {
              localStorage.setItem(LS_KEY, JSON.stringify(state));
              setStatusMsg("Draft saved.");
              dirtyRef.current = false;
            } catch {
              setStatusMsg("Could not save draft.");
            }
          }}
        >
          Save Draft
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          onClick={() => {
            if (!confirm("Clear the current draft? This cannot be undone.")) return;
            setState(DEFAULT_STATE);
            try {
              localStorage.removeItem(LS_KEY);
            } catch {}
            setStatusMsg("Draft cleared.");
            dirtyRef.current = false;
          }}
        >
          Clear Draft
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          onClick={handleComplete}
        >
          Complete Job
        </button>
      </div>

      {statusMsg ? (
        <div className="col-span-full text-sm text-gray-600">{statusMsg}</div>
      ) : null}

      {showValidation && (
        <div className="col-span-full rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Ensure Process ID, Job Date, Source Bins, Inbound boxes, and at least one output box are set.
        </div>
      )}
    </div>
  </div>

  {/* Right: Summary */}
  <div className="rounded-2xl border bg-white p-4 shadow-sm">
    <h3 className="mb-3 text-base font-semibold">Summary</h3>
    <div className="grid grid-cols-2 gap-3">
      <Stat name="Input (lbs)" value={inputAmount.toLocaleString()} />
      <Stat name="Outputs Total (lbs)" value={outputsGrandTotal.toLocaleString()} />
      <Stat name="Clean (lbs)" value={totals.clean.toLocaleString()} muted />
      <Stat name="Reruns (lbs)" value={totals.reruns.toLocaleString()} muted />
      <Stat name="Screenings (lbs)" value={totals.screenings.toLocaleString()} muted />
      <Stat name="Trash (lbs)" value={totals.trash.toLocaleString()} muted />
      <Stat name="Balance (lbs)" value={balance.toLocaleString()} />
    </div>
  </div>
</div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Inbound Section</h3>
        {/* ================= Source Bins ================ */}
        <div className="mb-8 rounded-2xl border-2 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-center">Source Bins</h2>

          {loadingBins ? (
            <p className="text-sm text-gray-600 text-center">Loading available bins…</p>
          ) : (
            <>
              {state.binsUsed.length === 0 && (
                <p className="text-sm text-gray-500 text-center mb-3">
                  No bins added yet. Click “Add Bin” to begin.
                </p>
              )}

              {state.binsUsed.map((bin, index) => (
                <div
                  key={`bin-${index}`}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3 items-center border-b pb-3"
                >
                  <select
                    value={bin.bin_location}
                    onChange={(e) => handleBinChange(index, "bin_location", e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select Bin…</option>
                    {availableBins.map((b) => (
                      <option key={b.location} value={b.location}>
                        {b.location}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={bin.product}
                    readOnly
                    placeholder="Product"
                    className="border rounded-lg px-3 py-2 text-sm bg-gray-100"
                  />
                  <input
                    type="text"
                    value={bin.lot_number}
                    readOnly
                    placeholder="Lot Number"
                    className="border rounded-lg px-3 py-2 text-sm bg-gray-100"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">
                      {bin.weight ? `${bin.weight} lbs` : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBin(index)}
                      className="text-red-500 text-sm hover:underline ml-3"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={addBin}
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  + Add Bin
                </button>
              </div>
            </>
          )}
        </div>

        {/* ================= Inbound (Pre-Mill) ================ */}
        <div className="mb-8 rounded-2xl  bg-white p-4 shadow-s">
          <InboundTable
            binsUsed={state.binsUsed}
            rows={state.boxes.inbound}
            onAdd={addInbound}
            onUpdate={updateInbound}
            onRemove={removeInbound}
          />
        </div>

        {/* 🔹 Box Sources Section */}
        <div className="mb-8 rounded-2xl border-2 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold mb-3">Box Sources</h3>

          {/* Input Row */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter Box ID (e.g., 1234C1)"
              value={newBoxId}
              onChange={(e) => setNewBoxId(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1"
            />
            <button
              type="button"
              className="rounded-lg bg-black text-white px-4 py-2"
              onClick={() => handleAddBoxSource(newBoxId)}
            >
              + Add Box Source
            </button>
          </div>

          {/* Table */}
          <table className="w-full text-sm border-t table-fixed">
            <thead>
              <tr className="text-gray-600 text-center">
                <th className="px-2 py-1 w-40">Box ID</th>
                <th className="px-2 py-1 w-36">Source</th>
                <th className="px-2 py-1 w-36">Lot #</th>
                <th className="px-2 py-1 w-40">Product</th>
                <th className="px-2 py-1 w-32">Weight (lbs)</th>
                <th className="px-2 py-1 w-20">Remove</th>
              </tr>
            </thead>
            <tbody>
              {state.boxSources.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-400 py-2">
                    No box sources yet.
                  </td>
                </tr>
              ) : (
                state.boxSources.map((b, i) => (
                  <tr key={i} className="border-t text-center">
                    <td className="px-2 py-1">{b.boxId}</td>
                    <td className="px-2 py-1">
                      {b.table === "clean_product_storage"
                        ? "Clean"
                        : b.table === "rerun_product_storage"
                        ? "Rerun"
                        : b.table === "screening_storage_shed"
                        ? "Screenings"
                        : b.table}
                    </td>
                    <td className="px-2 py-1">{b.lotNumber || "—"}</td>
                    <td className="px-2 py-1">{b.product || "—"}</td>
                    <td className="px-2 py-1">{(Number(b.weightLbs) || 0).toLocaleString()}</td>
                    <td className="px-2 py-1">
                      <button
                        type="button"
                        onClick={() => removeBoxSource(i)}
                        className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
                        aria-label="Remove box source"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 🟩 CUSTOM SOURCE BOXES SECTION */}
        <div className="mb-8 rounded-2xl border-2 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Custom Source Boxes</h3>
            <button
              type="button"
              onClick={() => {
                setState((prev) => {
                  const newBox = { lotNumber: "", product: "", weightLbs: "" };

                  const updatedCustom = [...prev.customSources, newBox];

                  // Automatically add a corresponding inbound placeholder (linked)
                  const updatedInbound = [
                    ...prev.boxes.inbound,
                    {
                      sourceType: "custom",
                      sourceIndex: updatedCustom.length - 1, // points to the customSources array index
                      weightLbs: "",
                    },
                  ];

                  return {
                    ...prev,
                    customSources: updatedCustom,
                    boxes: { ...prev.boxes, inbound: updatedInbound },
                  };
                });

                dirtyRef.current = true;
              }}

              className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              + Add Custom Box
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-4 py-2 w-48">Lot #</th>
                  <th className="px-4 py-2 w-48">Product</th>
                  <th className="px-4 py-2 w-32">Weight (lbs)</th>
                  <th className="px-4 py-2 w-20">Remove</th>
                </tr>
              </thead>
              <tbody>
                {state.customSources.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                      No custom source boxes yet.
                    </td>
                  </tr>
                ) : (
                  state.customSources.map((box, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded-lg border px-2 py-1.5 text-sm"
                          value={box.lotNumber}
                          placeholder="e.g. 25TS"
                          onChange={(e) => {
                            const val = e.target.value;
                            setState((prev) => {
                              const updated = [...prev.customSources];
                              updated[i].lotNumber = val;
                              return { ...prev, customSources: updated };
                            });
                          }}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded-lg border px-2 py-1.5 text-sm"
                          value={box.product}
                          placeholder="e.g. Wheat"
                          onChange={(e) => {
                            const val = e.target.value;
                            setState((prev) => {
                              const updated = [...prev.customSources];
                              updated[i].product = val;
                              return { ...prev, customSources: updated };
                            });
                          }}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="w-full rounded-lg border px-2 py-1.5 text-sm tabular-nums"
                          type="number"
                          value={box.weightLbs}
                          onChange={(e) => {
                            const val = e.target.value;
                            setState((prev) => {
                              const updatedCustom = [...prev.customSources];
                              updatedCustom[i].weightLbs = val;

                              // Sync inbound entry that corresponds to this custom box
                              const updatedInbound = prev.boxes.inbound.map((b) =>
                                b.sourceType === "custom" && b.sourceIndex === i
                                  ? { ...b, weightLbs: val }
                                  : b
                              );

                              return {
                                ...prev,
                                customSources: updatedCustom,
                                boxes: { ...prev.boxes, inbound: updatedInbound },
                              };
                            });
                          }}

                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
                          onClick={() => {
                            setState((prev) => {
                              const updated = [...prev.customSources];
                              updated.splice(i, 1);
                              return { ...prev, customSources: updated };
                            });
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>

        {/* ================= Clean ================ */}
        <div className="mt-6">
          <BoxTable
            kind="clean"
            title="Clean Boxes"
            color="bg-emerald-500"
            rows={state.boxes.clean}
            addBox={() => addOutputBox("clean")}
            updateBox={(i, f, v) => updateOutputBox("clean", i, f, v)}
            removeBox={(i) => removeOutputBox("clean", i)}
          />
        </div>

        {/* ================= Reruns ================ */}
        <div className="mt-6">
          <BoxTable
            kind="reruns"
            title="Rerun Boxes"
            color="bg-blue-500"
            rows={state.boxes.reruns}
            addBox={() => addOutputBox("reruns")}
            updateBox={(i, f, v) => updateOutputBox("reruns", i, f, v)}
            removeBox={(i) => removeOutputBox("reruns", i)}
          />
        </div>

        {/* ================= Screenings (Tabbed) ================ */}
        <div className="mt-6">
          <ScreeningsTabs
            screenings={state.boxes.screenings}
            onAdd={(subtype) => addOutputBox("screenings", subtype)}
            onUpdate={(subtype, i, f, v) => updateOutputBox("screenings", i, f, v, subtype)}
            onRemove={(subtype, i) => removeOutputBox("screenings", i, subtype)}
          />
        </div>

        {/* ================= Trash ================ */}
        <div className="mt-6">
          <BoxTable
            kind="trash"
            title="Trash Boxes"
            color="bg-rose-500"
            rows={state.boxes.trash}
            addBox={() => addOutputBox("trash")}
            updateBox={(i, f, v) => updateOutputBox("trash", i, f, v)}
            removeBox={(i) => removeOutputBox("trash", i)}
          />
        </div>

        {/* ================= Notes Section ================ */}
        <div className="mt-10 rounded-2xl border bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes about this process
        </label>
        <textarea
            className="w-full min-h-[120px] rounded-lg border px-3 py-2 text-sm"
            placeholder="Add observations, issues, or other notes here..."
            value={state.notes}
            onChange={(e) => {
            setField("notes", e.target.value);
            }}
        />
        </div>

        <p className="mt-8 text-xs text-gray-500 text-center">
          Tip: Your work autosaves every minute when idle.
        </p>
      </div>
    </div>
  );
}
