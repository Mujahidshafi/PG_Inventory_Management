import React from "react";
import Image from "next/image"

const fRStorageLayout = ({ location, lotNumber, product, weight, dateStored }) => {
  return ( 
      <div class = "bg-gray-100 w-[90%] h-[20%] rounded-[30px] shadow-lg items-start items-center justify-around flex gap-2 p-4 text-black">

        <div class = "flex flex-col items-center gap-2">
        <span class = "text-sm">Location</span>
        <div class = "text-sm items-center justify-center"> {location} </div>
        </div>
        
        <div class = "flex flex-col items-center gap-2">
        <span class = "text-sm">Lot Number</span>
        <div class = "text-sm items-center justify-center"> {lotNumber} </div>
        </div>
        
        {/*<div class = "flex flex-col items-center gap-2">
        <span class = "text-sm">Process ID</span>
        <div class = "text-sm items-center justify-center">  </div>
        </div>*/}

        <div class = "flex flex-col items-center gap-2">
        <span class = "text-sm">Product</span>  
        <div class = "text-sm items-center justify-center"> {product} </div>
        </div>

        <div class = "flex flex-col items-center gap-2">
        <span class = "text-sm">Weight</span>
        <div class = "text-sm items-center justify-center"> {weight} </div>
        </div>

        <div class = "flex flex-col items-center gap-2">
        <span class = "text-sm">Date Stored</span>
        <div class = "text-sm items-center justify-center"> {dateStored} </div>
        </div>

        {/*<div class = "flex flex-col items-center gap-2">
        <span class = "text-sm">Time Stored</span>
        <div class = "text-sm items-center justify-center"> - </div>
        </div>*/}

        <button>
                <img
                  src="/more_horiz.png"
                  alt="more_horiz"
                  className="w-[30px] h-[30px] object-contain opacity-100 hover:opacity-50 transition"
                />
              </button>
        </div>
  );
};

export default fRStorageLayout;