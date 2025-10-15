import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";
import Layout from "../components/layout";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/router";

// process ids have not been added to supabase yet, so the delete function will not work properly

function Search() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedLot, setSelectedLot] = useState("");
  const [processData, setProcessData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productOptions, setProductOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [openMenus, setOpenMenus] = useState([]);

  // Popup & feedback states
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(null);

  // Fetch data for main table
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from("field_run_storage_test")
        .select("*");

      if (error) console.error("Error fetching data:", error);
      else {
        setProcessData(data);

        const years = [
          ...new Set(
            data.map((item) =>
              item.date_stored ? new Date(item.date_stored).getFullYear() : null
            )
          ),
        ]
          .filter(Boolean)
          .sort((a, b) => b - a);
        setYearOptions(years);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Fetch crop types
  useEffect(() => {
    async function fetchCropTypes() {
      const { data, error } = await supabase
        .from("crop_types")
        .select("crop_code");

      if (error) console.error("Error fetching crop types:", error);
      else {
        const uniqueCodes = [...new Set(data.map((item) => item.crop_code))]
          .filter(Boolean)
          .sort();
        setProductOptions(uniqueCodes);
      }
    }
    fetchCropTypes();
  }, []);

  const toggleMenu = (index) => {
    setOpenMenus((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const filteredResults = processData.filter((item) => {
    const productText = Array.isArray(item.product)
      ? item.product.join(", ")
      : String(item.product || "");
    const lotText = Array.isArray(item.lot_number)
      ? item.lot_number.join(", ")
      : String(item.lot_number || "");
    const locationText = Array.isArray(item.location)
      ? item.location.join(", ")
      : String(item.location || "");
    const combined = `${productText} ${lotText} ${locationText}`.toLowerCase();
    const matchesSearch = combined.includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProduct
      ? productText.includes(selectedProduct)
      : true;
    const matchesLot = selectedLot
      ? Array.isArray(item.lot_number)
        ? item.lot_number.includes(selectedLot)
        : item.lot_number === selectedLot
      : true;
    const yearValue = item.year
      ? item.year
      : item.date_stored
      ? new Date(item.date_stored).getFullYear()
      : null;
    const matchesYear = selectedYear ? yearValue === Number(selectedYear) : true;

    return matchesProduct && matchesSearch && matchesYear && matchesLot;
  });

  // Open confirmation popup
  const confirmDeleteProcess = (process) => {
    setSelectedProcess(process);
    setShowDeletePopup(true);
  };

  // Handle actual deletion
  const handleDeleteProcess = async (processId) => {
    const { error } = await supabase
      .from("field_run_storage_test")
      .delete()
      .eq("id", processId);

    if (error) {
      console.error("Error deleting record:", error);
      setError("Error deleting record.");
    } else {
      setProcessData((prev) => prev.filter((item) => item.id !== processId));
      setSuccessMessage("Record deleted successfully!");
    }

    setShowDeletePopup(false);
    setSelectedProcess(null);
  };

  return (
    <Layout title="Search">
      <div className="flex w-full px-6">
        {/* Sidebar Filters */}
        <div className="bg-[#2C3A35] text-white p-4 w-96 h-[650px] rounded-md shadow-md">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>

          <label className="block mb-2">Year</label>
          <select
            className="w-full p-2 rounded bg-white text-black"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Select</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <label className="block mt-4 mb-2">Product</label>
          <select
            className="w-full p-2 rounded bg-white text-black"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Select</option>
            {productOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>

          <label className="block mt-4 mb-2">Lot</label>
          <select
            className="w-full p-2 rounded bg-white text-black"
            value={selectedLot}
            onChange={(e) => setSelectedLot(e.target.value)}
          >
            <option value="">Select</option>
            {processData
              .flatMap((item) =>
                Array.isArray(item.lot_number)
                  ? item.lot_number
                  : [item.lot_number]
              )
              .filter(Boolean)
              .map((lot, idx) => (
                <option key={idx} value={lot}>
                  {lot}
                </option>
              ))}
          </select>
        </div>

        {/* Search Results */}
        <div className="flex-1 px-6">
          <div className="relative w-full max-w-lg mx-auto mt-6">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              className="placeholder-gray-400 w-full p-3 pl-10 rounded-lg border shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg shadow-md h-[550px] overflow-y-auto">
            {filteredResults.length > 0 ? (
              filteredResults.map((process, index) => (
                <div key={index} className="mb-6 relative">
                  {/* Clickable red box */}
                  <div
                    className="bg-[#5A2E2E] text-white p-4 rounded-md shadow-lg flex justify-between items-center cursor-pointer"
                    onClick={() =>
                      router.push({
                        pathname: "/searchHistory",
                        query: { processId: process.id },
                      })
                    }
                  >
                    <div className="flex flex-col w-1/4">
                      <p className="font-bold text-lg">
                        Process ID: {process.id || "—"}
                      </p>
                      <p>
                        Product:{" "}
                        {Array.isArray(process.product)
                          ? process.product.join(", ")
                          : process.product}
                      </p>
                      <p>
                        Lot #:{" "}
                        {Array.isArray(process.lot_number)
                          ? process.lot_number.join(", ")
                          : process.lot_number}
                      </p>
                    </div>

                    <div className="flex flex-col w-1/4 ml-4">
                      <p>Weight: {process.weight}</p>
                      <p>Location: {process.location}</p>
                      <p>Moisture: {process.moisture}%</p>
                    </div>

                    <div className="w-3/8">
                      <p>
                        <span className="font-semibold">Date Stored:</span>{" "}
                        {process.date_stored
                          ? new Date(process.date_stored).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>

                    <div className="w-1/8 flex justify-end relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(index);
                        }}
                        className="p-2 mt-2 hover:bg-[#704040] rounded-full transition"
                      >
                        ⋮
                      </button>

                      {openMenus.includes(index) && (
                        <div className="absolute right-0 top-full mt-1 bg-white text-black rounded shadow-md z-50 w-40"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push({
                                pathname: "/searchModify",
                                query: {
                                  processId: process.id,
                                  lot: Array.isArray(process.lot_number)
                                    ? process.lot_number[0]
                                    : process.lot_number,
                                  product: Array.isArray(process.product)
                                    ? process.product.join(", ")
                                    : process.product,
                                  weight: process.weight,
                                  dateTime: process.date_stored
                                    ? new Date(process.date_stored)
                                        .toISOString()
                                        .slice(0, 16)
                                    : "",
                                },
                              })
                            }}
                          >
                            Modify
                          </button>

                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push("/transfer");
                            }}
                          >
                            Transfer
                          </button>

                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push({
                                pathname: "/sale",
                                query: {
                                  lot: Array.isArray(process.lot_number)
                                    ? process.lot_number[0]
                                    : process.lot_number,
                                  processId: process.id || "",
                                  weight: process.weight || "",
                                  location: Array.isArray(process.location)
                                    ? process.location[0]
                                    : process.location || "",
                                  dateTime: process.date_stored
                                    ? new Date(process.date_stored)
                                        .toISOString()
                                        .slice(0, 16)
                                    : "",
                                },
                              })
                            }}
                          >
                            Sale
                          </button>

                          <button
                            className="block w-full text-left px-4 py-2 hover:bg-gray-200 text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteProcess(process)}
                            }
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No results found</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeletePopup && selectedProcess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] text-center">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete process{" "}
              <strong>#{selectedProcess.id}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-[#5D1214] hover:bg-red-950 text-white px-4 py-2 rounded"
                onClick={() => handleDeleteProcess(selectedProcess.id)}
              >
                Delete
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-200 text-[#3D5147] p-4 rounded-md shadow-md text-center">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 mb-4 bg-red-200 text-[#5D1214] font-[amiri] p-4 rounded-lg shadow-md text-center">
          {error}
        </div>
      )}
    </Layout>
  );
}

export default Search;
