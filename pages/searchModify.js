import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "../components/layout";
import { supabase } from "../lib/supabaseClient";

// process ids have not been added to supabase yet, so the save function will not work properly

function SearchModify() {
  const router = useRouter();
  const { lot, product, weight, dateTime, processId } = router.query;

  const [fieldLot, setFieldLot] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [weightValue, setWeight] = useState("");
  const [dateTimeValue, setDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Prefill form fields when query params are available
  useEffect(() => {
    if (lot) setFieldLot(lot);
    if (product) setProductDescription(product);
    if (weight) setWeight(weight);
    if (dateTime) setDateTime(dateTime);
  }, [lot, product, weight, dateTime]);

  // Save updated data
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!processId) {
      alert("Error: Missing process ID — cannot save changes.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("field_run_storage_test")
        .update({
          lot_number: fieldLot,
          product: productDescription,
          weight: weightValue,
          date_stored: dateTimeValue,
        })
        .eq("id", processId);

      if (error) throw error;

      setSuccessMessage("Record updated successfully!");
      setTimeout(() => router.push("/search"), 2000); // Redirect after success
    } catch (err) {
      console.error("Error updating record:", err);
      setErrorMessage("Failed to update record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Search Modify">
      <form
        onSubmit={handleSubmit}
        className="flex flex-row gap-10 flex-wrap max-w-full mx-auto mt-6"
      >
        {/* Field Lot */}
        <div className="flex flex-col w-60">
          <label className="font-semibold mb-1">Field Lot Number</label>
          <input
            className="border p-2 rounded border-black placeholder-gray-400 text-black"
            placeholder="Field Lot Number"
            value={fieldLot}
            onChange={(e) => setFieldLot(e.target.value)}
            required
          />
        </div>

        {/* Product Description */}
        <div className="flex flex-col w-60">
          <label className="font-semibold mb-1">Product Description</label>
          <input
            type="text"
            className="border p-2 rounded border-black placeholder-gray-400 text-black"
            placeholder="Enter product description"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            required
          />
        </div>

        {/* Weight */}
        <div className="flex flex-col w-40">
          <label className="font-semibold mb-1">Weight</label>
          <input
            className="border p-2 rounded border-black placeholder-gray-400 text-black"
            placeholder="Weight"
            value={weightValue}
            onChange={(e) => setWeight(e.target.value)}
            required
          />
        </div>

        {/* Date & Time */}
        <div className="flex flex-col w-60">
          <label className="font-semibold mb-1">Date & Time</label>
          <input
            className="border p-2 rounded border-black text-black"
            type="datetime-local"
            value={dateTimeValue}
            onChange={(e) => setDateTime(e.target.value)}
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-end">
          <button
            type="submit"
            className="bg-[#5A2E2E] text-white rounded-xl py-2 px-6 hover:bg-[#3D5147] shadow-md"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {/* Success/Error messages */}
      {successMessage && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-200 text-[#3D5147] p-4 rounded-md shadow-md text-center">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-red-200 text-[#5D1214] p-4 rounded-md shadow-md text-center">
          {errorMessage}
        </div>
      )}
    </Layout>
  );
}

export default SearchModify;
