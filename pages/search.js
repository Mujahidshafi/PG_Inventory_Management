import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";
import Layout from "../components/layout";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/router";

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
  const [sortOrder, setSortOrder] = useState("newest");

  // Fetch data for main table
  useEffect(() => {
    async function fetchAllData() {
      setLoading(true);

      const [fieldRun, screening, trash, clean] = await Promise.all([
        supabase.from("field_run_storage_test").select("*"),
        supabase.from("screening_storage_shed").select("*"),
        supabase.from("trash").select("*"),
        supabase.from("clean_product_storage").select("*"),
      ]);

      if (fieldRun.error || screening.error || trash.error || clean.error) {
        console.error(
          "Error fetching data:",
          fieldRun.error || screening.error || trash.error || clean.error
        );
        setLoading(false);
        return;
      }

      // Normalize field run
      const normalize = (data, source) =>
        data.map((item) => {
          const toArray = (val) =>
            Array.isArray(val)
              ? val
              : typeof val === "string"
              ? val.split(",").map((v) => v.trim()).filter(Boolean)
              : val
              ? [val]
              : [];

          return {
            source,
            lot_number: toArray(item.lot_number ?? item.Lot_Number),
            product: toArray(item.product ?? item.Product),
            location: item.location ?? item.Location ?? "—",
            date_stored: item.date_stored ?? item.Date_Stored ?? null,
            weight: item.weight ?? item.Weight ?? item.Amount ?? null,
            moisture: item.moisture ?? item.Moisture ?? null,
            type: item.type ?? item.Type ?? null,
            box: item.Box_ID ?? null,
          };
        });

      const mergedData = [
        ...normalize(fieldRun.data, "Field Run Storage"),
        ...normalize(screening.data, "Screening Storage"),
        ...normalize(trash.data, "Trash"),
        ...normalize(clean.data, "Clean Storage"),
      ];

      // Sort newest first
      mergedData.sort(
        (a, b) => new Date(b.date_stored) - new Date(a.date_stored)
      );

      setProcessData(mergedData);

      // Unique years for filter
      const years = [
        ...new Set(
          mergedData.map((item) =>
            item.date_stored ? new Date(item.date_stored).getFullYear() : null
          )
        ),
      ]
        .filter(Boolean)
        .sort((a, b) => b - a);

      setYearOptions(years);
      setLoading(false);
    }

    fetchAllData();
  }, []);

  // Fetch crop types
  useEffect(() => {
    async function fetchCropTypes() {
      const { data, error } = await supabase.from("crop_types").select("crop_code");

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

  const sortedResults = [...filteredResults].sort((a, b) => {
    const dateA = new Date(a.date_stored);
    const dateB = new Date(b.date_stored);

    if (sortOrder === "oldest") {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });

  const sourceColors = {
    "Field Run Storage": "bg-[#5A2E2E]",
    "Screening Storage": "bg-[#8B6E4E]",
    "Trash": "bg-gray-600",
    "Clean Storage": "bg-[#2C3A35]",
  };

  return (
    <Layout title="Search" showBack={true}>
      <div className="flex w-full px-6">
        {/* Sidebar Filters */}
        <div className="h-[650px] w-96 rounded-md bg-[#2C3A35] p-4 text-white shadow-md">
          <h2 className="mb-4 text-lg font-semibold">Filters</h2>

          <label htmlFor="year" className="block mb-2">Year</label>
          <select
            id="year"
            className="w-full rounded bg-white p-2 text-black"
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

          <label className="mt-4 mb-2 block">Product</label>
          <select
            className="w-full rounded bg-white p-2 text-black"
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
        </div>

        {/* Search Results */}
        <div className="flex-1 px-6">
          <div className="flex justify-between items-center mt-6">
            {/* Search Bar */}
            <div className="relative w-full max-w-lg">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-500" />
              <input
                type="text"
                placeholder="Search"
                className="w-full rounded-lg border p-3 pl-10 shadow-sm placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Sort Dropdown */}
            <div>
              <label htmlFor="sort" className="mr-2 text-gray-700 font-medium">Sort by:</label>
              <select
                id="sort"
                className="rounded border p-2 text-black"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Most Recent</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          <div className="mt-6 h-[550px] overflow-y-auto rounded-lg bg-white p-4 shadow-md">
            {sortedResults.length > 0 ? (
              sortedResults.map((process, index) => (
                <div key={index} className="relative mb-6">
                  <div
                    className={`${
                      sourceColors[process.source] || "bg-gray-700"
                    } flex items-center justify-between rounded-md p-4 text-white shadow-lg`}
                  >
                    {/* Column 1 */}
                    <div className="flex w-1/4 flex-col">
                      <p className="text-lg font-bold">{process.source}</p>
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
                      {process.box !== null && process.box !== undefined && (
                        <p>Box ID: {process.box}</p>
                      )}
                    </div>

                    {/* Column 2 */}
                    <div className="ml-4 flex w-1/4 flex-col">
                      <p>Weight: {process.weight}</p>
                      <p>Location: {process.location}</p>
                      <p>Moisture: {process.moisture ?? 0}%</p>
                      {process.type !== null &&
                        process.type !== undefined &&
                        process.type !== "" && (
                          <p>Type: {process.type}</p>
                        )}
                    </div>

                    {/* Column 3 */}
                    <div className="w-3/8">
                      <p>
                        <span className="font-semibold">Date Stored:</span>{" "}
                        {process.date_stored
                          ? new Date(process.date_stored).toLocaleDateString()
                          : "—"}
                      </p>
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
    </Layout>
  );
}

export default Search;
