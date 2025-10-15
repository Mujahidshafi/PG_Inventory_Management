import React, { useState, useEffect } from "react";
import Layout from "../components/layout";
import { FaCheckSquare } from "react-icons/fa";
import { useRouter } from "next/router";

function Sale() {
  const router = useRouter();
  const { lot, processId: queryProcessId, weight, location, dateTime } = router.query;

  const [fieldLot, setFieldLot] = useState("");
  const [processId, setProcessId] = useState("");
  const [weightValue, setWeight] = useState("");
  const [locationValue, setLocation] = useState("");
  const [quality, setQuality] = useState("");
  const [dateTimeValue, setDateTime] = useState("");
  const [isSold, setIsSold] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Prefill fields when query params are available
  useEffect(() => {
    if (lot) setFieldLot(lot);
    if (queryProcessId) setProcessId(queryProcessId);
    if (weight) setWeight(weight);
    if (location) setLocation(location);
    if (dateTime) setDateTime(dateTime);
  }, [lot, queryProcessId, weight, location, dateTime]);

  const handleSell = () => setIsSold(true);

  return (
    <Layout
      title="Sale"
      onSettingsClick={() => setShowSettings(!showSettings)}
    >
      {/* Sold Status */}
      {isSold && (
        <div className="absolute top-6 right-36 bg-[#5A2E2E] text-white px-4 py-1 rounded-md shadow flex items-center gap-2">
          <FaCheckSquare />
          <span className="text-sm font-semibold">Sold</span>
        </div>
      )}

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="absolute top-20 right-12 w-48 bg-white rounded-lg shadow-lg p-4 z-50">
          <p className="text-sm text-gray-600 mb-2">Account: Admin</p>
          <button className="w-full bg-[#3D5147] hover:bg-[#2c3a35] text-white py-1 px-2 rounded-md">
            Log Out ↪
          </button>
        </div>
      )}

      {/* Form Area */}
      <div className="w-full max-w-6xl grid grid-cols-3 gap-6">
        {/* Field Lot Number */}
        <div className="flex flex-col items-center">
          <label className="mb-2 font-medium">Field Lot Number</label>
          <input
            className="w-full px-4 py-2 rounded border"
            value={fieldLot}
            onChange={(e) => setFieldLot(e.target.value)}
            placeholder="Input"
          />
        </div>

        {/* Process ID */}
        <div className="flex flex-col items-center">
          <label className="mb-2 font-medium">Process ID</label>
          <input
            className="w-full px-4 py-2 rounded border"
            placeholder="Input"
            value={processId}
            onChange={(e) => setProcessId(e.target.value)}
          />
        </div>

        {/* Weight */}
        <div className="flex flex-col items-center">
          <label className="mb-2 font-medium">Weight</label>
          <input
            className="w-full px-4 py-2 rounded border"
            placeholder="Input"
            value={weightValue}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="flex flex-col items-center">
          <label className="mb-2 font-medium">Location</label>
          <input
            className="w-full px-4 py-2 rounded border"
            placeholder="Input"
            value={locationValue}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Quality */}
        <div className="flex flex-col items-center">
          <label className="mb-2 font-medium">Quality</label>
          <select
            className="w-full px-4 py-2 rounded border"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
          >
            <option value="">Select</option>
            {[...Array(7)].map((_, i) => (
              <option key={i} value={`Item${i + 1}`}>{`Item${i + 1}`}</option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="flex flex-col items-center">
          <label className="mb-2 font-medium">Date & Time</label>
          <input
            className="w-full px-4 py-2 rounded border"
            value={dateTimeValue}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </div>
      </div>

      {/* Sell Button */}
      <div className="mt-8 text-center w-full">
        <button
          onClick={handleSell}
          className="bg-[#5A2E2E] hover:bg-[#432121] text-white font-semibold px-8 py-2 rounded-full"
        >
          Sell
        </button>
      </div>
    </Layout>
  );
}

export default Sale;
