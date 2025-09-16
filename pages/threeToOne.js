import React, { useState, useEffect } from "react";
import Layout from "../components/layout";

function ThreeToOne() {
  const [boxes, setBoxes] = useState([]);
  const [allBoxes, setAllBoxes] = useState([]);
  const [storeTo, setStoreTo] = useState("Co2 1");
  const [dateTime, setDateTime] = useState("");

  // Fetch all boxes from API
  useEffect(() => {
    const fetchBoxes = async () => {
      const res = await fetch("/api/threeToOneBackend");
      const data = await res.json();
      setAllBoxes(data);
      setBoxes(Array.from({ length: 10 }, () => ({ box1: "", box2: "", box3: "" })));
    };
    fetchBoxes();
  }, []);

  const handleChange = (rowIndex, key, value) => {
    const updated = [...boxes];
    updated[rowIndex][key] = value;
    setBoxes(updated);
  };

  const addRow = () => setBoxes([...boxes, { box1: "", box2: "", box3: "" }]);
  const removeRow = () => {
    if (boxes.length > 1) setBoxes(boxes.slice(0, -1));
  };

  const handleSave = async () => {
    try {
      // Fetch storage
      const { data: storageData, error: storageError } = await supabase
        .from("storage_locations")
        .select("*")
        .eq("storage_name", storeTo)
        .single();
      if (storageError) throw storageError;

      let totalWeightToAdd = 0;
      let productsToAdd = [...storageData.products];
      let fieldLotsToAdd = [...storageData.field_lots];

      for (let row of boxes) {
        for (let key of ["box1", "box2", "box3"]) {
          const boxNumber = row[key];
          if (!boxNumber) continue;

          const box = allBoxes.find((b) => b.box_number === boxNumber);
          if (!box) {
            alert(`Box ${boxNumber} not found!`);
            return;
          }

          if (box.location !== "Mill") {
            alert(`Box ${boxNumber} has already been moved to ${box.location}!`);
            return;
          }

          totalWeightToAdd += box.weight;

          // Update products
          const productIndex = productsToAdd.findIndex((p) => p.product === box.product);
          if (productIndex >= 0) {
            productsToAdd[productIndex].weight += box.weight;
          } else {
            productsToAdd.push({ product: box.product, weight: box.weight });
          }

          // Update field lots
          if (!fieldLotsToAdd.includes(box.field_lot_number)) {
            fieldLotsToAdd.push(box.field_lot_number);
          }

          // Update box location and weight
          const { error: boxError } = await supabase
            .from("boxes")
            .update({ location: storeTo, weight: 0 })
            .eq("box_number", boxNumber);
          if (boxError) throw boxError;

          // Log box history
          const { error: historyError } = await supabase
            .from("box_history")
            .insert({
              box_number: boxNumber,
              from_location: box.location,
              to_location: storeTo,
              weight_moved: box.weight,
              moved_at: dateTime || new Date().toISOString(),
            });
          if (historyError) throw historyError;
        }
      }

      // Update storage
      const { error: updateStorageError } = await supabase
        .from("storage_locations")
        .update({
          total_weight: storageData.total_weight + totalWeightToAdd,
          products: productsToAdd,
          field_lots: fieldLotsToAdd,
        })
        .eq("storage_name", storeTo);
      if (updateStorageError) throw updateStorageError;

      alert("Mix saved successfully!");

      // Refresh boxes
      const { data: refreshedBoxes } = await supabase.from("boxes").select("*");
      setAllBoxes(refreshedBoxes);
      setBoxes(Array.from({ length: 10 }, () => ({ box1: "", box2: "", box3: "" })));
    } catch (error) {
      console.error(error);
      alert("Error saving mix. Check console for details.");
    }
  };

  return (
    <Layout title="Mix">
      <div className="w-full h-full flex flex-col items-center gap-6 overflow-y-scroll">
        <h1 className="text-black text-3xl font-bold mb-6 text-center">Three to One</h1>

        <div className="w-full flex gap-8 justify-center">
          {/* Left Table */}
          <div className="w-2/3 flex flex-col gap-4">
            <table className="table-auto w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 px-4 py-2 text-left">Crop 1</th>
                  <th className="border border-gray-400 px-4 py-2 text-left">Crop 2</th>
                  <th className="border border-gray-400 px-4 py-2 text-left">Crop 3</th>
                </tr>
              </thead>
              <tbody>
                {boxes.map((row, i) => (
                  <tr key={i}>
                    {["box1", "box2", "box3"].map((key, j) => (
                      <td key={j} className="border border-gray-300 px-2 py-1 bg-gray-100">
                        <input
                          type="text"
                          value={row[key]}
                          onChange={(e) => handleChange(i, key, e.target.value)}
                          placeholder={`Box #${i + 1}`}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Controls */}
          <div className="w-1/3 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Store To</label>
              <select
                value={storeTo}
                onChange={(e) => setStoreTo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg shadow bg-gray-100"
              >
                <option value="Co2 1">Co2 1</option>
                <option value="Co2 2">Co2 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg shadow bg-gray-100"
              />
            </div>

            <button
              onClick={handleSave}
              className="bg-[#5D1214] text-white px-6 py-2 rounded-[15px] text-lg font-semibold text-center hover:bg-[#3D5147] transition-all duration-300"
            >
              Save
            </button>

            <div className="flex gap-2 mt-2">
              <button
                onClick={addRow}
                className="px-6 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition"
              >
                + Add Row
              </button>
              <button
                onClick={removeRow}
                className="px-6 py-2 bg-red-600 text-white rounded-xl shadow hover:bg-red-700 transition"
              >
                – Remove Row
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ThreeToOne;
