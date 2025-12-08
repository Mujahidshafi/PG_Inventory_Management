import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/layout";

function MixingJob() {
  // ===== Draft / Autosave config =====
  const DRAFT_KEY = "mixingJob:draft:v1";
  const AUTOSAVE_MS = 600; // debounce

  const DEFAULT_STATE = {
    processID: "",
    co2Bin: "",
    notes: "",
    boxes: [],
  };

  const [state, setState] = useState(DEFAULT_STATE);
  const [newBoxId, setNewBoxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // scanner input focus + Enter-to-add
  const scanInputRef = useRef(null);
  const autosaveTimerRef = useRef(null);

  const [bins, setBins] = useState([]);

  const fetchBins = async () => {
  try {
    const { data, error } = await supabase
      .from("inside_co2_bins")
      .select("co2_bin")
      .order("co2_bin", { ascending: true });

    if (error) {
      console.error("Error fetching bins:", error);
      // Keep the current selection visible even on error
      setBins((prev) => {
        const s = new Set(prev);
        if (state.co2Bin) s.add(state.co2Bin);
        return Array.from(s).sort();
      });
      return;
    }

    const list = Array.from(
      new Set((data || []).map((r) => String(r.co2_bin).trim()).filter(Boolean))
    );

    // Ensure the drafted/selected bin remains visible even if not in the result yet
    if (state.co2Bin && !list.includes(state.co2Bin)) list.push(state.co2Bin);

    setBins(list.sort());
  } catch (e) {
    console.error("Unexpected bins fetch error:", e);
    setBins((prev) => {
      const s = new Set(prev);
      if (state.co2Bin) s.add(state.co2Bin);
      return Array.from(s).sort();
    });
  }
};

useEffect(() => {
  fetchBins();

  // Realtime: refresh when inside_co2_bins changes
  const channel = supabase
    .channel("realtime:inside_co2_bins")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "inside_co2_bins" },
      () => fetchBins()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

// If a draft later sets state.co2Bin, make sure it’s in the options
useEffect(() => {
  if (!state.co2Bin) return;
  setBins((prev) => {
    const s = new Set(prev);
    s.add(state.co2Bin);
    return Array.from(s).sort();
  });
}, [state.co2Bin]);

  // === Load draft on mount ===
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === "object") {
          setState(draft.state ?? DEFAULT_STATE);
          setSelectedEmployee(draft.selectedEmployee ?? "");
        }
      }
    } catch {}
  }, []);

  // === Autosave (debounced) whenever state/employee changes ===
  useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ state, selectedEmployee, ts: Date.now() })
        );
      } catch {}
    }, AUTOSAVE_MS);
    return () => clearTimeout(autosaveTimerRef.current);
  }, [state, selectedEmployee]);

  // === Manual Draft actions (like Qsage) ===
  const saveDraft = () => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ state, selectedEmployee, ts: Date.now() })
      );
      alert("Draft saved.");
    } catch (e) {
      alert("Failed to save draft.");
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setState(DEFAULT_STATE);
    setSelectedEmployee("");
    setNewBoxId("");
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("name")
          .eq("active", true);
        if (error) throw error;
        setEmployees(data || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();

    // focus the scanner input right away
    setTimeout(() => scanInputRef.current?.focus(), 0);
  }, []);

  // 🔹 Fetch box details by Box_ID from any source table
  const handleAddBox = async () => {
    const id = newBoxId.trim();
    if (!id) return; // silent ignore for scanner hiccups

    // prevent duplicates
    if (state.boxes.some((b) => String(b.Box_ID).trim() === id)) {
      // still refocus+clear so scanning can continue smoothly
      setNewBoxId("");
      scanInputRef.current?.focus();
      return;
    }

    setLoading(true);
    const tables = [
      "clean_product_storage",
      "rerun_product_storage",
      "screening_storage_shed",
    ];

    let foundBox = null;
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("Box_ID", id)
        .maybeSingle();

      if (data) {
        foundBox = { ...data, SourceTable: table };
        break;
      }
      if (error && error.code !== "PGRST116") {
        console.error("Fetch error:", error.message);
      }
    }

    if (!foundBox) {
      alert(`No box found with ID "${id}"`);
      setLoading(false);
      // keep value so worker can see what failed, but still refocus
      scanInputRef.current?.focus();
      return;
    }

    const boxEntry = {
      Box_ID: foundBox.Box_ID,
      Lot_Number: foundBox.Lot_Number || "",
      Product: foundBox.Product || "",
      Original_Weight: Number(foundBox.Amount) || 0,
      New_Box_Weight: null,
      IsPartial: false,
      NewLocation: "",
      SourceTable: foundBox.SourceTable,
      Location: foundBox.Location || "",
    };

    setState((prev) => ({
      ...prev,
      boxes: [...prev.boxes, boxEntry],
    }));

    setNewBoxId("");
    setLoading(false);

    // ready for the next scan
    scanInputRef.current?.focus();
  };

  // === Scanner-friendly handlers ===
  const handleScanKeyDown = (e) => {
    // most scanners send "Enter" at the end of the scan
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddBox();
    }
  };

  const handleScanBlur = () => {
    // optional: if the input lost focus with a value, auto-add (avoid double with Enter by checking loading or empty)
    if (newBoxId.trim() && !loading) handleAddBox();
  };

  // 🔹 Update box field (used weight, partial flag, location)
  const handleBoxChange = (index, field, value) => {
    setState((prev) => {
      const updated = [...prev.boxes];
      updated[index][field] = value;

      if (field === "Used_Weight" && isNaN(Number(value))) {
        updated[index][field] = 0;
      }

      return { ...prev, boxes: updated };
    });
  };

  // 🔹 Remove a box from the list
  const handleRemoveBox = (index) => {
    setState((prev) => ({
      ...prev,
      boxes: prev.boxes.filter((_, i) => i !== index),
    }));
    // keep focus in scanner field for fast workflows
    setTimeout(() => scanInputRef.current?.focus(), 0);
  };

  // 🔹 Save the mixing process (unchanged except: use existing supabase, minor dedupe)
  const handleCompleteMix = async () => {
    if (!state.processID.trim() || !state.co2Bin) {
      alert("⚠️ Please enter a Process ID and select a Co2 bin.");
      return;
    }

    const confirmMsg = `Are you sure you want to complete Mixing Process ${state.processID} for ${state.co2Bin}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      // --- Calculate total used weight for the bin ---
      let totalUsedWeight = 0;
      const updatedBoxes = [];

      for (const b of state.boxes) {
        const originalWeight = Number(b.Original_Weight) || 0;
        const newWeight = b.IsPartial ? Number(b.New_Box_Weight) || 0 : 0;
        const usedWeight = b.IsPartial ? Math.max(originalWeight - newWeight, 0) : originalWeight;
        totalUsedWeight += usedWeight;
        updatedBoxes.push({ ...b, Used_Weight: usedWeight });
      }

      // --- Build combined lot numbers and products ---
      const lotSet = Array.from(new Set(state.boxes.map((b) => b.Lot_Number).filter(Boolean)));
      const productSet = Array.from(new Set(state.boxes.map((b) => b.Product).filter(Boolean)));

      // --- Update or insert bin record in inside_co2_bins ---
      const { error: upsertError } = await supabase.from("inside_co2_bins").upsert(
        {
          co2_bin: state.co2Bin,
          process_id: state.processID,
          lot_numbers: lotSet,
          products: productSet,
          total_weight: totalUsedWeight,
          notes: state.notes?.trim() || null,
          boxes: updatedBoxes,
          created_at: new Date().toISOString(),
        },
        { onConflict: ["co2_bin"] }
      );
      if (upsertError) throw upsertError;

      // --- Update partial boxes or delete full boxes in their source tables ---
      for (const b of updatedBoxes) {
        const table = b.SourceTable || "clean_product_storage";
        const safeLocation = b.NewLocation?.trim() || b.Location?.trim() || "Mill Storage";

        if (b.IsPartial) {
          const { error: updateError } = await supabase
            .from(table)
            .update({ Amount: Number(b.New_Box_Weight), Location: safeLocation })
            .eq("Box_ID", b.Box_ID);
          if (updateError) console.error(`Error updating ${b.Box_ID} in ${table}:`, updateError.message);
        } else {
          const { error: deleteError } = await supabase.from(table).delete().eq("Box_ID", b.Box_ID);
          if (deleteError) console.error(`Error deleting ${b.Box_ID} from ${table}:`, deleteError.message);
        }
      }

      // --- Create a Mixing Report entry ---
      const { error: reportError } = await supabase.from("mixing_reports").insert({
        process_id: state.processID,
        process_type: "Mixing",
        co2_bin: state.co2Bin,
        lot_numbers: lotSet,
        products: productSet,
        total_weight: totalUsedWeight,
        notes: state.notes?.trim() || null,
        boxes: updatedBoxes,
        employee: selectedEmployee || null,
      });
      if (reportError) console.error("Error saving mixing report:", reportError.message);

      // --- Reset + clear draft ---
      setState(DEFAULT_STATE);
      setSelectedEmployee("");
      setNewBoxId("");
      localStorage.removeItem(DRAFT_KEY);

      alert("✅ Mixing process complete and report saved!");
      setTimeout(() => scanInputRef.current?.focus(), 0);
    } catch (err) {
      console.error("Error completing mix:", err);
      alert("Error completing mix: " + err.message);
    }
  };

  return (
    <Layout title="Mixing Process (CO₂ Bins)" showBack={true}>
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-xl border-black px-3 py-2 text-sm text-white bg-[#3D5147] hover:bg-red-950"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={clearDraft}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Clear Draft
          </button>
         
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Employee</label>
          <select
            className="border rounded-lg bg-white px-3 py-2 w-full"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">Select an employee...</option>
            {employees.map((emp) => (
              <option key={emp.name} value={emp.name}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Process Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Process ID</label>
            <input
              type="text"
              value={state.processID}
              onChange={(e) => setState((prev) => ({ ...prev, processID: e.target.value }))}
              className="border rounded-lg bg-white px-3 py-2 w-full"
              placeholder="Enter new process ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="co2-bin">
              CO₂ Bin
            </label>

            <div className="flex gap-2">
              <select
                id="co2-bin"
                className="border rounded-lg px-3 py-2 w-full bg-white"
                value={state.co2Bin}
                onChange={(e) => setState((prev) => ({ ...prev, co2Bin: e.target.value }))}
              >
                <option value="">Select Bin</option>
                {bins.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {bins.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No bins found in <code>inside_co2_bins</code>.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <input
              type="text"
              value={state.notes}
              onChange={(e) => setState((prev) => ({ ...prev, notes: e.target.value }))}
              className="border rounded-lg bg-white px-3 py-2 w-full"
              placeholder="Optional notes"
            />
          </div>
        </div>

        {/* Box Input (scanner-friendly) */}
        <div className="mb-6 flex gap-2">
          <input
            ref={scanInputRef}
            type="text"
            placeholder="Enter/Scan Box ID (e.g., 1234C1) and press Enter"
            value={newBoxId}
            onChange={(e) => setNewBoxId(e.target.value)}
            onKeyDown={handleScanKeyDown}
            onBlur={handleScanBlur}
            className="border rounded-lg bg-white px-3 py-2 flex-1"
          />
          <button
            onClick={handleAddBox}
            disabled={loading}
            className="bg-[#3D5147] text-white px-4 py-2 rounded-lg"
          >
            {loading ? "Searching..." : "+ Add Box"}
          </button>
        </div>

        {/* Box Table */}
        <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
          <table className="w-full text-sm text-center">
            <thead className="bg-gray-50 border-b text-gray-700">
              <tr>
                <th className="p-2">Box ID</th>
                <th className="p-2">Product</th>
                <th className="p-2">Lot #</th>
                <th className="p-2">Original Weight (lbs)</th>
                <th className="p-2">New Box Weight (lbs)</th>
                <th className="p-2">Input Weight (auto)</th>
                <th className="p-2">Partial?</th>
                <th className="p-2">New Location</th>
                <th className="p-2">Remove</th>
              </tr>
            </thead>
            <tbody>
              {state.boxes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-gray-400 py-3">
                    No boxes added yet.
                  </td>
                </tr>
              ) : (
                state.boxes.map((b, i) => {
                  const original = Number(b.Original_Weight) || 0;
                  const newBox = b.IsPartial ? Number(b.New_Box_Weight) || 0 : 0;
                  const inputWeight = Math.max(original - newBox, 0);

                  return (
                    <tr key={i} className="border-t">
                      <td className="p-2">{b.Box_ID}</td>
                      <td className="p-2">{b.Product}</td>
                      <td className="p-2">{b.Lot_Number}</td>
                      <td className="p-2 text-right font-medium">{original.toFixed(1)}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          className={`border rounded px-2 py-1 w-24 text-right ${
                            b.IsPartial ? "bg-white" : "bg-gray-100 text-gray-400"
                          }`}
                          value={b.IsPartial ? b.New_Box_Weight ?? "" : b.Original_Weight?.toFixed(1)}
                          onChange={(e) =>
                            b.IsPartial && handleBoxChange(i, "New_Box_Weight", e.target.value)
                          }
                          disabled={!b.IsPartial}
                        />
                      </td>
                      <td className="p-2 text-right font-semibold text-green-700">
                        {isNaN(inputWeight) ? "—" : inputWeight.toFixed(1)}
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={b.IsPartial}
                          onChange={(e) => handleBoxChange(i, "IsPartial", e.target.checked)}
                        />
                      </td>
                      <td className="p-2">
                        {b.IsPartial ? (
                          <input
                            type="text"
                            placeholder="Enter new location"
                            className="border rounded px-2 py-1 w-32"
                            value={b.NewLocation || ""}
                            onChange={(e) => handleBoxChange(i, "NewLocation", e.target.value)}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleRemoveBox(i)}
                          className="text-red-600 hover:underline"
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

        <div className="text-right font-semibold mt-2">
          Total Input Weight:{" "}
          {state.boxes
            .reduce((acc, b) => {
              const original = Number(b.Original_Weight) || 0;
              const newBox = b.IsPartial ? Number(b.New_Box_Weight) || 0 : 0;
              const input = b.IsPartial ? Math.max(original - newBox, 0) : original;
              return acc + input;
            }, 0)
            .toFixed(1)}{" "}
          lbs
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={handleCompleteMix}
            className="bg-[#5D1214] hover:bg-red-950 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Complete Mix
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default MixingJob;
