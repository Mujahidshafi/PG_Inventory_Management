import React from "react";
import { useState, useEffect } from "react";
import Layout from "../components/layout"; 
import { set } from "date-fns";

function ScreeningStorage() {
  const[data, setData] = useState([]);
  useEffect(() => {
  (async () => {
    try {
      const res = await fetch("/api/screeningStorageBackend");
      const json = await res.json();
      if (Array.isArray(json)) {
        const list = json.map((r) => ({
          location: r.Location,
          lotNumber: r.Lot_Number,
          processId: r.Process_ID,
          product: r.Product,
          amount: r.Amount,
          dateStored: new Date(r.Date_Stored).toLocaleDateString(),
        }));
        setData(list);
      } else {
        console.error("Did not Recieve", json);
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching", err);
      setData([]);
    }
  })();
}, []);
    return (
      <Layout title="Screening Storage">
        <div class = "w-[100%] h-[100%] flex flex-col items-center gap-4 overflow-y-scroll text-black">
          {data.map((item, index) => (
            <div 
            key={index}
            class = "bg-gray-100 w-[90%] h-[10%] rounded-[30px] shadow-lg items-start items-center justify-around flex gap-2 p-4"
            >
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Location</span>
                <div class = "text-sm items-center justify-center">
                  {item.location}
                </div>
              </div>
                
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Lot Number</span>
                <div class = "text-sm items-center justify-center">
                  {item.lotNumber}
                </div>
              </div>
               
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Process ID</span>
                <div class = "text-sm items-center justify-center">
                  {item.processId}
                </div>
              </div>
          
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Product</span>  
                <div class = "text-sm items-center justify-center">
                  {item.product}
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Amount</span>
                <div class = "text-sm items-center justify-center">
                  {item.amount}
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Date Stored</span>
                <div class = "text-sm items-center justify-center">
                  {item.dateStored}
                </div>
              </div>
            
              <button>
                <img
                  src="/more_horiz.png"
                  alt="more_horiz"
                  className="w-[30px] h-[30px] object-contain opacity-100 hover:opacity-50 transition"
                />
              </button>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

export default ScreeningStorage;