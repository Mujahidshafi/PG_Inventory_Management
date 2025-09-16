import React from "react";
//import "../App.css";

import Layout from "../components/layout"; 
import { useEffect, useState } from 'react';
import FRStorageLayout from "../components/fRStorageLayout";
import { getStorageData } from "./api/fRStorageBackend"
import { supabase } from "../lib/supabaseClient";


function fieldRunStorage() {
  const [storageItems, setStorageItems] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const items = await getStorageData();
      setStorageItems(items);
    }
    fetchData();
  }, []);

  return (
    <Layout location="Field Run Storage">
      <div class = "w-[100%] h-[100%] flex flex-col items-center gap-4 overflow-y-scroll">
      {storageItems.map((item, index) => (
        <FRStorageLayout
          key={index}
          location={item.location}
          lotNumber={item.lot_number}
          product={item.product}
          weight={item.weight}
          dateStored={item.date_stored}
        />
      ))}
      </div>
    
    </Layout>
  );

}


export default fieldRunStorage;