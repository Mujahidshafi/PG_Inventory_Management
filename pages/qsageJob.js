// pages/qsageJob.js
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
const LS_KEY = "qsageCleaningDraft";

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
                      value={b.weightLbs}
                      onChange={(e) => updateBox(i, "weightLbs", e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="w-full rounded-lg border px-2 py-1.5 text-sm"
                      value={b.storageLocation}
                      onChange={(e) => updateBox(i, "storageLocation", e.target.value)}
                    />
                  </td>
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
                      value={b.weightLbs}
                      onChange={(e) => onUpdate(i, "weightLbs", e.target.value)}
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
export default function QsageCleaningPage() {
  const supabase = useSupabaseClient();

  // Full UI state
  const [state, setState] = useState(DEFAULT_STATE);

  // Live list of bins from DB (field_run_storage_test)
  const [availableBins, setAvailableBins] = useState([]);
  const [loadingBins, setLoadingBins] = useState(true);

  // UI helpers
  const [statusMsg, setStatusMsg] = useState("");
  const [showValidation, setShowValidation] = useState(false);

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
        setAvailableBins(normalized);
      }
      setLoadingBins(false);
    };

    fetchBins();
  }, [supabase]);

  /* -------------------------
     Header helpers
     ------------------------- */
  // Calculate combined lot numbers from currently selected bins
  const combinedLotString = useMemo(() => {
    // Use binsUsed -> look up in availableBins to get authoritative lot arrays
    const lots = state.binsUsed.flatMap((used) => {
      const match = availableBins.find((b) => b.location === used.bin_location);
      return match?.lot_number || [];
    });
    // De-duplicate and join
    const unique = Array.from(new Set(lots.filter(Boolean)));
    return unique.join(", ");
  }, [state.binsUsed, availableBins]);

  // ✅ Combine product names from all selected bins
const combinedProductString = useMemo(() => {
  if (!state.binsUsed?.length) return "";
  const allProducts = state.binsUsed
    .map((b) => Array.isArray(b.product) ? b.product.join(", ") : b.product)
    .filter(Boolean);
  return Array.from(new Set(allProducts)).join(", ");
}, [state.binsUsed]);

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
        lotNumber: lotStr,
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
      if (section === "screenings" && subtype) {
        next.boxes.screenings[subtype][index][field] = value;
      } else {
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
  const validate = () => {
    const errors = [];
    if (!state.processID.trim()) errors.push("Process ID is required.");
    if (!state.jobDate) errors.push("Job Date is required.");
    if (!state.binsUsed.length) errors.push("Add at least one Source Bin.");
    if ((state.boxes.inbound?.length || 0) === 0) errors.push("Add at least one inbound box.");
    if (inputAmount <= 0) errors.push("Inbound total must be > 0 lbs.");

    const outputsCount =
      (state.boxes.clean?.length || 0) +
      (state.boxes.reruns?.length || 0) +
      Object.values(state.boxes.screenings || {}).reduce((n, arr) => n + (arr?.length || 0), 0) +
      (state.boxes.trash?.length || 0);
    if (outputsCount === 0)
      errors.push("Add at least one output box (Clean / Reruns / Screenings / Trash).");

    return errors;
  };

  const handleComplete = async () => {
  const errs = validate();
  setShowValidation(true);
  if (errs.length) {
    alert("Please fix the following before completing:\n\n" + errs.join("\n"));
    return;
  }

  // Compose payload for DB wiring
  const payload = {
    processID: state.processID.trim(),
    jobDate: state.jobDate,
    binsUsed: state.binsUsed,
    notes: state.notes.trim(),
    lotNumbers: combinedLotString, // collected from bins (displayed in header)
    inbound: state.boxes.inbound,
    outputs: {
      clean: state.boxes.clean,
      reruns: state.boxes.reruns.map((b) => ({ ...b, isRerun: true })),
      screenings: state.boxes.screenings,
      trash: state.boxes.trash,
      notes: state.notes.trim(),
    },
    totals: {
      inputAmount,
      clean: totals.clean,
      reruns: totals.reruns,
      screenings: totals.screenings,
      trash: totals.trash,
      outputsGrandTotal,
      balance,
    },
  };

  console.log("[Qsage UI] COMPLETE payload ready:", payload);

  // --- ✅ Insert Screenings into Supabase ---
  try {
    const allScreenings = Object.entries(state.boxes.screenings || {}).flatMap(
      ([type, boxes]) =>
        (boxes || []).map((b) => ({
          Process_ID: state.processID,
          Location: "Screening Shed",
          Lot_Number: combinedLotString || "",
          Product: combinedProductString || "",
          Amount: Number(b.weightLbs) || 0,
          Type: type,
          Notes: state.notes || null,
          Date_Stored: new Date().toISOString(),
        }))
    );

    if (allScreenings.length > 0) {
      const { data, error } = await supabase
        .from("screening_storage_shed")
        .insert(allScreenings);

      if (error) {
        console.error("❌ Error inserting screening data:", error);
        alert("Error saving screenings: " + error.message);
      } else {
        console.log("✅ Screenings saved:", data);
        alert("Screenings successfully saved to Supabase!");
      }
    } else {
      console.log("No screening boxes to save for this job.");
    }
  } catch (e) {
    console.error("Unexpected error saving screenings:", e);
    alert("Unexpected error saving screenings: " + e.message);
  }

  // ✅ Save Trash boxes to Supabase
  if (state.boxes.trash.length > 0) {
    const trashInserts = state.boxes.trash.map((t) => ({
      Process_ID: state.processID.trim(),
      Location: "Trash Shed",
      Lot_Number: combinedLotString,
      Product: combinedProductString,
      Amount: safeNum(t.weightLbs),
      Notes: state.notes.trim(),
    }));

    const { error: trashError } = await supabase
      .from("trash")
      .insert(trashInserts);

    if (trashError) {
      console.error("Error inserting trash boxes:", trashError);
      alert("Error saving trash data to Supabase.");
    } else {
      console.log("✅ Trash boxes saved successfully.");
    }
  }

  // --- ✅ Deduct weight from selected bins ---
  try {
    if (state.binsUsed && state.binsUsed.length > 0) {
      for (const bin of state.binsUsed) {
        // Calculate how much weight to remove for this bin
        const removedFromThisBin = state.boxes.inbound
          .filter((b) => b.binId === bin.location) // match by selected bin
          .reduce((acc, b) => acc + Number(b.weightLbs || 0), 0);

        if (removedFromThisBin > 0) {
          const { data, error } = await supabase
            .from("field_run_storage_test")
            .update({
              weight: supabase.rpc("decrement_weight", {
                loc: bin.location,
                amt: removedFromThisBin,
              }),
            })
            .eq("location", bin.location);

          if (error) {
            console.error(`❌ Error updating bin ${bin.location}:`, error);
            alert(`Error updating bin ${bin.location}: ${error.message}`);
          } else {
            console.log(`✅ Deducted ${removedFromThisBin} lbs from ${bin.location}`);
          }
        }
      }
    } else {
      console.log("No bins selected — skipping bin deduction.");
    }
  } catch (e) {
    console.error("Unexpected error deducting bin weight:", e);
    alert("Error updating bin weights: " + e.message);
  }

  // --- 🧹 Reset UI and clear draft ---
  setState(DEFAULT_STATE);
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
  setStatusMsg("Job completed (UI). Draft cleared.");
  setShowValidation(false);
  dirtyRef.current = false;

  alert("Draft is valid and data was sent to Supabase (check logs).");
};


  /* =========================================================
     Render
     ========================================================= */
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-center">Qsage Cleaning Process</h1>

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

        {/* ================= Source Bins ================ */}
        <div className="mb-8 rounded-2xl border bg-white p-4 shadow-sm">
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
        <InboundTable
          binsUsed={state.binsUsed}
          rows={state.boxes.inbound}
          onAdd={addInbound}
          onUpdate={updateInbound}
          onRemove={removeInbound}
        />

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
