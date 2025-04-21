import React from "react";
function InProcessCard({data}){
    return (
        <div className="bg-white border border-black rounded-md p-4 w-full max-w-5xl mx-auto">
            <div className="grid grid-cols-6 text-sm font-semibold text-center text-black pb-2">
                <div>Job Type</div>
                <div>Lot Number</div>
                <div>Process ID</div>
                <div>Product Description</div>
                <div>Location</div>
                <div>Amount</div>
            </div>
            <div className="grid grid-cols-6 text-sm text-center text-black pt-2">
                <div>{data.jobType}</div>
                <div>{data.lot}</div>
                <div>{data.processId}</div>
                <div>{data.product}</div>
                <div>{data.location}</div>
                <div>{data.amount}</div>
            </div>
        </div>
    );
}

export default InProcessCard;