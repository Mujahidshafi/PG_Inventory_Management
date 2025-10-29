import React, { useEffect, useState } from "react";
import Layout from "../components/layout";
import Link from "next/link";

import CleanStorageCard from "../components/CleanStorageCard";
import { supabase } from "../lib/supabaseClient";

function CleanStorage() {
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
  .from("clean_storage")
  .select(`
    id,
    crop_type,
    weight_kg,
    quality,
    received_at,
    notes,
    storage_location_list:location_id (
      storage_location_name
    )
  `)
  .order("received_at", { ascending: false });

console.log("clean_storage rows:", data?.length, data?.[0]); // keep for now

if (error) {
  setGroups({});
  setLoading(false);
  return;
}

const byLoc = {};
for (const row of data || []) {
  const loc = row?.storage_location_list?.storage_location_name || "Unknown";
  if (!byLoc[loc]) byLoc[loc] = [];
  byLoc[loc].push(row); // <-- push the row as-is (id, crop_type, weight_kg, quality, received_at, notes)
}
setGroups(byLoc);
setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("clean-storage-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clean_storage" },
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

return (
  <Layout title="Clean Storage" showBack={true}>
    {/* Add button here */}
    <div className="w-full max-w-[1140px] mx-auto flex justify-end p-4">
  <Link
    href="/cleanStorageModify"
    className="bg-[#5D1214] text-white px-4 py-2 rounded-[12px] font-semibold hover:bg-[#3D5147]"
  >
    + Add Clean Product
  </Link>
</div>

    {/* Your existing list */}
    <div className="w-[100%] h-[100%] flex flex-col items-center gap-4 overflow-auto p-4">
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : Object.keys(groups).length === 0 ? (
        <div className="text-gray-600">No records found.</div>
      ) : (
        Object.keys(groups).map((loc) => (
          <CleanStorageCard key={loc} location={loc} rows={groups[loc]} />
        ))
      )}
    </div>
  </Layout>
);
}

export default CleanStorage;
