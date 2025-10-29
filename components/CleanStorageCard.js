// components/CleanStorageCard.js
import React from "react";

export default function CleanStorageCard({ location, rows }) {
  return (
    <div className="bg-[#FFFDFD] border border-black rounded-xl p-4 mb-6 shadow-sm w-full max-w-5xl">
      <div className="text-lg font-semibold mb-2">{location}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4">Id</th>
              <th className="text-left py-2 pr-4">Crop Type</th>
              <th className="text-left py-2 pr-4">Weight Kg</th>
              <th className="text-left py-2 pr-4">Quality</th>
              <th className="text-left py-2 pr-4">Received At</th>
              <th className="text-left py-2 pr-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{r.id}</td>
                <td className="py-2 pr-4">{r.crop_type}</td>
                <td className="py-2 pr-4">{r.weight_kg}</td>
                <td className="py-2 pr-4">{r.quality}</td>
                <td className="py-2 pr-4">
                  {r.received_at ? new Date(r.received_at).toLocaleString() : ""}
                </td>
                <td className="py-2 pr-4">{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
