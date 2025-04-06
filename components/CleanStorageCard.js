import React from "react";
function CleanStorageCard({ location, rows }) {
    return (
        <div className="bg-[#FFFDFD] border border-black rounded-xl p-4 mb-6 shadow-sm w-full max-w-5xl">
            <div className="grid grid-cols-[120px_1fr] gap-4">
                <div className="flex flex-col items-start">
                    <div className="text-sm font-semibold mb-2 text-black">Location</div>
                    <div className="text-sm font-medium h-full flex items-center text-black">
                        {location}
                    </div>
                </div>
                <div className="w-full">
                    <div className="grid grid-cols-6 text-sm font-semibold border-b border-black pb-2 text-black">
                        <div className="pr-2">Lot Number</div>
                        <div className="pr-2">Process ID</div>
                        <div className="pr-2">Product</div>
                        <div className="pr-2">Amount (lbs)</div>
                        <div className="pr-2">Date Stored</div>
                        <div className="pr-2"></div>
                    </div>
                    {rows.map((item, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-6 py-4 border-b border-black text-sm items-center text-black"
                        >
                            <div>{item.lot}</div>
                            <div>{item.processId}</div>
                            <div>{item.product}</div>
                            <div>{item.amount}</div>
                            <div>{item.date}</div>
                            <div className="text-xl text-gray-500 text-black">•••</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
export default CleanStorageCard;