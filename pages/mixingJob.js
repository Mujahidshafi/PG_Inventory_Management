import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/layout";

function MixingJob() {
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
  }, []);

  // 🔹 Fetch box details by Box_ID from any source table
  const handleAddBox = async () => {
    if (!newBoxId.trim()) {
      alert("Please enter a Box ID.");
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
        .eq("Box_ID", newBoxId.trim())
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
      alert(`No box found with ID "${newBoxId.trim()}"`);
      setLoading(false);
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
    };

    setState((prev) => ({
      ...prev,
      boxes: [...prev.boxes, boxEntry],
    }));

    setNewBoxId("");
    setLoading(false);
  };

  // 🔹 Update box field (used weight, partial flag, location)
  const handleBoxChange = (index, field, value) => {
    setState((prev) => {
      const updated = [...prev.boxes];
      updated[index][field] = value;

      // Ensure numeric input is handled safely
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
  };

  // 🔹 Save the mixing process
  const handleCompleteMix = async () => {
  if (!state.processID.trim() || !state.co2Bin) {
    alert("⚠️ Please enter a Process ID and select a Co2 bin.");
    return;
  }

  const confirmMsg = `Are you sure you want to complete Mixing Process ${state.processID} for ${state.co2Bin}?`;
  if (!window.confirm(confirmMsg)) return;

  const { supabase } = await import("../lib/supabaseClient");

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
    const lotSet = Array.from(
      new Set(state.boxes.map((b) => b.Lot_Number).filter(Boolean))
    );
    const productSet = Array.from(
      new Set(state.boxes.map((b) => b.Product).filter(Boolean))
    );

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
    console.log(`✅ Updated existing bin ${state.co2Bin}`);

    // --- Update partial boxes in their source tables ---
    for (const b of updatedBoxes) {
      const safeLocation =
        b.NewLocation?.trim() || b.Location?.trim() || "Mill Storage";

      // --- Update partial boxes in their respective source tables ---
    for (const b of updatedBoxes) {
      const table = b.SourceTable || "clean_product_storage"; // default fallback
      const safeLocation = b.NewLocation?.trim() || b.Location?.trim() || "Mill Storage";

      if (b.IsPartial) {
        // ✅ Update the remaining weight in the correct table
        const { error: updateError } = await supabase
          .from(table)
          .update({
            Amount: Number(b.New_Box_Weight),
            Location: safeLocation,
          })
          .eq("Box_ID", b.Box_ID);

        if (updateError) {
          console.error(`❌ Error updating partial box ${b.Box_ID} in ${table}:`, updateError.message);
        } else {
          console.log(`✅ Updated partial box ${b.Box_ID} (${table}) → new weight: ${b.New_Box_Weight}`);
        }
      } else {
        // 🗑️ Remove full boxes from the correct table
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq("Box_ID", b.Box_ID);

        if (deleteError) {
          console.error(`❌ Error deleting box ${b.Box_ID} from ${table}:`, deleteError.message);
        } else {
          console.log(`🗑️ Deleted full box ${b.Box_ID} from ${table}.`);
        }
      }
    }
  }


    // --- Create a Mixing Report entry ---
    try {
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

      if (reportError) {
        console.error("❌ Error saving mixing report:", reportError.message);
      } else {
        console.log("✅ Mixing report successfully saved.");
      }
    } catch (err) {
      console.error("❌ Unexpected error creating mixing report:", err);
    }

    // --- Reset UI + Local State ---
    setState(DEFAULT_STATE);
    setNewBoxId("");
    alert("✅ Mixing process complete and report saved!");
  } catch (err) {
    console.error("❌ Error completing mix:", err);
    alert("Error completing mix: " + err.message);
  }
};



  return (
    <Layout title="Mixing Process (CO₂ Bins)" showBack={true}>
    <div className="max-w-5xl mx-auto p-6">

      <div>
        <label className="block text-sm font-medium mb-1">Employee</label>
        <select
          className="border rounded-lg px-3 py-2 w-full"
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
            onChange={(e) =>
              setState((prev) => ({ ...prev, processID: e.target.value }))
            }
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="Enter new process ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="co2-bin">CO₂ Bin</label>
          <select
            value={state.co2Bin}
            onChange={(e) =>
              setState((prev) => ({ ...prev, co2Bin: e.target.value }))
            }
            className="border rounded-lg px-3 py-2 w-full"
            id="co2-bin"
          >
            <option value="">Select Bin</option>
            <option value="Co2-1">Co2-1</option>
            <option value="Co2-2">Co2-2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <input
            type="text"
            value={state.notes}
            onChange={(e) =>
              setState((prev) => ({ ...prev, notes: e.target.value }))
            }
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="Optional notes"
          />
        </div>
      </div>

      {/* Box Input */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Enter Box ID (e.g., 1234C1)"
          value={newBoxId}
          onChange={(e) => setNewBoxId(e.target.value)}
          className="border rounded-lg px-3 py-2 flex-1"
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
                // Default: if not partial, assume full box is used
                const original = Number(b.Original_Weight) || 0;
                const newBox = b.IsPartial ? Number(b.New_Box_Weight) || 0 : 0;
                const inputWeight = Math.max(original - newBox, 0);

                return (
                    <tr key={i} className="border-t">
                    {/* Box ID */}
                    <td className="p-2">{b.Box_ID}</td>

                    {/* Product */}
                    <td className="p-2">{b.Product}</td>

                    {/* Lot # */}
                    <td className="p-2">{b.Lot_Number}</td>

                    {/* Original Weight */}
                    <td className="p-2 text-right font-medium">{original.toFixed(1)}</td>

                    {/* New Box Weight (only editable if partial) */}
                    <td className="p-2">
                        <input
                        type="number"
                        className={`border rounded px-2 py-1 w-24 text-right ${
                            b.IsPartial ? "bg-white" : "bg-gray-100 text-gray-400"
                        }`}
                        value={
                            b.IsPartial
                            ? b.New_Box_Weight ?? ""
                            : b.Original_Weight?.toFixed(1)
                        }
                        onChange={(e) =>
                            b.IsPartial &&
                            handleBoxChange(i, "New_Box_Weight", e.target.value)
                        }
                        disabled={!b.IsPartial}
                        />
                    </td>

                    {/* Input Weight (auto) */}
                    <td className="p-2 text-right font-semibold text-green-700">
                        {isNaN(inputWeight) ? "—" : inputWeight.toFixed(1)}

                    </td>

                    {/* Partial Checkbox */}
                    <td className="p-2 text-center">
                        <input
                        type="checkbox"
                        checked={b.IsPartial}
                        onChange={(e) =>
                            handleBoxChange(i, "IsPartial", e.target.checked)
                        }
                        />
                    </td>

                    {/* New Location — visible only when Partial */}
                    <td className="p-2">
                        {b.IsPartial ? (
                        <input
                            type="text"
                            placeholder="Enter new location"
                            className="border rounded px-2 py-1 w-32"
                            value={b.NewLocation || ""}
                            onChange={(e) =>
                            handleBoxChange(i, "NewLocation", e.target.value)
                            }
                        />
                        ) : (
                        "-"
                        )}
                    </td>

                    {/* Remove Button */}
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

      {/* Complete Button */}
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