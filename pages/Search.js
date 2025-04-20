import React, { useState } from "react";
import Layout from "../components/layout";
import { FaSearch } from "react-icons/fa"; // Import search icon

function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const processData = [
    { id: 2374, product: "TRIT-V", lot: "24D3", weight: "2,482 lbs", location: "Refer Trailer" },
    { id: 2536, product: "WC", lot: "24H3", weight: "2,400 lbs", location: "Inside CO2" },
    { id: 2273, product: "SWW", lot: "24F3", weight: "2,482 lbs", location: "Refrigerator" },
  ];

  const filteredResults = processData.filter((item) =>
    item.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Pleasant Grove Farms">
      <div className="flex w-full px-6">
        {/* Sidebar Filters */}
        <div className="bg-[#2C3A35] text-white p-4 w-1/4 rounded-md shadow-md">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>

          {/* Year Dropdown */}
          <label className="block mb-2">Year</label>
          <select
            className="w-full p-2 rounded bg-white text-black"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Select</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
          </select>

          {/* Product Dropdown */}
          <label className="block mt-4 mb-2">Product</label>
          <select
            className="w-full p-2 rounded bg-white text-black"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Select</option>
            <option value="TRIT-V">TRIT-V</option>
            <option value="WC">WC</option>
            <option value="SWW">SWW</option>
          </select>
        </div>

        {/* Search & Results Section */}
        <div className="flex-1 px-6">
          {/* Search Bar */}
          <div className="relative w-full max-w-lg mx-auto mt-4">
            <FaSearch className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              className="placeholder-gray-400 w-full p-3 pl-10 rounded-lg border shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Results Display */}
          <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
            {filteredResults.length > 0 ? (
              filteredResults.map((process) => (
                <div
                  key={process.id}
                  className="bg-[#5A2E2E] text-white p-4 rounded-md mb-4 shadow-lg flex justify-between"
                >
                  <div>
                    <p className="font-bold text-lg">Process ID: {process.id}</p>
                    <p>Product: {process.product}</p>
                    <p>Lot #: {process.lot}</p>
                    <p>Weight: {process.weight}</p>
                    <p>Location: {process.location}</p>
                  </div>
                  <button className="text-white text-xl">⋮</button>
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
 
