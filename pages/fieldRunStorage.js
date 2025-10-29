import Layout from "../components/layout";
import React, { useEffect, useState } from "react";
import FRStorageLayout from "../components/fRStorageLayout";

function FieldRunStorage() {
  
  const [storageItems, setStorageItems] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/fRStorageBackend");
      const items = await res.json();
      setStorageItems(items);
    }
    fetchData();
  }, []);

  return (
    <Layout title="Field Run Storage" showBack={true} backRoute="/storageDashboard">
      <div className="w-[100%] h-[100%] flex flex-col items-center gap-4 overflow-y-scroll">
        {storageItems.map((item, index) => (
          <FRStorageLayout
            key={index}
            location={item.location}
            lotNumber={item.lot_number}
            product={item.product}
            weight={item.weight}
            moisture={item.moisture}
            dateStored={item.date_stored}
          />
        ))}
        
      </div>
    </Layout>
  );
}

export default FieldRunStorage;