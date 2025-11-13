import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/layout";

/* -------------------- Helpers -------------------- */

const todayISO = () => new Date().toISOString().slice(0, 10);
const safeNum = (v) => (v === "" || v === null || isNaN(Number(v)) ? 0 : Number(v));

const SCREENING_TYPES = [
  "Air",
  "Dust",
  "Gra",
  "Graheavy",
  "Gralight",
  "Large",
  "Small",
  "Spiral",
  "Destoner-Light",
  "Destoner-Heavy",
];

const screeningCode = {
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
};

const LS_KEY = "qsageCleaningDraft_v4";

/* -------------------- Default State -------------------- */

const makeEmptyBoxes = () => ({
  inbound: [],
  clean: [],
  reruns: [],
  trash: [],
  screenings: SCREENING_TYPES.reduce((acc, t) => {
    acc[t] = [];
    return acc;
  }, {}),
});

const DEFAULT_STATE = {
  processID: "",
  jobDate: todayISO(),
  selectedEmployee: "",
  selectedSupplier: "",
  notes: "",
  binsUsed: [], // { bin_location, product, lot_number, weight }
  boxSources: [],
  boxes: makeEmptyBoxes(),
};

/* -------------------- Physical Box Helpers -------------------- */

const computeNetWeight = (row, physicalBoxesMap) => {
  const gross = safeNum(row.weightLbs);
  if (!row.usePhysicalBox || !row.physicalBoxId) return gross;
  const pbWeight = physicalBoxesMap.get(row.physicalBoxId) || 0;
  const net = gross - pbWeight;
  return net > 0 ? net : 0;
};

/* -------------------- Reusable UI Components -------------------- */

function HeaderField({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function Stat({ name, value, muted }) {
  return (
    <div className={`rounded-2xl border p-3 ${muted ? "opacity-70" : ""}`}>
      <div className="text-xs text-gray-500">{name}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/* Inbound table with Physical Box support */
function InboundTable({
  binsUsed = [],
  rows = [],
  onAdd,
  onUpdate,
  onRemove,
  physicalBoxesMap,
}) {
  const hasBins = binsUsed && binsUsed.length > 0;

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex flex-col">
          <h3 className="text-base font-semibold">Inbound (Pre-Mill)</h3>
          <p className="text-xs text-gray-500">
            Each row is a box pulled from a selected source bin. If Physical Box is checked,
            the entered weight is gross (box + product) and we subtract the physical box weight.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={!hasBins}
          title={hasBins ? "Add inbound box" : "Add at least one source bin first"}
          className={`rounded-xl border px-3 py-1.5 text-sm ${
            hasBins ? "hover:bg-gray-50" : "opacity-40 cursor-not-allowed"
          }`}
        >
          + Add Box
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed">
          <thead>
            <tr className="text-left text-sm text-gray-600 bg-gray-50">
              <th className="px-4 py-2 w-32">Source Bin</th>
              <th className="px-4 py-2 w-20">Box #</th>
              <th className="px-4 py-2 w-40">Weight (lbs)</th>
              <th className="px-4 py-2 w-40">Physical Box ID</th>
              <th className="px-4 py-2 w-24">Use Physical Box</th>
              <th className="px-4 py-2 w-20">Net Input (lbs)</th>
              <th className="px-4 py-2 w-16">✕</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No inbound boxes yet. Add a source bin above, then click “Add Box”.
                </td>
              </tr>
            ) : (
              rows.map((b, i) => {
                const net = computeNetWeight(b, physicalBoxesMap);
                return (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">
                      <select
                        className="w-full rounded-lg border px-2 py-1.5 text-sm bg-white"
                        value={b.binLocation || ""}
                        onChange={(e) =>
                          onUpdate(i, "binLocation", e.target.value)
                        }
                      >
                        <option value="">Select bin…</option>
                        {binsUsed.map((bin, idx) => (
                          <option key={idx} value={bin.bin_location}>
                            {bin.bin_location}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-full rounded-lg border px-2 py-1.5 text-sm"
                        value={b.boxNumber || ""}
                        onChange={(e) =>
                          onUpdate(i, "boxNumber", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="any"
                        className="w-full rounded-lg border px-2 py-1.5 text-sm"
                        value={b.weightLbs ?? ""}
                        onChange={(e) =>
                          onUpdate(i, "weightLbs", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded-lg border px-2 py-1.5 text-sm"
                        value={b.physicalBoxId || ""}
                        onChange={(e) =>
                          onUpdate(i, "physicalBoxId", e.target.value)
                        }
                        placeholder="Optional ID"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!b.usePhysicalBox}
                        onChange={(e) =>
                          onUpdate(i, "usePhysicalBox", e.target.checked)
                        }
                      />
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {net.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(i)}
                        className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
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

/* Generic BoxTable for outputs (Clean, Reruns, Screenings subtype, Trash) */

function BoxTable({
  kind,
  title,
  color,
  rows = [],
  addBox,
  updateBox,
  removeBox,
  processID,
  physicalBoxesMap,
}) {
  const subtotal = rows.reduce(
    (acc, b) => acc + computeNetWeight(b, physicalBoxesMap),
    0
  );

  const isScreening = kind.startsWith("screenings:");
  const screeningType = isScreening ? kind.split(":")[1] : null;

  const getBoxId = (b, index) => {
    if (!processID) return "";
    const num = b.boxNumber || index + 1;

    if (kind === "clean") return `${processID}C${num}`;
    if (kind === "reruns") return `${processID}R${num}`;
    if (kind === "trash") return `${processID}T${num}`;
    if (isScreening) {
      const code = screeningCode[screeningType] || "S";
      return `${processID}${code}${num}`;
    }
    return "";
  };

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
            Subtotal:{" "}
            <span className="font-semibold tabular-nums">
              {subtotal.toLocaleString()} lbs
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] table-fixed">
          <thead>
            <tr className="text-left text-sm text-gray-600 bg-gray-50">
              <th className="px-4 py-2 w-30">Box ID</th>
              <th className="px-4 py-2 w-20">Box #</th>
              <th className="px-4 py-2 w-40">Weight (lbs)</th>
              <th className="px-4 py-2 w-40">Physical Box ID</th>
              <th className="px-4 py-2 w-24">Use Physical Box</th>
              <th className="px-4 py-2 w-20">Net Weight (lbs)</th>
              <th className="px-4 py-2 w-56">Storage Location</th>
              <th className="px-4 py-2 w-16">✕</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No boxes yet. Click “Add Box”.
                </td>
              </tr>
            ) : (
              rows.map((b, i) => {
                const boxId = getBoxId(b, i);
                const net = computeNetWeight(b, physicalBoxesMap);

                return (
                  <tr key={`${kind}-${i}`} className="border-t">
                    {/* Box ID (readonly) */}
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded-lg border px-2 py-1.5 text-xs bg-gray-50 text-gray-700"
                        value={boxId}
                        readOnly
                      />
                    </td>

                    {/* Box # */}
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-full rounded-lg border px-2 py-1.5 text-sm"
                        value={b.boxNumber || ""}
                        onChange={(e) =>
                          updateBox(i, "boxNumber", e.target.value)
                        }
                      />
                    </td>

                    {/* Gross Weight */}
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="any"
                        className="w-full rounded-lg border px-2 py-1.5 text-sm"
                        value={b.weightLbs ?? ""}
                        onChange={(e) =>
                          updateBox(i, "weightLbs", e.target.value)
                        }
                      />
                    </td>

                    {/* Physical Box ID */}
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded-lg border px-2 py-1.5 text-sm"
                        value={b.physicalBoxId || ""}
                        onChange={(e) =>
                          updateBox(i, "physicalBoxId", e.target.value)
                        }
                        placeholder="Optional ID"
                      />
                    </td>

                    {/* Use Physical Box */}
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={!!b.usePhysicalBox}
                        onChange={(e) =>
                          updateBox(i, "usePhysicalBox", e.target.checked)
                        }
                      />
                    </td>

                    {/* Net Weight (readonly) */}
                    <td className="px-4 py-2 tabular-nums">
                      {net.toLocaleString()}
                    </td>

                    {/* Storage Location */}
                    <td className="px-3 py-2">
                      <input
                        className="w-full rounded border px-2 py-1"
                        type="text"
                        value={b.storageLocation || ""}
                        onChange={(e) =>
                          onUpdate(
                            i,
                            "storageLocation",
                            e.target.value
                          )
                        }
                        placeholder={
                          kind === "clean" || kind === "reruns"
                            ? "Refrigerator / Co2 / Other"
                            : "e.g., Rejects Pile"
                        }
                      />
                    </td>

                    {/* Remove */}
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeBox(i)}
                        className="rounded-lg border px-2 py-1 text-sm hover:bg-gray-50"
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

/* Screenings Tabs wrapper */
function ScreeningsTabs({
  processID,
  screenings,
  addBox,
  updateBox,
  removeBox,
  physicalBoxesMap,
}) {
  const [active, setActive] = useState("Dust");

  const rows = screenings[active] || [];

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-4 pt-3 pb-2 flex gap-2 flex-wrap">
        {SCREENING_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              active === t
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-4">
        <BoxTable
          kind={`screenings:${active}`}
          title={`${active} Screenings`}
          color="bg-amber-500"
          rows={rows}
          addBox={() => addBox(active)}
          updateBox={(i, field, value) => updateBox(active, i, field, value)}
          removeBox={(i) => removeBox(active, i)}
          processID={processID}
          physicalBoxesMap={physicalBoxesMap}
        />
      </div>
    </div>
  );
}

/* =========================================================
   Main Component
========================================================= */

export default function QsageCleaningPage() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [bins, setBins] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [physicalBoxes, setPhysicalBoxes] = useState([]);

  /* Build map for fast lookup */
  const physicalBoxesMap = useMemo(() => {
    const m = new Map();
    for (const pb of physicalBoxes) {
      if (pb.physical_box_id) {
        m.set(pb.physical_box_id, Number(pb.weight) || 0);
      }
    }
    return m;
  }, [physicalBoxes]);

  /* ---------- Load initial data & draft ---------- */
  useEffect(() => {
    const load = async () => {
      try {
        if (typeof window !== "undefined") {
          const raw = window.localStorage.getItem(LS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            setState({
              ...DEFAULT_STATE,
              ...parsed,
              boxes: {
                ...makeEmptyBoxes(),
                ...(parsed.boxes || {}),
              },
              binsUsed: parsed.binsUsed || [],
              boxSources: parsed.boxSources || [],
            });
          }
        }

        // Load bins
        const { data: binData } = await supabase
          .from("field_run_storage_test")
          .select("location, lot_number, product, weight, moisture");
        setBins(binData || []);

        // Employees
        const { data: empData } = await supabase
          .from("employees")
          .select("id, name, active")
          .eq("active", true)
          .order("name", { ascending: true });
        setEmployees(empData || []);

        // Suppliers
        const { data: supData } = await supabase
          .from("customers")
          .select("customer_id, name")
          .order("name", { ascending: true });
        setSuppliers(supData || []);

        // Physical boxes
        const { data: pbData } = await supabase
          .from("physical_boxes")
          .select("physical_box_id, weight");
        setPhysicalBoxes(pbData || []);
      } catch (err) {
        console.error("Init load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ---------- Autosave draft ---------- */
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(LS_KEY, JSON.stringify(state));
          setStatusMsg("Draft autosaved.");
        }
      } catch (e) {
        console.warn("Autosave failed:", e);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [state, loading]);

  /* ---------- Simple state helpers ---------- */

  const setField = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const updateBoxes = (updater) => {
    setState((prev) => ({
      ...prev,
      boxes: updater(prev.boxes),
    }));
  };

  /* ---------- Bins Used ---------- */

  const addBin = () => {
    setState((prev) => ({
      ...prev,
      binsUsed: [
        ...(prev.binsUsed || []),
        { bin_location: "", product: "", lot_number: "", weight: 0 },
      ],
    }));
  };

  const updateBin = (index, field, value) => {
    setState((prev) => {
      const binsUsed = [...(prev.binsUsed || [])];
      const updated = { ...(binsUsed[index] || {}) };

      if (field === "bin_location") {
        const binInfo = bins.find((b) => b.location === value);
        updated.bin_location = value;
        if (binInfo) {
          const lotArr = Array.isArray(binInfo.lot_number)
            ? binInfo.lot_number
            : [];
          const prodArr = Array.isArray(binInfo.product)
            ? binInfo.product
            : [];
          updated.lot_number = lotArr.join(", ");
          updated.product = prodArr.join(", ");
          updated.weight = Number(binInfo.weight) || 0;
        } else {
          updated.lot_number = "";
          updated.product = "";
          updated.weight = 0;
        }
      } else {
        updated[field] = value;
      }

      binsUsed[index] = updated;
      return { ...prev, binsUsed };
    });
  };

  const removeBin = (index) => {
    setState((prev) => {
      const binsUsed = [...(prev.binsUsed || [])];
      binsUsed.splice(index, 1);
      return { ...prev, binsUsed };
    });
  };

  /* ---------- Inbound boxes ---------- */

  const addInbound = () => {
    setState((prev) => ({
      ...prev,
      boxes: {
        ...prev.boxes,
        inbound: [
          ...(prev.boxes?.inbound || []),
          {
            binLocation: "",
            boxNumber: (prev.boxes?.inbound || []).length + 1,
            weightLbs: "",
            physicalBoxId: "",
            usePhysicalBox: false,
          },
        ],
      },
    }));
  };

  const updateInbound = (index, field, value) => {
    setState((prev) => {
      const inbound = [...(prev.boxes?.inbound || [])];
      inbound[index] = { ...(inbound[index] || {}), [field]: value };
      return { ...prev, boxes: { ...prev.boxes, inbound } };
    });
  };

  const removeInbound = (index) => {
    setState((prev) => {
      const inbound = [...(prev.boxes?.inbound || [])];
      inbound.splice(index, 1);
      return { ...prev, boxes: { ...prev.boxes, inbound } };
    });
  };

  /* ---------- Output boxes helpers ---------- */

  const makeOutputUpdater = (section, subtype) => ({
  addBox: () => {
    setState((prev) => {
      const boxes = { ...prev.boxes };
      const timestamp = new Date().toISOString();

      if (section === "screenings") {
        const list = boxes.screenings[subtype] || [];
        const nextNum = list.length + 1;
        const code = screeningCode[subtype] || "S";
        const newBoxId = prev.processID
          ? `${prev.processID}${code}${nextNum}`
          : `TEMP${code}${nextNum}`;

        boxes.screenings[subtype] = [
          ...list,
          {
            Box_ID: newBoxId,
            date: timestamp,
            boxNumber: nextNum,
            weightLbs: "",
            physicalBoxId: "",
            usePhysicalBox: false,
            storageLocation: "",
          },
        ];
      } else {
        const list = boxes[section] || [];
        const nextNum = list.length + 1;
        const prefix =
          section === "clean"
            ? "C"
            : section === "reruns"
            ? "R"
            : section === "trash"
            ? "T"
            : "";
        const newBoxId = prev.processID
          ? `${prev.processID}${prefix}${nextNum}`
          : `TEMP${prefix}${nextNum}`;

        boxes[section] = [
          ...list,
          {
            Box_ID: newBoxId,
            date: timestamp,
            boxNumber: nextNum,
            weightLbs: "",
            physicalBoxId: "",
            usePhysicalBox: false,
            storageLocation: "",
          },
        ];
      }

      return { ...prev, boxes };
    });
  },
  updateBox: (index, field, value) => {
    setState((prev) => {
      const boxes = { ...prev.boxes };
      if (section === "screenings") {
        const list = [...(boxes.screenings[subtype] || [])];
        list[index] = { ...(list[index] || {}), [field]: value };
        boxes.screenings[subtype] = list;
      } else {
        const list = [...(boxes[section] || [])];
        list[index] = { ...(list[index] || {}), [field]: value };
        boxes[section] = list;
      }
      return { ...prev, boxes };
    });
  },
  removeBox: (index) => {
    setState((prev) => {
      const boxes = { ...prev.boxes };
      if (section === "screenings") {
        const list = [...(boxes.screenings[subtype] || [])];
        list.splice(index, 1);
        boxes.screenings[subtype] = list;
      } else {
        const list = [...(boxes[section] || [])];
        list.splice(index, 1);
        boxes[section] = list;
      }
      return { ...prev, boxes };
    });
  },
});


  const cleanOps = makeOutputUpdater("clean");
  const rerunOps = makeOutputUpdater("reruns");
  const trashOps = makeOutputUpdater("trash");

  const screeningsOps = SCREENING_TYPES.reduce((acc, t) => {
    acc[t] = makeOutputUpdater("screenings", t);
    return acc;
  }, {});

  /* ---------- Derived values (using net weights) ---------- */

  const combinedLotString = useMemo(() => {
    const fromBins =
      (state.binsUsed || [])
        .map((b) => b.lot_number)
        .filter(Boolean)
        .join(", ") || "";
    const fromSources =
      (state.boxSources || [])
        .map((b) => b.lotNumber)
        .filter(Boolean)
        .join(", ") || "";
    const fromCustom =
      (state.boxes?.inbound || [])
        .filter((b) => b.customLotNumber)
        .map((b) => b.customLotNumber)
        .join(", ") || "";

    return [fromBins, fromSources, fromCustom]
      .filter((s) => s && s.trim() !== "")
      .join(", ");
  }, [state.binsUsed, state.boxSources, state.boxes?.inbound]);

  const combinedProductString = useMemo(() => {
    const fromBins =
      (state.binsUsed || [])
        .map((b) => b.product)
        .filter(Boolean)
        .join(", ") || "";
    const fromSources =
      (state.boxSources || [])
        .map((b) => b.product)
        .filter(Boolean)
        .join(", ") || "";
    const fromCustom =
      (state.boxes?.inbound || [])
        .filter((b) => b.customProduct)
        .map((b) => b.customProduct)
        .join(", ") || "";

    return [fromBins, fromSources, fromCustom]
      .filter((s) => s && s.trim() !== "")
      .join(", ");
  }, [state.binsUsed, state.boxSources, state.boxes?.inbound]);

  const selectedSupplierName = useMemo(() => {
    if (!state.selectedSupplier) return "";
    const found = suppliers.find(
      (s) => s.customer_id === state.selectedSupplier
    );
    return found?.name || "";
  }, [state.selectedSupplier, suppliers]);

  const inboundNetTotal = useMemo(() => {
    const inbound = state.boxes?.inbound || [];
    return inbound.reduce(
      (sum, b) => sum + computeNetWeight(b, physicalBoxesMap),
      0
    );
  }, [state.boxes, physicalBoxesMap]);

  const outputsTotals = useMemo(() => {
    const boxes = state.boxes || makeEmptyBoxes();

    const sumList = (list) =>
      (list || []).reduce(
        (sum, b) => sum + computeNetWeight(b, physicalBoxesMap),
        0
      );

    const clean = sumList(boxes.clean);
    const reruns = sumList(boxes.reruns);
    const trash = sumList(boxes.trash);

    const screeningsTotal = Object.values(boxes.screenings || {}).reduce(
      (acc, list) => acc + sumList(list),
      0
    );

    const outputsGrandTotal = clean + reruns + trash + screeningsTotal;
    const balance = inboundNetTotal - outputsGrandTotal;

    return {
      clean,
      reruns,
      trash,
      screenings: screeningsTotal,
      outputsGrandTotal,
      balance,
    };
  }, [state.boxes, inboundNetTotal, physicalBoxesMap]);

  /* ---------- Validation ---------- */

  const validate = () => {
    const errors = [];
    if (!state.processID.trim()) errors.push("Process ID is required.");
    if (!state.jobDate) errors.push("Job Date is required.");
    if ((state.binsUsed || []).length === 0 && (state.boxSources || []).length === 0) {
      errors.push("Add at least one source bin or box source.");
    }
    if (inboundNetTotal <= 0) {
      errors.push("Inbound total (net) must be greater than 0.");
    }
    if (outputsTotals.outputsGrandTotal <= 0) {
      errors.push("Add at least one output box (Clean, Reruns, Screenings, or Trash).");
    }
    return errors;
  };

  /* ---------- Complete (DB writes) ---------- */

  const handleComplete = async () => {
    const errs = validate();
    setShowValidation(true);
    if (errs.length) {
      alert("Please fix before completing:\n\n" + errs.join("\n"));
      return;
    }

    const lotNumber = combinedLotString || "";
    const productStr = combinedProductString || "";
    const supplierName = selectedSupplierName || null;

    const boxes = state.boxes || makeEmptyBoxes();

    // Flatten screenings
    const screeningsFlat = [];
    for (const [type, list] of Object.entries(boxes.screenings || {})) {
      (list || []).forEach((b, idx) => {
        screeningsFlat.push({
          ...b,
          type,
          index: idx,
        });
      });
    }

    const payload = {
      process_id: state.processID.trim(),
      process_type: "Qsage",
      employee: state.selectedEmployee || null,
      suppliers: supplierName,
      lot_numbers: lotNumber,
      products: productStr,
      notes: state.notes || "",
      input_total: inboundNetTotal,
      output_total: outputsTotals.outputsGrandTotal,
      clean_total: outputsTotals.clean,
      rerun_total: outputsTotals.reruns,
      screenings_total: outputsTotals.screenings,
      trash_total: outputsTotals.trash,
      balance: outputsTotals.balance,
      bins_used: state.binsUsed || [],
      inbound_boxes: boxes.inbound || [],
      outputs: {
        clean: boxes.clean || [],
        reruns: boxes.reruns || [],
        screenings: boxes.screenings || {},
        trash: boxes.trash || [],
      },
      totals: outputsTotals,
    };

    try {
      /* CLEAN STORAGE */
      for (const [i, b] of (boxes.clean || []).entries()) {
        const net = computeNetWeight(b, physicalBoxesMap);
        if (net <= 0) continue;
        const boxId = `${state.processID}C${b.boxNumber || i + 1}`;
        await supabase.from("clean_product_storage").insert({
          Box_ID: boxId,
          Process_ID: state.processID,
          Location: b.storageLocation || "",
          Lot_Number: lotNumber,
          Product: productStr,
          Amount: net,
          Supplier: supplierName,
          Notes: state.notes || null,
          Date_Stored: new Date().toISOString(),
          physical_box_id: b.physicalBoxId || null,
        });
      }

      /* RERUN STORAGE */
      for (const [i, b] of (boxes.reruns || []).entries()) {
        const net = computeNetWeight(b, physicalBoxesMap);
        if (net <= 0) continue;
        const boxId = `${state.processID}R${b.boxNumber || i + 1}`;
        await supabase.from("rerun_product_storage").insert({
          Box_ID: boxId,
          Process_ID: state.processID,
          Location: b.storageLocation || "",
          Lot_Number: lotNumber,
          Product: productStr,
          Amount: net,
          Supplier: supplierName,
          Notes: state.notes || null,
          Date_Stored: new Date().toISOString(),
          physical_box_id: b.physicalBoxId || null,
        });
      }

      /* SCREENINGS STORAGE */
      for (const sf of screeningsFlat) {
        const net = computeNetWeight(sf, physicalBoxesMap);
        if (net <= 0) continue;
        const code = screeningCode[sf.type] || "S";
        const boxId = `${state.processID}${code}${sf.boxNumber || sf.index + 1}`;
        await supabase.from("screening_storage_shed").insert({
          Box_ID: boxId,
          Process_ID: state.processID,
          Location: "Screening Shed",
          Lot_Number: lotNumber,
          Product: productStr,
          Amount: net,
          Type: sf.type,
          Supplier: supplierName,
          Notes: state.notes || null,
          Date_Stored: new Date().toISOString(),
          physical_box_id: sf.physicalBoxId || null,
        });
      }

      /* TRASH STORAGE */
      for (const [i, b] of (boxes.trash || []).entries()) {
        const net = computeNetWeight(b, physicalBoxesMap);
        if (net <= 0) continue;
        await supabase.from("trash").insert({
          Process_ID: state.processID,
          Location: b.storageLocation || "Trash Shed",
          Lot_Number: lotNumber,
          Product: productStr,
          Amount: net,
          Supplier: supplierName,
          Notes: state.notes || null,
          Date_Stored: new Date().toISOString(),
          physical_box_id: b.physicalBoxId || null,
        });
      }

      /* Update source bins (field_run_storage_test) based on inbound net usage */
      const inboundByBin = {};
      for (const b of boxes.inbound || []) {
        if (!b.binLocation) continue;
        const net = computeNetWeight(b, physicalBoxesMap);
        if (net <= 0) continue;
        inboundByBin[b.binLocation] =
          (inboundByBin[b.binLocation] || 0) + net;
      }

      for (const [location, used] of Object.entries(inboundByBin)) {
        const { data: existing } = await supabase
          .from("field_run_storage_test")
          .select("weight")
          .eq("location", location)
          .maybeSingle();
        const current = Number(existing?.weight) || 0;
        const next = Math.max(current - used, 0);
        await supabase
          .from("field_run_storage_test")
          .update({ weight: next })
          .eq("location", location);
      }

      /* Save Qsage report */
      await supabase.from("qsage_reports").insert({
        process_id: payload.process_id,
        process_type: "Qsage",
        employee: payload.employee,
        suppliers: payload.suppliers,
        lot_numbers: payload.lot_numbers,
        products: payload.products,
        notes: payload.notes,
        input_total: payload.input_total,
        output_total: payload.output_total,
        clean_total: payload.clean_total,
        rerun_total: payload.rerun_total,
        screenings_total: payload.screenings_total,
        trash_total: payload.trash_total,
        balance: payload.balance,
        bins_used: JSON.stringify(payload.bins_used || []),
        inbound_boxes: JSON.stringify(payload.inbound_boxes || []),
        outputs: JSON.stringify(payload.outputs || {}),
        totals: JSON.stringify(payload.totals || {}),
        created_at: new Date().toISOString(),
      });


      // Clear
      setState({
        ...DEFAULT_STATE,
        boxes: makeEmptyBoxes(),
      });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LS_KEY);
      }
      setStatusMsg("Job completed, saved to Supabase, and draft cleared.");
      setShowValidation(false);
      alert("✅ Qsage job completed and saved.");
    } catch (err) {
      console.error("Error completing Qsage job:", err);
      alert("Error saving job: " + (err.message || String(err)));
    }
  };

  /* =========================================================
     Render
  ========================================================= */

  if (loading) {
    return (
      <div className="p-6 text-gray-600">
        Loading Qsage Cleaning Process…
      </div>
    );
  }

  return (
    <Layout title="Qsage Job" showBack={true}>
    <div className="mx-auto max-w-6xl p-6 bg-[#D9D9D9] flex flex-col overflow-y-auto h-full">
      {/* Header row: left = form, right = summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Left: Process header */}
        <div className="md:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold">
            Qsage Cleaning Process
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Process ID */}
            <HeaderField label="Process ID">
              <input
                className="w-full rounded-lg border px-3 py-2"
                placeholder="e.g., QS-2025-10-0012"
                value={state.processID}
                onChange={(e) => setField("processID", e.target.value)}
              />
            </HeaderField>

            {/* Job Date */}
            <HeaderField label="Job Date">
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2"
                value={state.jobDate}
                onChange={(e) => setField("jobDate", e.target.value)}
              />
            </HeaderField>

            {/* Employee */}
            <HeaderField label="Employee">
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={state.selectedEmployee}
                onChange={(e) =>
                  setField("selectedEmployee", e.target.value)
                }
              >
                <option value="">Select employee…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </HeaderField>

            {/* Supplier */}
            <HeaderField label="Supplier">
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={state.selectedSupplier}
                onChange={(e) =>
                  setField("selectedSupplier", e.target.value)
                }
              >
                <option value="">Select supplier…</option>
                {suppliers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </HeaderField>

            {/* Lot Numbers (read-only combined) */}
            <HeaderField label="Lot Numbers (from inputs)">
              <input
                className="w-full rounded-lg border px-3 py-2 bg-gray-50 text-sm"
                value={combinedLotString}
                readOnly
              />
            </HeaderField>

            {/* Products (read-only combined) */}
            <HeaderField label="Products (from inputs)">
              <input
                className="w-full rounded-lg border px-3 py-2 bg-gray-50 text-sm"
                value={combinedProductString}
                readOnly
              />
            </HeaderField>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
              onClick={() => {
                try {
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(
                      LS_KEY,
                      JSON.stringify(state)
                    );
                  }
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
              className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50"
              onClick={() => {
                if (
                  window.confirm(
                    "Clear the current draft? This cannot be undone."
                  )
                ) {
                  setState({
                    ...DEFAULT_STATE,
                    boxes: makeEmptyBoxes(),
                  });
                  if (typeof window !== "undefined") {
                    window.localStorage.removeItem(LS_KEY);
                  }
                  setStatusMsg("Draft cleared.");
                }
              }}
            >
              Clear Draft
            </button>
            <button
              type="button"
              className="rounded-xl bg-[#5D1214] px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
              onClick={handleComplete}
            >
              Complete Job
            </button>
          </div>

          {statusMsg && (
            <div className="mt-2 text-sm text-gray-600">
              {statusMsg}
            </div>
          )}

          {showValidation && (
            <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Ensure Process ID, Job Date, at least one source, inbound boxes,
              and output boxes are set. Physical box rows will use net weights.
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold">Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <Stat
              name="Input Net (lbs)"
              value={inboundNetTotal.toLocaleString()}
            />
            <Stat
              name="Outputs Total (lbs)"
              value={outputsTotals.outputsGrandTotal.toLocaleString()}
            />
            <Stat
              name="Clean (lbs)"
              value={outputsTotals.clean.toLocaleString()}
              muted
            />
            <Stat
              name="Reruns (lbs)"
              value={outputsTotals.reruns.toLocaleString()}
              muted
            />
            <Stat
              name="Screenings (lbs)"
              value={outputsTotals.screenings.toLocaleString()}
              muted
            />
            <Stat
              name="Trash (lbs)"
              value={outputsTotals.trash.toLocaleString()}
              muted
            />
            <Stat
              name="Balance (lbs)"
              value={outputsTotals.balance.toLocaleString()}
            />
          </div>
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <div>
              Supplier:{" "}
              <span className="font-medium">
                {selectedSupplierName || "—"}
              </span>
            </div>
            <div>
              Lots:{" "}
              <span className="font-medium">
                {combinedLotString || "—"}
              </span>
            </div>
            <div>
              Products:{" "}
              <span className="font-medium">
                {combinedProductString || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bins Used */}
      <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold">Source Bins</h3>
          <button
            type="button"
            onClick={addBin}
            className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            + Add Bin
          </button>
        </div>
        {(state.binsUsed || []).length === 0 ? (
          <p className="text-sm text-gray-500">
            No bins added yet. Click “Add Bin” to begin.
          </p>
        ) : (
          <div className="space-y-2">
            {state.binsUsed.map((bin, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end border-b pb-3"
              >
                <div>
                  <label className="text-xs text-gray-500">
                    Bin Location
                  </label>
                  <select
                    className="w-full rounded-lg border px-2 py-1.5 text-sm"
                    value={bin.bin_location || ""}
                    onChange={(e) =>
                      updateBin(index, "bin_location", e.target.value)
                    }
                  >
                    <option value="">Select…</option>
                    {(() => {
                      const siloOrder = [
                        "HQ-1","HQ-2","HQ-3","HQ-4","HQ-5","HQ-6","HQ-7","HQ-8","HQ-9","HQ-10",
                        "HQ-11","HQ-12","HQ-13","HQ-14","HQ-15","HQ-16","HQ-17","HQ-18",
                        "BEN-5","BEN-6","BEN-7","BEN-8","BEN-9","BEN-10","BEN-11","BEN-12",
                        "Co2-3","Co2-4","Boxes-Mill"
                      ];

                      const sortBinsByOrder = (a, b) => {
                        const iA = siloOrder.indexOf(a.location);
                        const iB = siloOrder.indexOf(b.location);
                        if (iA === -1 && iB === -1) return a.location.localeCompare(b.location);
                        if (iA === -1) return 1;
                        if (iB === -1) return -1;
                        return iA - iB;
                      };

                      const sorted = [...bins].sort(sortBinsByOrder);
                      return sorted.map((b) => (
                        <option key={b.location} value={b.location}>
                          {b.location}
                        </option>
                      ));
                    })()}
                  </select>

                </div>
                <div>
                  <label className="text-xs text-gray-500">Lots</label>
                  <div className="text-xs bg-gray-50 rounded-lg border px-2 py-1.5">
                    {bin.lot_number || "—"}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">
                    Products
                  </label>
                  <div className="text-xs bg-gray-50 rounded-lg border px-2 py-1.5">
                    {bin.product || "—"}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">
                    Current Weight (lbs)
                  </label>
                  <div className="text-xs bg-gray-50 rounded-lg border px-2 py-1.5 tabular-nums">
                    {bin.weight ?? 0}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeBin(index)}
                    className="mt-4 rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inbound Boxes */}
      <InboundTable
        binsUsed={state.binsUsed || []}
        rows={state.boxes?.inbound || []}
        onAdd={addInbound}
        onUpdate={updateInbound}
        onRemove={removeInbound}
        physicalBoxesMap={physicalBoxesMap}
      />

      {/* Outputs */}
      <div className="mt-6 space-y-6">
        <BoxTable
          kind="clean"
          title="Clean Boxes"
          color="bg-emerald-500"
          rows={state.boxes?.clean || []}
          addBox={cleanOps.addBox}
          updateBox={cleanOps.updateBox}
          removeBox={cleanOps.removeBox}
          processID={state.processID}
          physicalBoxesMap={physicalBoxesMap}
        />
        <BoxTable
          kind="reruns"
          title="Rerun Boxes"
          color="bg-blue-500"
          rows={state.boxes?.reruns || []}
          addBox={rerunOps.addBox}
          updateBox={rerunOps.updateBox}
          removeBox={rerunOps.removeBox}
          processID={state.processID}
          physicalBoxesMap={physicalBoxesMap}
        />
        <ScreeningsTabs
          processID={state.processID}
          screenings={state.boxes?.screenings || {}}
          addBox={(type) => screeningsOps[type].addBox()}
          updateBox={(type, i, field, value) =>
            screeningsOps[type].updateBox(i, field, value)
          }
          removeBox={(type, i) => screeningsOps[type].removeBox(i)}
          physicalBoxesMap={physicalBoxesMap}
        />
        <BoxTable
          kind="trash"
          title="Trash Boxes"
          color="bg-rose-500"
          rows={state.boxes?.trash || []}
          addBox={trashOps.addBox}
          updateBox={trashOps.updateBox}
          removeBox={trashOps.removeBox}
          processID={state.processID}
          physicalBoxesMap={physicalBoxesMap}
        />
      </div>

      {/* Notes */}
      <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
        <HeaderField label="Notes">
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm min-h-[80px]"
            value={state.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Additional details about this Qsage process…"
          />
        </HeaderField>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Tip: Use physical box IDs when weighing boxes with different tare
        weights. Net weights are calculated automatically for totals and
        inventory.
      </p>
    </div>
    </Layout>
  );
}
