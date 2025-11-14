import React, { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import ScrollingLayout from "../components/scrollingLayout";

const LS_KEY = "baggingJobDraft";
const DEFAULT_STATE = {
  jobDate: new Date().toISOString().slice(0, 10),
  inputs: [],
  co2Draws: [],
  pallets: [],
  notes: "",
  selectedEmployee: "",
  selectedSupplier: "",
};

// Helpers
const safeNum = (v) => (v === "" || v === null || isNaN(Number(v)) ? 0 : Number(v));
const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
const todayISO = () => new Date().toISOString().slice(0, 10);

// Auto Pallet ID generator (simple + unique enough for now)
const makePalletId = (index) => {
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 12);
  return `PAL-${ts}-${index + 1}`;
};

export default function BaggingJob() {
  // Employees
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // CO₂ bins from inside_co2_bins
  const [co2Bins, setCo2Bins] = useState([]);

  // Inputs
  const [boxSources, setBoxSources] = useState([]); // scanned/typed boxes
  const [newBoxId, setNewBoxId] = useState("");

  const [co2Draws, setCo2Draws] = useState([]);
  const [newCo2Bin, setNewCo2Bin] = useState("");
  const [newCo2Weight, setNewCo2Weight] = useState("");

  // Outputs (pallets)
  const [pallets, setPallets] = useState([]);

  // Meta
  const [notes, setNotes] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [processing, setProcessing] = useState(false);

  const [state, setState] = useState(DEFAULT_STATE);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
            const parsed = JSON.parse(raw);

            // ✅ Restore all relevant parts
            setState({ ...DEFAULT_STATE, ...parsed });

            if (parsed.inputs) setBoxSources(parsed.inputs);
            if (parsed.co2Draws) setCo2Draws(parsed.co2Draws);
            if (parsed.pallets) setPallets(parsed.pallets);
            if (parsed.selectedEmployee) setSelectedEmployee(parsed.selectedEmployee);
            if (parsed.notes) setNotes(parsed.notes);
            }
        } catch (e) {
            console.warn("Bagging draft load error", e);
        }
        }, []);


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
        isTypingRef.current = false;
    }, 5000);
    };

    useEffect(() => {
    const t = setInterval(() => {
        const now = Date.now();
        if (!isTypingRef.current && dirtyRef.current && now - lastSavedRef.current >= 60000) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(stateRef.current));
            lastSavedRef.current = now;
            dirtyRef.current = false;
            console.log("✅ Bagging draft autosaved.");
        } catch (e) {
            console.warn("Autosave failed:", e);
        }
        }
    }, 5000);
    return () => clearInterval(t);
    }, []);


  // ───────────────────────────── Load employees + CO₂ bins ─────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: empData, error: empErr }, { data: binsData, error: binErr }] =
          await Promise.all([
            supabase
              .from("employees")
              .select("id, name")
              .eq("active", true)
              .order("name", { ascending: true }),
            supabase.from("inside_co2_bins").select("*"),
          ]);

        if (empErr) console.error("Employees load error:", empErr);
        if (binErr) console.error("CO2 bins load error:", binErr);

        setEmployees(empData || []);
        setCo2Bins(binsData || []);
      } catch (err) {
        console.error("Init load error:", err);
      }
    };
    load();
  }, []);

  // ───────────────────────────── Derived inbound info ─────────────────────────────

  const inboundTotals = useMemo(() => {
    const boxWeight = boxSources.reduce(
      (sum, b) => sum + safeNum(b.amount),
      0
    );
    const co2Weight = co2Draws.reduce(
      (sum, d) => sum + safeNum(d.weightLbs),
      0
    );
    return {
      fromBoxes: boxWeight,
      fromCo2: co2Weight,
      total: boxWeight + co2Weight,
    };
  }, [boxSources, co2Draws]);

  const combinedLots = useMemo(() => {
    const fromBoxes = boxSources
      .map((b) => (b.lotNumber || "").split(","))
      .flat()
      .map((s) => s.trim());

    const fromCo2 = co2Draws
      .map((d) => d.lotNumbers || [])
      .flat()
      .map((s) => String(s).trim());

    return uniq([...fromBoxes, ...fromCo2]).join(", ");
  }, [boxSources, co2Draws]);

  const combinedProducts = useMemo(() => {
    const fromBoxes = boxSources
      .map((b) => (b.product || "").split(","))
      .flat()
      .map((s) => s.trim());

    const fromCo2 = co2Draws
      .map((d) => d.products || [])
      .flat()
      .map((s) => String(s).trim());

    return uniq([...fromBoxes, ...fromCo2]).join(", ");
  }, [boxSources, co2Draws]);

  const combinedSuppliers = useMemo(() => {
    const arr = boxSources
      .map((b) => b.supplier)
      .filter(Boolean)
      .map((s) => s.trim());
    return uniq(arr).join(", ");
  }, [boxSources]);

  // Outbound pallet total
  const palletsTotalWeight = useMemo(
    () =>
      pallets.reduce((sum, p) => {
        const bt = p.bagType;
        const n = safeNum(p.numBags);
        const manual = safeNum(p.totalWeight);
        if (manual > 0) return sum + manual;
        if (bt === "25lb") return sum + n * 25;
        if (bt === "50lb") return sum + n * 50;
        if (bt === "2000lb tote") return sum + n * 2000;
        return sum;
      }, 0),
    [pallets]
  );

  const balance = useMemo(
    () => inboundTotals.total - palletsTotalWeight,
    [inboundTotals.total, palletsTotalWeight]
  );

  // ───────────────────────────── Handlers: Box Sources ─────────────────────────────

  const handleAddBoxSource = async () => {
    const boxId = newBoxId.trim();
    if (!boxId) return;
    setStatusMsg("");

    // prevent duplicate
    if (boxSources.some((b) => b.boxId === boxId)) {
      setStatusMsg("Box already added.");
      return;
    }

    try {
      // Try clean_product_storage
      const tryTables = [
        {
          table: "clean_product_storage",
          idCol: "Box_ID",
          lotCol: "Lot_Number",
          prodCol: "Product",
          amtCol: "Amount",
          supplierCol: "Supplier",
        },
        {
          table: "rerun_product_storage",
          idCol: "Box_ID",
          lotCol: "Lot_Number",
          prodCol: "Product",
          amtCol: "Amount",
          supplierCol: "Supplier",
        },
        {
          table: "screening_storage_shed",
          idCol: "Box_ID",
          lotCol: "Lot_Number",
          prodCol: "Product",
          amtCol: "Amount",
          supplierCol: "Supplier",
        },
      ];

      let found = null;

      for (const cfg of tryTables) {
        const { data, error } = await supabase
          .from(cfg.table)
          .select("*")
          .eq(cfg.idCol, boxId)
          .maybeSingle();

        if (error) {
          if (error.code !== "PGRST116") {
            console.warn(`Lookup error in ${cfg.table}:`, error.message);
          }
        }

        if (data) {
          found = {
            sourceTable: cfg.table,
            boxId,
            lotNumber: data[cfg.lotCol] || "",
            product: data[cfg.prodCol] || "",
            amount: safeNum(data[cfg.amtCol]),
            supplier: data[cfg.supplierCol] || null,
          };
          break;
        }
      }

      if (!found) {
        setStatusMsg("Box ID not found in source tables.");
        return;
      }

      setBoxSources((prev) => [...prev, found]);
      setNewBoxId("");
      setStatusMsg(`Added box ${boxId} from ${found.sourceTable}.`);
    } catch (err) {
      console.error("Error adding box source:", err);
      setStatusMsg("Error looking up box.");
    }
    dirtyRef.current = true;
    markTyping();
  };

  const handleRemoveBoxSource = (index) => {
    setBoxSources((prev) => prev.filter((_, i) => i !== index));
  };

  // ───────────────────────────── Handlers: CO₂ Draws ─────────────────────────────

  const handleAddCo2Draw = () => {
    if (!newCo2Bin) {
      setStatusMsg("Select a CO₂ bin.");
      return;
    }
    const w = safeNum(newCo2Weight);
    if (w <= 0) {
      setStatusMsg("Enter a valid weight from CO₂ bin.");
      return;
    }

    const bin = co2Bins.find((b) => b.co2_bin === newCo2Bin);
    if (!bin) {
      setStatusMsg("Selected CO₂ bin not found.");
      return;
    }

    // ensure we don't exceed bin total (based on already planned draws)
    const already = co2Draws
      .filter((d) => d.co2_bin === newCo2Bin)
      .reduce((s, d) => s + safeNum(d.weightLbs), 0);

    if (already + w > safeNum(bin.total_weight)) {
      setStatusMsg(
        `Cannot draw ${w} lbs from ${newCo2Bin}; exceeds available (${bin.total_weight} lbs).`
      );
      return;
    }

    setCo2Draws((prev) => [
      ...prev,
      {
        id: `${newCo2Bin}-${Date.now()}-${prev.length + 1}`,
        co2_bin: newCo2Bin,
        weightLbs: w,
        lotNumbers: bin.lot_numbers || [],
        products: bin.products || [],
      },
    ]);
    setNewCo2Weight("");
    setStatusMsg(`Added ${w} lbs from ${newCo2Bin}.`);
    dirtyRef.current = true;
    markTyping();
  };

  const handleRemoveCo2Draw = (id) => {
    setCo2Draws((prev) => prev.filter((d) => d.id !== id));
  };

  // ───────────────────────────── Handlers: Pallets ─────────────────────────────

  const addPallet = (bagType) => {
    const isTote = bagType === "2000lb tote";
        const newId = makePalletId(pallets.length); // generate once here
        setPallets((prev) => [
            ...prev,
            {
            id: newId,               // ✅ store this permanent ID
            pallet_id: newId,        // ✅ for clarity when saving
            bagType,
            numBags: isTote ? 1 : "",
            totalWeight: isTote ? 2000 : "",
            storageLocation: "",
            notes: "",
            },
        ]);
        dirtyRef.current = true;
        markTyping();
    };



  const updatePallet = (index, field, value) => {
    setPallets((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    dirtyRef.current = true;
    markTyping();
  };

  const removePallet = (index) => {
    setPallets((prev) => prev.filter((_, i) => i !== index));
    dirtyRef.current = true;
    markTyping();
  };

  const getPalletDisplayWeight = (p) => {
    const manual = safeNum(p.totalWeight);
    if (manual > 0) return manual;
    const n = safeNum(p.numBags);
    if (p.bagType === "25lb") return n * 25;
    if (p.bagType === "50lb") return n * 50;
    if (p.bagType === "2000lb tote") return n * 2000;
    return 0;
  };

  // ───────────────────────────── Complete / Save ─────────────────────────────

  const handleComplete = async () => {
    setStatusMsg("");
    if (!selectedEmployee) {
      alert("Select an employee before completing.");
      return;
    }
    if (inboundTotals.total <= 0) {
      alert("Add at least one inbound box or CO₂ draw.");
      return;
    }
    if (pallets.length === 0) {
      alert("Add at least one pallet/tote output.");
      return;
    }

    const palletPayload = pallets.map((p, idx) => {
      const total = getPalletDisplayWeight(p);
      return {
        pallet_id: p.pallet_id || makePalletId(idx),
        lot_number: combinedLots || "",
        product: combinedProducts || "",
        supplier: combinedSuppliers || null,
        bag_type: p.bagType,
        num_bags: safeNum(p.numBags),
        total_weight: total,
        storage_location: p.storageLocation || "Unknown",
        notes: p.notes || notes || null,
      };
    });

    const sumPallets = palletPayload.reduce(
      (s, p) => s + safeNum(p.total_weight),
      0
    );

    if (sumPallets <= 0) {
      alert("All pallets/totes have zero weight.");
      return;
    }

    // soft sanity check (no hard block: scale quirks etc)
    if (sumPallets - inboundTotals.total > 50) {
      const proceed = confirm(
        `Warning: outputs (${sumPallets} lbs) are significantly greater than inputs (${inboundTotals.total} lbs). Continue?`
      );
      if (!proceed) return;
    }

    setProcessing(true);
    try {
      // 1) Insert pallets into bagged_storage
      const { error: insertErr } = await supabase
        .from("bagged_storage")
        .insert(palletPayload);
      if (insertErr) {
        console.error("Bagged storage insert error:", insertErr);
        throw new Error(insertErr.message);
      }

      // 2) Update inside_co2_bins totals
      const drawsByBin = co2Draws.reduce((acc, d) => {
        acc[d.co2_bin] = (acc[d.co2_bin] || 0) + safeNum(d.weightLbs);
        return acc;
      }, {});

      for (const [binName, used] of Object.entries(drawsByBin)) {
        const bin = co2Bins.find((b) => b.co2_bin === binName);
        if (!bin) continue;
        const newWeight = Math.max(safeNum(bin.total_weight) - used, 0);
        const { error: upErr } = await supabase
          .from("inside_co2_bins")
          .update({ total_weight: newWeight })
          .eq("co2_bin", binName);
        if (upErr) {
          console.error(`Failed to update ${binName}:`, upErr.message);
        }
      }

      // 3) (Optional / future) Remove consumed box sources from their tables
      //    For now, we assume boxSources are fully used in bagging.
      // Replace your current full delete section:
    for (const b of boxSources) {
    if (!b.boxId || !b.sourceTable) continue;
    const used = safeNum(b.amount); // full or partial amount used
    const { data: record, error: getErr } = await supabase
        .from(b.sourceTable)
        .select("Amount")
        .eq("Box_ID", b.boxId)
        .maybeSingle();

    if (getErr) continue;
    if (!record) continue;

    const remaining = Math.max(safeNum(record.Amount) - used, 0);
    if (remaining <= 0) {
        // remove box entirely
        await supabase.from(b.sourceTable).delete().eq("Box_ID", b.boxId);
    } else {
        // update with new remaining weight
        await supabase
        .from(b.sourceTable)
        .update({ Amount: remaining })
        .eq("Box_ID", b.boxId);
    }
    }

      // 4) Insert report record
        const reportPayload = {
            process_type: "Bagging",
            employee: selectedEmployee,
            notes,
            lot_numbers: combinedLots,
            products: combinedProducts,
            supplier: combinedSuppliers,
            input_total: inboundTotals.total,
            output_total: sumPallets,
            balance,
            inputs: {
                boxes: boxSources,
                co2_draws: co2Draws,
            },
            outputs: palletPayload,
        };

        const { error: repErr } = await supabase.from("bagging_reports").insert(reportPayload);
        if (repErr) console.error("Bagging report insert error:", repErr);


      // 5) Reset UI
      setBoxSources([]);
      setCo2Draws([]);
      setPallets([]);
      setNotes("");
      setNewBoxId("");
      setNewCo2Bin("");
      setNewCo2Weight("");
      setStatusMsg("✅ Bagging job completed and pallets saved.");
    } catch (err) {
      console.error("Error completing bagging job:", err);
      alert("Error saving bagging job: " + err.message);
      setStatusMsg("❌ Error saving bagging job.");
    } finally {
      setProcessing(false);
    }
  };

  // ───────────────────────────── Render ─────────────────────────────

  return (
    <ScrollingLayout title="Bagging Job" showBack={true}>
    <div className="mx-auto max-w-6xl p-6 bg-[#D9D9D9] flex flex-col overflow-y-auto h-full">

      {/* Top Row: Employee + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Left: Controls */}
        <div className="md:col-span-2 rounded-2xl bg-white border p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Employee
              </label>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">Select an employee…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about this bagging job…"
              />
            </div>

            {/* Combined Lots */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Field Lot Numbers (from inputs)
              </label>
              <div className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 min-h-[40px]">
                {combinedLots || "—"}
              </div>
            </div>

            {/* Combined Products */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Products (from inputs)
              </label>
              <div className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 min-h-[40px]">
                {combinedProducts || "—"}
              </div>
            </div>

                <div className="flex items-end gap-2">
                <button
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                    const snapshot = {
                        ...state,
                        selectedEmployee,
                        notes,
                        inputs: boxSources,
                        co2Draws,
                        pallets,
                        };

                        localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
                        alert("Draft saved!");
                        dirtyRef.current = false;
                    }}
                >
                    Save Draft
                </button>

                <button
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => {
                    if (!confirm("Clear saved draft?")) return;
                    localStorage.removeItem(LS_KEY);
                    setState(DEFAULT_STATE);
                    alert("Draft cleared.");
                    }}
                >
                    Clear Draft
                </button>
                </div>


          </div>
        </div>

        {/* Right: Summary */}
        <div className="rounded-2xl bg-white border p-4 shadow-sm">
          <h3 className="text-base font-semibold mb-2">Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-gray-500 text-xs">Inbound from Boxes</div>
              <div className="font-semibold">
                {inboundTotals.fromBoxes.toLocaleString()} lbs
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Inbound from CO₂</div>
              <div className="font-semibold">
                {inboundTotals.fromCo2.toLocaleString()} lbs
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Total Inbound</div>
              <div className="font-semibold">
                {inboundTotals.total.toLocaleString()} lbs
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Total Outputs</div>
              <div className="font-semibold">
                {palletsTotalWeight.toLocaleString()} lbs
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Balance</div>
              <div
                className={`font-semibold ${
                  Math.abs(balance) > 25 ? "text-red-600" : "text-gray-900"
                }`}
              >
                {balance.toLocaleString()} lbs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inputs: Box Sources */}
      <div className="mb-6 rounded-2xl bg-white border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Input Boxes</h3>
          <span className="text-xs text-gray-500">
            Scan or type Box ID from clean / rerun / screenings
          </span>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            placeholder="Enter Box ID (e.g., 1234C1)"
            value={newBoxId}
            onChange={(e) => setNewBoxId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddBoxSource();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddBoxSource}
            className="px-4 py-2 rounded-lg bg-[#3D5147] text-white text-sm"
          >
            + Add Box
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-t">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-2 py-1 text-left">Box ID</th>
                <th className="px-2 py-1 text-left">Source</th>
                <th className="px-2 py-1 text-left">Lot #</th>
                <th className="px-2 py-1 text-left">Product</th>
                <th className="px-2 py-1 text-right">Weight (lbs)</th>
                <th className="px-2 py-1 text-center">Remove</th>
              </tr>
            </thead>
            <tbody>
              {boxSources.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-2 py-2 text-center text-gray-400"
                  >
                    No input boxes added.
                  </td>
                </tr>
              ) : (
                boxSources.map((b, i) => (
                  <tr key={`${b.boxId}-${i}`} className="border-t">
                    <td className="px-2 py-1">{b.boxId}</td>
                    <td className="px-2 py-1">{b.sourceTable}</td>
                    <td className="px-2 py-1">{b.lotNumber}</td>
                    <td className="px-2 py-1">{b.product}</td>
                    <td className="px-2 py-1 text-right">
                      {b.amount.toLocaleString()}
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        type="button"
                        className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50"
                        onClick={() => handleRemoveBoxSource(i)}
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

      {/* Inputs: CO₂ Bin Draws */}
      <div className="mb-6 rounded-2xl bg-white border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">CO₂ Bin Inputs</h3>
          <span className="text-xs text-gray-500">
            Use existing inside_co2_bins records
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <select
            className="border rounded-lg px-3 py-2 text-sm flex-1"
            value={newCo2Bin}
            onChange={(e) => setNewCo2Bin(e.target.value)}
          >
            <option value="">Select CO₂ bin…</option>
            {co2Bins.map((b) => (
              <option key={b.co2_bin} value={b.co2_bin}>
                {b.co2_bin} — {safeNum(b.total_weight).toLocaleString()} lbs
              </option>
            ))}
          </select>
          <input
            type="number"
            className="border rounded-lg px-3 py-2 text-sm w-40"
            placeholder="Weight (lbs)"
            value={newCo2Weight}
            onChange={(e) => setNewCo2Weight(e.target.value)}
            min="0"
          />
          <button
            type="button"
            onClick={handleAddCo2Draw}
            className="px-4 py-2 rounded-lg bg-[#3D5147] text-white text-sm"
          >
            + Add CO₂ Input
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-t">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-2 py-1 text-left">CO₂ Bin</th>
                <th className="px-2 py-1 text-left">Lot #</th>
                <th className="px-2 py-1 text-left">Products</th>
                <th className="px-2 py-1 text-right">Weight (lbs)</th>
                <th className="px-2 py-1 text-center">Remove</th>
              </tr>
            </thead>
            <tbody>
              {co2Draws.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-2 text-center text-gray-400"
                  >
                    No CO₂ inputs added.
                  </td>
                </tr>
              ) : (
                co2Draws.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="px-2 py-1">{d.co2_bin}</td>
                    <td className="px-2 py-1">
                      {uniq((d.lotNumbers || []).map(String)).join(", ") ||
                        "—"}
                    </td>
                    <td className="px-2 py-1">
                      {uniq((d.products || []).map(String)).join(", ") || "—"}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {safeNum(d.weightLbs).toLocaleString()}
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        type="button"
                        className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50"
                        onClick={() => handleRemoveCo2Draw(d.id)}
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

      {/* Outputs: Pallets / Totes */}
      <div className="mb-6 rounded-2xl bg-white border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Outputs (Pallets & Totes)</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addPallet("25lb")}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50"
            >
              + 25 lb Pallet
            </button>
            <button
              type="button"
              onClick={() => addPallet("50lb")}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50"
            >
              + 50 lb Pallet
            </button>
            <button
              type="button"
              onClick={() => addPallet("2000lb tote")}
              className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50"
            >
              + 2000 lb Tote
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-t">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-2 py-1 text-left">Pallet ID (preview)</th>
                <th className="px-2 py-1 text-left">Type</th>
                <th className="px-2 py-1 text-right"># Bags</th>
                <th className="px-2 py-1 text-right">
                  Total Weight (lbs)
                  <span className="block text-[9px] text-gray-400">
                    Auto by bags; override if needed
                  </span>
                </th>
                <th className="px-2 py-1 text-left">Storage Location</th>
                <th className="px-2 py-1 text-left">Notes</th>
                <th className="px-2 py-1 text-center">Remove</th>
              </tr>
            </thead>
            <tbody>
              {pallets.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-2 py-2 text-center text-gray-400"
                  >
                    No pallets/totes added.
                  </td>
                </tr>
              ) : (
                pallets.map((p, i) => {
                  const auto =
                    p.bagType === "25lb"
                      ? safeNum(p.numBags) * 25
                      : p.bagType === "50lb"
                      ? safeNum(p.numBags) * 50
                      : p.bagType === "2000lb tote"
                      ? safeNum(p.numBags || 1) * 2000
                      : 0;

                  const display =
                    p.totalWeight && safeNum(p.totalWeight) > 0
                      ? safeNum(p.totalWeight)
                      : auto;

                  return (
                    <tr key={p.id} className="border-t">
                      <td className="px-2 py-1">{p.pallet_id}</td>
                      <td className="px-2 py-1">{p.bagType}</td>
                      <td className="px-2 py-1 text-right">
                        <input
                          type="number"
                          min="0"
                          className="w-16 border rounded px-1 py-0.5 text-right"
                          value={p.numBags}
                          onChange={(e) =>
                            updatePallet(i, "numBags", e.target.value)
                          }
                          disabled={p.bagType === "2000lb tote"}
                        />
                      </td>
                      <td className="px-2 py-1 text-right">
                        <input
                          type="number"
                          className="w-24 border rounded px-1 py-0.5 text-right"
                          value={p.totalWeight}
                          onChange={(e) =>
                            updatePallet(i, "totalWeight", e.target.value)
                          }
                          placeholder={auto ? auto : "0"}
                        />
                        <div className="text-[9px] text-gray-400">
                          {auto > 0 && !p.totalWeight
                            ? `Auto: ${auto} lbs`
                            : p.totalWeight
                            ? "Custom"
                            : ""}
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          className="w-full border rounded px-1 py-0.5"
                          placeholder="e.g., Refrigerator, Warehouse A"
                          value={p.storageLocation}
                          onChange={(e) =>
                            updatePallet(i, "storageLocation", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          className="w-full border rounded px-1 py-0.5"
                          placeholder="Optional"
                          value={p.notes}
                          onChange={(e) =>
                            updatePallet(i, "notes", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          type="button"
                          className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-50"
                          onClick={() => removePallet(i)}
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

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 mt-4">
        <div className="text-sm text-gray-600">
          {statusMsg || "Review inputs and outputs before completing."}
        </div>
        <button
          type="button"
          onClick={handleComplete}
          disabled={processing}
          className="px-5 py-2 rounded-xl bg-[#5D1214] text-white text-sm font-semibold disabled:opacity-60"
        >
          {processing ? "Saving…" : "Complete Bagging Job"}
        </button>
      </div>
    </div>
    </ScrollingLayout>
  );
}
