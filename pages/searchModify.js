import React, { useState } from 'react';
//import "../App.css";
import Layout from "../components/layout"; 

function SearchModify() {

    const [fieldLot, setFieldLot] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [weight, setWeight] = useState('');
    const [dateTime, setDateTime] = useState('');
  
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log({
        fieldLot,
        productDescription,
        weight,
        dateTime,
      });
      alert("Location update form submitted! Backend connection coming soon.)");
    };
    
  return (
    <Layout title="Search Modify">
      <form onSubmit={handleSubmit} className="flex grid grid-cols-5 gap-6 content-center">
            
            <input
              className="border p-2 rounded border-black placeholder-gray-400 text-black"
              placeholder="Field Lot Number"
              value={fieldLot}
              onChange={(e) => setFieldLot(e.target.value)}
              required
            />

            <select
              className="border p-2 rounded border-black text-black"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              required
            >
              <option value="">Select Product</option>
              <option value="YPCBL">YPCBL</option>
              <option value="YPCM">YPCM</option>
              <option value="MCPC">MCPC</option>
              <option value="WPC">WPC</option>
              <option value="FC">MCPC</option>
              <option value="WC">WC</option>
              <option value="YC">YC</option>
              <option value="BC-K">BC-K</option>
              <option value="Custom">Other (custom product)</option>
            </select>

            <input
              className="border p-2 rounded border-black placeholder-gray-400 text-black"
              placeholder="Weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />

            <input
              className="border p-2 rounded border-black text-black"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />

            <div className="flex justify-self-center">
              <button
                type="submit"
                className="flex bg-red-800 text-white rounded-xl py-2 px-6 hover:bg-[#3D5147] items-center justify-center shadow-md"
              >
                Save
              </button>
            </div>
          </form>
    </Layout>
  );
}

export default SearchModify;