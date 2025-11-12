import React, { useState } from "react";
//import "../App.css";
import Layout from "../components/layout"; 

function UpdateLocation() {
  const [fieldLot, setFieldLot] = useState('');
  const [processId, setProcessId] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [location, setLocation] = useState('');
  const [quality, setQuality] = useState('');
  const [dateTime, setDateTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      fieldLot,
      processId,
      productDescription,
      weight,
      location,
      quality,
      dateTime,
    });
    alert("Location update form submitted! Backend connection coming soon.)");
  };

  return (
    <Layout title="Update Location" showBack={true}>
      {/*<div className="min-h-screen bg-gray-100 py-10 px-4">*/}
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow">
          <h1 className="text-black text-3xl font-bold mb-6 text-center">Update Location</h1>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <input
              className="border p-2 rounded border-gray-400 placeholder-gray-400"
              placeholder="Field Lot Number"
              value={fieldLot}
              onChange={(e) => setFieldLot(e.target.value)}
              required
            />

            <input
              className="border p-2 rounded border-gray-400 placeholder-gray-400"
              placeholder="Process ID"
              value={processId}
              onChange={(e) => setProcessId(e.target.value)}
              required
            />

            <input
              className="border p-2 rounded border-gray-400 placeholder-gray-400"
              placeholder="Product Description"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              required
            />

            <input
              className="border p-2 rounded border-gray-400 placeholder-gray-400"
              placeholder="Weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />

            <select
              className="border p-2 rounded border-gray-400 text-black"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            >
              <option value="">Select Location</option>
              <option value="HQ 1-18">Silo - HQ 1-18</option>
              <option value="BENS 5-12">Silo - BENS 5-12</option>
              <option value="Mill">Mill</option>
              <option value="Custom">Other (custom location)</option>
            </select>

            <select
              className="border p-2 rounded border-gray-400 text-black"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              required
            >
              <option value="">Select Quality</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
            </select>

            <input
              className="border p-2 rounded border-gray-400 text-black"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />

            <button
              type="submit"
              className="bg-[#5D1214] text-white rounded py-2 px-4 w-full md:col-span-2 mt-4 hover:bg-[#3D5147]"
            >
              Save
            </button>
          </form>
        </div>
      {/*</div>*/}
    </Layout>
  );
}

export default UpdateLocation;