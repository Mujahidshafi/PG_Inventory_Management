import React from "react";
import { useState, useEffect } from "react";
import Layout from "../components/layout"; 
import { set } from "date-fns";
import { useRouter } from "next/router";

function ScreeningStorage() {
  const router = useRouter();
  const[data, setData] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [notesOpenFor, setNotesOpenFor] = useState(null);
  const [notesText, setNotesText] = useState("");
  useEffect(() => {
  (async () => {
    try {
      const res = await fetch("/api/screeningStorageBackend");
      const json = await res.json();
      if (Array.isArray(json)) {
        const list = json.map((r) => ({
          location: r.Location,
          lotNumber: r.Lot_Number,
          processId: r.Process_ID,
          product: r.Product,
          amount: r.Amount,
          dateStored: new Date(r.Date_Stored).toLocaleDateString(),
          notes: r.Notes,
        }));
        setData(list);
      } else {
        console.error("Did not Recieve", json);
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching", err);
      setData([]);
    }
  })();
}, []);
const handleDelete = async (processId) => {
  const confirm = window.confirm("Are you sure you want to delete this item?");
  if (!confirm) return;
  try {
    const res = await fetch(`/api/screeningStorageBackend?id=${encodeURIComponent(processId)}`, 
      { method: "DELETE"}
    );
    if (!res.ok) throw new Error("Delete failed");
    setData((prev) => prev.filter((x) => x.processId !== processId)); 
  } catch (err) {
    console.error("Error deleting item:", err);
  }
};
const handleSaveNotes = async () => {
  if (!notesOpenFor) {
    alert("Missing id");
    return;
  }
  try {
    const res = await fetch(`/api/screeningStorageBackend?id=${encodeURIComponent(notesOpenFor)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Notes: notesText }),
      }
    );
    if (!res.ok) throw new Error(await res.text());
    setData(prev =>
      prev.map(x => x.processId === notesOpenFor ? { ...x, notes: notesText } : x)
    );
    setNotesOpenFor(null);
    setNotesText("");
  } catch (err) {
    console.error("Save notes failed:", err);
    alert(`Failed to save notes: ${err.message}`);
  }
};
useEffect(() => {
  if (openId === null) return;
  const handleOutside = () => setOpenId(null);
  document.addEventListener("click", handleOutside);
  return () => document.removeEventListener("click", handleOutside);
}, [openId]);
    return (
      <Layout title="Screening Storage">
        <div class = "w-[100%] h-[100%] flex flex-col items-center gap-4 overflow-y-scroll text-black">
          {data.map((item, index) => (
            <div 
            key={index}
            class = "bg-gray-100 w-[90%] h-[10%] rounded-[30px] shadow-lg items-start items-center justify-around flex gap-2 p-4"
            >
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Location</span>
                <div class = "text-sm items-center justify-center">
                  {item.location}
                </div>
              </div>
                
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Lot Number</span>
                <div class = "text-sm items-center justify-center">
                  {item.lotNumber}
                </div>
              </div>
               
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Process ID</span>
                <div class = "text-sm items-center justify-center">
                  {item.processId}
                </div>
              </div>
          
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Product</span>  
                <div class = "text-sm items-center justify-center">
                  {item.product}
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Amount</span>
                <div class = "text-sm items-center justify-center">
                  {item.amount}
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Date Stored</span>
                <div class = "text-sm items-center justify-center">
                  {item.dateStored}
                </div>
              </div>
            
              <div className="relative inline-block">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenId((id) => (id === index ? null : index));
                  }}
                  className="p-1 rounded hover:bg-black/5"
                >
                  <img
                    src="/more_horiz.png"
                    alt="more"
                    className="w-[30px] h-[30px] object-contain"
                  />
                </button>

                {openId === index && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 bg-white border rounded shadow-md z-50"
                  >
                    <button
                      className="block w-full px-4 py-2 text-left text-green-600 hover:bg-gray-100"
                      onClick={() => {
                        setOpenId(null);
                        router.push(`/screeningStorageModify?id=${encodeURIComponent(item.processId)}`);
                      }}
                    >
                      Modify
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                      onClick={() => {
                        setOpenId(null);
                        handleDelete(item.processId);
                      }}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left text-indigo-600 hover:bg-gray-100"
                      onClick={() => {
                        setOpenId(null);
                        setNotesOpenFor(item.processId);
                        setNotesText(item.notes ?? "");
                      }}
                    >
                      Add Notes
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {notesOpenFor && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setNotesOpenFor(null)}
          >
            <div
              className="w-[520px] max-w-[90vw] rounded-xl bg-white p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">Add Notes</h3>
              <textarea
                className="w-full h-[160px] border rounded-md p-2 resize-none"
                placeholder="Enter notes…"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border"
                  onClick={() => setNotesOpenFor(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md bg-[#5D1214] text-white hover:bg-[#2C3A35]"
                  onClick={handleSaveNotes}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

export default ScreeningStorage;