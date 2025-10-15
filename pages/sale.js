import React, { useState , useEffect} from "react";
import Layout from "../components/layout";
import { FaCheckSquare } from "react-icons/fa";
import { useRouter } from "next/router";


//fetch for dropdown menu
async function fetchList(apiRoute, setData) {
  try {
    const res = await fetch(apiRoute);
    const data = await res.json();
    setData(data);
  } catch (err) {
    console.error("Error fetching:", err);
  }
}

function Sale() {
  const router = useRouter();
  const { lot, processId: queryProcessId, weight, location, dateTime } = router.query;

  const [fieldLot, setFieldLot] = useState("");
  const [processId, setProcessId] = useState("");
  const [weightValue, setWeight] = useState("");
  const [locationValue, setLocation] = useState("");
  const [quality, setQuality] = useState("");
  const [customerId, setCustomer] = useState("");
  const [dateTime, setDateTime] = useState("2/25/25 | 3:55 pm");
  const [isSold, setIsSold] = useState(false);
  const [showSettings, setShowSettings] = useState(false);


  const [customers, setCustomers] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [fieldLotNums, setFieldLotNums] = useState([]);
  const [screeningShedLocals, setScreeningShedLocals] = useState([]);

  const handleSell = () => setIsSold(true);

  useEffect(() => {
    fetchList("/api/fetchCustomers", setCustomers);
    fetchList("/api/fetchProcesses", setProcesses);
    fetchList("/api/fetchFieldRuns", setFieldLotNums);
    fetchList("api/fetchScreeningShed", setScreeningShedLocals);
  }, []);

  return (
    <Layout
      title="Sale"
      onSettingsClick={() => setShowSettings(!showSettings)}
      showBack={true}
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

        {/* Customer Selection (DropDown) */}
        <div className="flex flex-col items-center">
          <label className="mb-2 font-medium">Customers</label>
          <select
            className="w-full px-4 py-2 rounded border"
            value={customerId}
            onChange={(e) => setCustomer(e.target.value)}
          >
            <option value="">Select</option>
            {customers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Field Lot Number (Dropdown) */}
        <div className="flex flex-col items-center">
          <label className="mb-2 font-medium">Field Lot Number</label>
          <input
            className="w-full px-4 py-2 rounded border"
            value={fieldLot}
            onChange={(e) => setFieldLot(e.target.value)}
          >
            <option value="">Select</option>
            {fieldLotNums.map((item) => (
              <option key={item.id} value={item.id}>
                {item.field_lot_number}
              </option>
            ))}
          </select>
        </div>

        {/* Process ID (Dropdown) */}
        <div className="flex flex-col items-center">
          <label className="mb-2 font-medium">Process ID</label>
          <select
            className="w-full px-4 py-2 rounded border"
            value={processId}
            onChange={(e) => setProcessId(e.target.value)}
          >
            <option value="">Select</option>
            {processes.map((item) => (
              <option key={item.id} value={item.process_id}>
                {item.process_id}
              </option>
            ))}
          </select>
          
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

        {/* Location - Screening Storage Shed (Dropdown) */}
        <div className="flex flex-col items-center">
          <label className="mb-2 font-medium">Location</label>
          <input
            className="w-full px-4 py-2 rounded border"
            placeholder="Input"
            value={locationValue}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Select</option>
            {screeningShedLocals.map((item) => (
              <option key={item.id} value={item.Location}>
                {item.Location}
              </option>
            ))}
          </select>
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
