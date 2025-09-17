import React, { useEffect, useState } from "react";
import Layout from "../components/layout";
import CleanStorageCard from "../components/CleanStorageCard";
import { supabase } from "../lib/supabaseClient";

function CleanStorage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("clean-storage-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clean_storage" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    const { data, error } = await supabase
      .from("clean_storage")
      .select(
        `
        id,
        crop_type,
        weight_kg,
        quality,
        notes,
        received_at,
        location,  
        storage_location_list(storage_location_name)
      `
      );

    if (error) {
      console.error("Error fetching clean_storage:", error);
      return;
    }

    // Group by location
    const grouped = data.reduce((acc, row) => {
      const location =
        row.storage_location_list?.storage_location_name || row.location || "Unknown";

      if (!acc[location]) acc[location] = [];
      acc[location].push({
        lot: row.id, // or another field if you have lot numbers
        processId: row.id,
        product: row.crop_type,
        amount: row.weight_kg,
        date: row.received_at,
        quality: row.quality,
        notes: row.notes,
      });
      return acc;
    }, {});

    const formatted = Object.keys(grouped).map((location) => ({
      location,
      rows: grouped[location],
    }));

    setData(formatted);
  }

  return (
    <Layout title="Clean Storage">
      <div className="w-[100%] h-[100%] flex flex-col items-center gap-4 overflow-y-scroll">
        <div className="min-h-screen flex flex-col items-center py-8 border-black">
          {data.map((locationData, idx) => (
            <CleanStorageCard key={idx} {...locationData} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default CleanStorage;
