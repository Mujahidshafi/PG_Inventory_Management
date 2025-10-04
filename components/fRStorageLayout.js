import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { format, parseISO } from "date-fns";

const FRStorageLayout = ({ location, lotNumber, product, weight, moisture, dateStored }) => {

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
  }, []);

  // Format lot numbers: add space between each entry
  const formatLotNumber = (lot) => {
    if (!lot || lot.length === 0) return "-";
    if (Array.isArray(lot)) return lot.join(" ");
    return lot.match(/.{1,4}/g)?.join(" ") || lot;
  };

  // Format product codes: add space between each entry
  const formatProduct = (prod) => {
    if (!prod || prod.length === 0) return "-";
    if (Array.isArray(prod)) return prod.join(" ");
    return prod.match(/.{1,2}/g)?.join(" ") || prod;
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return format(parseISO(dateStr), "MM/dd/yyyy h:mm a");
  };

  // Format weight with commas
  const formatWeight = (num) => {
    if (num === null || num === undefined) return "-";
    return num.toLocaleString(); // e.g., 50000 → "50,000"
  };

  return (
    <div className="bg-gray-100 w-[90%] h-[20%] rounded-[30px] shadow-lg flex items-center justify-around gap-2 p-4 text-black">

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm">Location</span>
        <div className="text-sm">{location}</div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm">Lot Number</span>
        <div className="text-sm">{formatLotNumber(lotNumber)}</div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm">Product</span>
        <div className="text-sm">{formatProduct(product)}</div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm">Weight</span>
        <div className="text-sm">{formatWeight(weight) + " lbs"}</div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm">Moisture</span>
        <div className="text-sm">{moisture + "%"}</div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm">Date Stored</span>
        <div className="text-sm">{formatDate(dateStored)}</div>
      </div>
      
      <div className="relative" ref = {menuRef}>
        <button onClick={() => setMenuOpen(!menuOpen)}>
          <img
            src="/more_horiz.png"
            alt="more_horiz"
            className="w-[30px] h-[30px] object-contain opacity-100 hover:opacity-50 transition"
          />
        </button>
        
        {/*open the dropdown menu and path to fieldRunModify*/}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <button
              onClick={() => {
                router.push({
                  pathname: "/fieldRunModify",
                  query: { 
                    location, //primary key of table
                    lotNumber: JSON.stringify(lotNumber),
                    product: JSON.stringify(product),
                    weight,
                    moisture,
                    dateStored,
                  },
                });
                setMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Modify
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default FRStorageLayout;