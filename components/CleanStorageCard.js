// components/CleanStorageCard.js
import React from "react";

export default function CleanStorageCard({ product, rows }) {
  return (
    <div className="bg-[#FFFDFD] border border-black rounded-xl p-4 mb-6 shadow-sm w-full max-w-5xl">
      <div className="text-lg font-semibold mb-2">{product}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4">Lot Number</th>
              <th className="text-left py-2 pr-4">Process ID</th>
              <th className="text-left py-2 pr-4">Product</th>
              <th className="text-left py-2 pr-4">Box ID</th>
              <th className="text-left py-2 pr-4">Amount</th>
              <th className="text-left py-2 pr-4">Date Recieved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{r.lotNumber}</td>
                <td className="py-2 pr-4">{r.processId}</td>
                <td className="py-2 pr-4">{r.product}</td>
                <td className="py-2 pr-4">{r.boxId}</td>
                <td className="py-2 pr-4">{r.amount}</td>
                <td className="py-2 pr-4">
                  {r.dateStored ? new Date(r.dateStored).toLocaleString() : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
