import React, { useState, useEffect } from "react";
import Layout from "../components/layout";
import Button from "../components/button";
import TextFields from "../components/textFields";
import DateTimeField from "../components/dateTimeField";
import { supabase } from "../lib/supabaseClient";

function NewFieldRun() {
  const siloOrder = [
    "HQ-1","HQ-2","HQ-3","HQ-4","HQ-5","HQ-6","HQ-7","HQ-8","HQ-9","HQ-10",
    "HQ-11","HQ-12","HQ-13","HQ-14","HQ-15","HQ-16","HQ-17","HQ-18",
    "BEN-5","BEN-6","BEN-7","BEN-8","BEN-9","BEN-10","BEN-11","BEN-12",
    "Co2-1","Co2-2","Boxes-Mill"
  ];

  const [fields, setFields] = useState({
    fieldLotNumber: "",
    productDescription: "",
    Weight: "",
    Moisture: "",
    Location: "",
  });
  const [dateTime, setDateTime] = useState("");
  const [binData, setBinData] = useState(null);
  const [status, setStatus] = useState("");

  // --- Fetch single bin data when location changes ---
  const fetchSelectedBin = async (location) => {
    if (!location) {
      setBinData(null);
      return;
    }

    const { data, error } = await supabase
      .from("field_run_storage_test")
      .select("*")
      .eq("location", location)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching bin:", error);
    } else {
      setBinData(data || null);
    }
  };

  useEffect(() => {
    fetchSelectedBin(fields.Location);
  }, [fields.Location]);

  const handleChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  // --- Save field run ---
  const handleSubmit = async () => {
    const { fieldLotNumber, productDescription, Weight, Moisture, Location } = fields;
    if (!Location || !fieldLotNumber || !productDescription || !Weight) {
      alert("Please fill in all required fields.");
      return;
    }

    const weightNum = Number(Weight);
    const moistureNum = Moisture ? Number(Moisture) : null;

    try {
      setStatus("Saving...");

      // Check if bin exists
      const { data: existing, error: fetchError } = await supabase
        .from("field_run_storage_test")
        .select("lot_number, product, weight, moisture")
        .eq("location", Location)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // ✅ Update existing bin
        const updatedLots = Array.isArray(existing.lot_number)
          ? [...new Set([...existing.lot_number, fieldLotNumber])]
          : [fieldLotNumber];
        const updatedProducts = Array.isArray(existing.product)
          ? [...new Set([...existing.product, productDescription])]
          : [productDescription];
        const newWeight = Number(existing.weight || 0) + weightNum;

        const { error: updateError } = await supabase
          .from("field_run_storage_test")
          .update({
            lot_number: updatedLots,
            product: updatedProducts,
            weight: newWeight,
            moisture: moistureNum,
            date_stored: new Date().toISOString(),
          })
          .eq("location", Location);

        if (updateError) throw updateError;
        setStatus(`✅ Updated ${Location}: +${weightNum} lbs added.`);
      } else {
        // ✅ Insert new bin entry
        const { error: insertError } = await supabase
          .from("field_run_storage_test")
          .insert({
            location: Location,
            lot_number: [fieldLotNumber],
            product: [productDescription],
            weight: weightNum,
            moisture: moistureNum,
            date_stored: new Date().toISOString(),
          });

        if (insertError) throw insertError;
        setStatus(`✅ Added new entry for ${Location}.`);
      }

      // Refresh that bin’s data
      await fetchSelectedBin(Location);

      // Reset form
      setFields({
        fieldLotNumber: "",
        productDescription: "",
        Weight: "",
        Moisture: "",
        Location,
      });
      setDateTime("");
    } catch (err) {
      console.error("❌ Error saving field run:", err);
      setStatus("❌ Error: " + err.message);
    }
  };

  return (
    <Layout title="New Field Run" showBack={true}>
      <div className="w-full px-8 flex flex-col items-center">
        {/* --- Input Form --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mb-10">
          {/* Location Dropdown */}
          <div>
            <label htmlFor="location" className="block text-center -mb-5">
              Select Location
            </label>
            <br />
            <select
              id="location"
              className="w-full px-3 py-2 border border-gray-400 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              value={fields.Location}
              onChange={(e) => handleChange("Location", e.target.value)}
            >
              <option value="">Select a bin...</option>
              {siloOrder.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <TextFields
            id="fieldLotNumber"
            label="Field Lot Number"
            type="text"
            value={fields.fieldLotNumber}
            onChange={(e) => handleChange("fieldLotNumber", e.target.value)}
            placeholder="Enter lot number"
          />

          <TextFields
            id="productDescription"
            label="Product Description"
            type="text"
            value={fields.productDescription}
            onChange={(e) => handleChange("productDescription", e.target.value)}
            placeholder="Enter product"
          />

          <TextFields
            id="Weight"
            label="Weight (lbs)"
            type="number"
            value={fields.Weight}
            onChange={(e) => handleChange("Weight", e.target.value)}
            placeholder="Enter weight"
          />

          <TextFields
            id="Moisture"
            label="Moisture (%)"
            type="number"
            value={fields.Moisture}
            onChange={(e) => handleChange("Moisture", e.target.value)}
            placeholder="Optional"
          />

          <DateTimeField value={dateTime} onChange={setDateTime} />
        </div>

        {/* Save Button */}
        <div className="flex justify-center mb-10">
          <Button label="Save" color="red" onClick={handleSubmit} />
        </div>

        {status && <p className="text-center text-sm font-medium">{status}</p>}

        {/* --- Bin Status --- */}
        {fields.Location && (
          <div className="w-full max-w-3xl mt-10">
            <h2 className="text-xl font-bold mb-4 text-center">
              Current Status: {fields.Location}
            </h2>

            {!binData ? (
              <p className="text-center text-gray-500">No data for this bin yet.</p>
            ) : (
              <div className="overflow-x-auto border rounded-lg shadow">
                <table className="w-full text-sm text-center">
                  <thead className="bg-gray-100 border-b font-semibold">
                    <tr>
                      <th className="p-2">Lot Numbers</th>
                      <th className="p-2">Products</th>
                      <th className="p-2">Weight (lbs)</th>
                      <th className="p-2">Moisture (%)</th>
                      <th className="p-2">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="p-2">
                        {Array.isArray(binData.lot_number)
                          ? binData.lot_number.join(", ")
                          : binData.lot_number}
                      </td>
                      <td className="p-2">
                        {Array.isArray(binData.product)
                          ? binData.product.join(", ")
                          : binData.product}
                      </td>
                      <td className="p-2">{binData.weight}</td>
                      <td className="p-2">{binData.moisture ?? "—"}</td>
                      <td className="p-2">
                        {new Date(binData.date_stored).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default NewFieldRun;
