import React, { useState, useEffect } from "react";
import Layout from "../components/layout";
import { useRouter } from "next/router";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

function FieldRunModify() {
    const router = useRouter();
    const supabase = useSupabaseClient();
    const { location, lotNumber, product, weight, moisture, dateStored } = router.query;
    
    const [fieldLot, setFieldLot] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [formWeight, setFormWeight] = useState('');
    const [formMoisture, setFormMoisture] = useState('');
    const [dateTime, setDateTime] = useState('');

      // Convert Supabase ISO date to datetime-local format
    const toLocalInputFormat = (isoDate) => {
      if (!isoDate) return "";
      const date = new Date(isoDate);

      // Get local components
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    useEffect(() => {
      if (location) {
        // field lots as comma-separated string
        let lots = [];
          try {
            lots = Array.isArray(JSON.parse(lotNumber)) ? JSON.parse(lotNumber) : String(lotNumber || "").split(",");
          } catch {
            lots = String(lotNumber || "").split(",");
          }
        setFieldLot(lots.map((lot) => lot.trim()).filter((lot) => lot).join(","));

          // product descriptions as comma-separated string
        let products = [];
          try {
            products = Array.isArray(JSON.parse(product)) ? JSON.parse(product) : String(product || "").split(",");
          } catch {
            products = String(product || "").split(",");
          }
        setProductDescription(products.map((p) => p.trim().toUpperCase()).filter((p) => p).join(","));
        //weight and moisture are numbers
        setFormWeight(weight !== undefined && weight !== null ? Number(weight) : '');
        setFormMoisture(moisture !== undefined && moisture !== null ? Number(moisture) : '');
        setDateTime(toLocalInputFormat(dateStored));
      }
    }, [location, lotNumber, product, weight, moisture, dateStored]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    //supabase jsonb format field lot and product description
  const lotsArray = Array.isArray(fieldLot)
    ? fieldLot
    : fieldLot
    ? fieldLot.split(",").map(lot => lot.trim()).filter(lot => lot)
    : [];

  const productsArray = Array.isArray(productDescription)
    ? productDescription
    : productDescription
    ? productDescription.split(",").map(p => p.trim().toUpperCase()).filter(p => p)
    : [];
      //supabase format date, convert to null if zero'd out
    const isoDate = dateTime ? new Date(dateTime).toISOString() : null;

    const { error } = await supabase
      .from("field_run_storage_test")
      .update({
        lot_number: lotsArray,
        product: productsArray,
        weight: Number(formWeight) || 0,
        moisture: Number(formMoisture) || 0,
        date_stored: isoDate,
      })
      .eq("location", location); // since location is the primary key
    
      if (error) {
        console.error("Update error:", error.message);
        alert("Error updating record");
      } else {
        alert("Record updated successfully!");
        router.push("/fieldRunStorage"); //redirect
      }
    };
  return (
    <Layout title="Field Run Storage Modify" showBack={true} backRoute={"/fieldRunStorage"}>
      <div className="max-w-4xl mx-auto bg-white px-12 py-4 rounded-xl shadow">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div className = "flex flex-col">
              <label htmlFor="location" className="mb-1 text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                id="location"
                type="text"
                className="border p-2 rounded border-black placeholder-gray-400 text-black bg-gray-100"
                value={location}
                placeholder="Location"
                disabled
              />
            </div> 

            <div className = "flex flex-col">
              <label htmlFor="fieldLot" className="mb-1 text-sm font-medium text-gray-700">
                Field Lot
              </label>
            <input
              id="fieldLot"
              type="text"
              className="border p-2 rounded border-black placeholder-gray-400 text-black"
              placeholder="Field Lot Number"
              value={fieldLot}
              onChange={(e) => setFieldLot(e.target.value)}
              
            />
            </div>

            <div className = "flex flex-col">
              <label htmlFor="productDescription" className="mb-1 text-sm font-medium text-gray-700">
                Product Description
              </label>
            <input
              id="productDescription"
              type="text"
              className="border p-2 rounded border-black placeholder-gray-400 text-black"
              placeholder="Product Description"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              
            />
            </div>

            <div className = "flex flex-col">
              <label htmlFor="weight" className="mb-1 text-sm font-medium text-gray-700">
                Weight lbs
              </label>
            <input
              id="weight"
              type="text"
              className="border p-2 rounded border-black placeholder-gray-400 text-black"
              placeholder="Weight"
              value={formWeight}
              onChange={(e) => setFormWeight(e.target.value)}
              
            />
            </div>

            <div className = "flex flex-col">
              <label htmlFor="moisture" className="mb-1 text-sm font-medium text-gray-700">
                Moisture %
              </label>
              <input
                id="moisture"
                type="text"
                className="border p-2 rounded border-black placeholder-gray-400 text-black pr-6"
                placeholder="Moisture"
                value={formMoisture}
                onChange={(e) => setFormMoisture(e.target.value)}
                
              />
            </div>

            <div className = "flex flex-col">
              <label htmlFor="datetime" className="mb-1 text-sm font-medium text-gray-700">
                Date and Time
              </label>
            <input
              id="datetime"
              className="border p-2 rounded border-black text-black"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              
            />
            </div>

          <div className="flex justify-between items-center mt-4">
            <button
              type="submit"
              className="bg-red-800 text-white rounded-xl py-2 px-6 hover:bg-[#3D5147]"
            >
              Save
            </button>

            <button
              type="button"
              className="bg-gray-600 text-white rounded-xl py-2 px-6 hover:bg-[#4B5563]"
              onClick={() => {
                setFieldLot([]);
                setProductDescription([]);
                setFormWeight(0);
                setFormMoisture(0);

                const now = new Date();
                setDateTime(toLocalInputFormat(now));
              }}
            >
              Zero
            </button>
          </div>
          </form>
        </div>
    </Layout>
  );
}

export default FieldRunModify;