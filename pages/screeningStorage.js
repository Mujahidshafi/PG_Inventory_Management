import {supabase} from "../lib/supabaseClient";
import React, { use } from "react";
import { useState, useEffect } from "react";
import Layout from "../components/layout"; 
import { set } from "date-fns";
import { useRouter } from "next/router";

function ScreeningStorage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [notesOpenFor, setNotesOpenFor] = useState(null);
  const [notesText, setNotesText] = useState("");
  const [lotQuery, setLotQuery] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [nSupplierFilter, setSupplierFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 30;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const visibleData = data.slice(startIndex, endIndex);
  const fetchRows = async () => {
    setLoading(true);
    try {
    const res = await fetch("/api/screeningStorageBackend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lot: lotQuery.trim() || undefined,
        product: productFilter.trim() || undefined,
        supplier: nSupplierFilter.trim() || undefined,
      }),
    });
    const json = await res.json();
      if (Array.isArray(json)) {
        const list = json.map((r) => ({
          id: r.ID,
          boxId: r.Box_ID,
          supplier: r.Supplier,
          lotNumber: r.Lot_Number,
          processId: r.Process_ID,
          product: r.Product,
          amount: r.Amount,
          dateStored: new Date(r.Date_Stored).toLocaleString(),
          type: r.Type,
          notes: r.Notes,
        }));
        setData(list);
        //const uniqueProducts = Array.from(new Set(json.map(r => r.Product))).filter(p => p);
        //setProducts(uniqueProducts);
      } else {
        console.error("Did not Recieve", json);
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = () => {
    fetchRows();
    setPage(1);
  }
  useEffect(() => {
    fetchRows();
  }, []);
  /*useEffect(() => {
    const t = setTimeout(fetchRows, 300);
    return () => clearTimeout(t);
  }, [lotQuery, productFilter, nSupplierFilter]);*/

  useEffect(() => {
    let alive = true;
    (async () => {
        const { data, error } = await supabase
          .from("screening_storage_shed")
          .select("Product")
          .not("Product", "is", null);
        if (data && alive) {
          const uniqueProducts = Array.from(
            new Set(data.flatMap(r => 
              String(r.Product || "")
              .split(",")
              .map(s => s.trim())
              .filter(Boolean)
            )
          )).sort();
          setProducts(uniqueProducts);
        }
      })();
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
        const { data, error } = await supabase
          .from("screening_storage_shed")
          .select("Supplier")
          .not("Supplier", "is", null);
        if (data && alive) {
          const uniqueSupplier = Array.from(new Set(data.map(r => r.Supplier))).filter(p => p);
          setSuppliers(uniqueSupplier);
        }
      })();
    return () => { alive = false; };
  }, []);
  /*useEffect(() => {
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
}, []);*/
const handleDelete = async (id) => {
  const confirm = window.confirm("Are you sure you want to delete this item?");
  if (!confirm) return;
  try {
    const res = await fetch(`/api/screeningStorageBackend?id=${encodeURIComponent(id)}`, 
      { method: "DELETE"}
    );
    if (!res.ok) throw new Error("Delete failed");
    setData((prev) => prev.filter((x) => x.id !== id)); 
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
      prev.map(x => x.id === notesOpenFor ? { ...x, notes: notesText } : x)
    );
    setNotesOpenFor(null);
    setNotesText("");
  } catch (err) {
    console.error("Save notes failed:", err);
    alert(`Failed to save notes: ${err.message}`);
  }
};
useEffect(() => {
  //handleSearch();
  if (openId === null) return;
  const handleOutside = () => setOpenId(null);
  document.addEventListener("click", handleOutside);
  return () => document.removeEventListener("click", handleOutside);
}, [openId]);
    return (
      <Layout title="Screening Storage" showBack={true}>
        <div class="w=[100%] h=[5%] flex justify-start px-8 px-4">
          <div class="flex flex-wrap gap-3 items-end">
            
            <div>
              <label class="block text-sm mb-1 text gray-700">Search</label>
              <input
                type= "text"
                value= {lotQuery}
                onChange= {(e) => setLotQuery(e.target.value)}
                placeholder = "Enter Lot Number..."
                class="w-[220px] border rounded-lg px-3 py-2 focus::outline-none focus:ring-2 focus:ring-[#5D1214] bg-white"
              />
            </div>
            
            <div>
              <label class = "block text-sm mb-1 text gray-700">Filter Product</label>
              <select
                class="w-[200px] border rounded-lg px-3 py-2 focus::outline-none focus:ring-2 focus:ring-[#5D1214] bg-white"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label class = "block text-sm mb-1 text gray-700">Filter Suppliers</label>
              <select
                class="w-[200px] border rounded-lg px-3 py-2 focus::outline-none focus:ring-2 focus:ring-[#5D1214] bg-white"
                value={nSupplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="">All Suppliers</option>
                <option value="_NULL_">No Supplier</option>
                {suppliers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>


            <div>
              <button
                onClick={() => {setLotQuery(""); setProductFilter(""); setSupplierFilter("");}}
                class="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
              >
                Clear Filters
              </button>
            </div>
           <div>
                <button
                  onClick={handleSearch}
                  class="px-4 py-2 rounded-lg bg-[#5D1214] text-white hover:bg-[#2C3A35]"
                >
                  Search
                </button>
            </div>
          </div>
        </div>
        <div class = "w-[100%] h-[90%] flex flex-col items-center gap-4 overflow-y-scroll text-black">
          {visibleData.map((item, index) => (
            <div 
            key={index}
            class = "bg-gray-100 w-[100%] h-[10%] rounded-[30px] shadow-lg items-start items-center justify-around flex gap-2 p-4"
            >
                
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Lot Number</span>
                <div class = "text-sm text-center truncate max-w-[120px]">
                  {item.lotNumber|| "N/A"}
                </div>
              </div>
               
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Process ID</span>
                <div class = "text-sm text-center truncate max-w-[120px]">
                  {item.processId|| "N/A"}
                </div>
              </div>
          
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Product</span>  
                <div class = "text-sm text-center truncate max-w-[120px]">
                  {item.product|| "N/A"}
                </div>
              </div>

              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Box ID</span>
                <div class = "text-sm text-center truncate max-w-[120px]">
                  {item.boxId|| "N/A"}
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Amount</span>
                <div class = "text-sm text-center truncate max-w-[120px]">
                  {item.amount|| "N/A"}
                </div>
              </div>
              
              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Type</span>
                <div class = "text-sm text-center truncate max-w-[120px]">
                  {item.type|| "N/A"}
                </div>
              </div>

              <div class = "flex flex-col items-center gap-2">
                <span class = "text-sm">Date Stored</span>
                <div class = "text-sm items-center justify-cente">
                  {item.dateStored|| "N/A"}
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
                        router.push(`/screeningStorageModify?id=${encodeURIComponent(item.id)}`);
                      }}
                    >
                      Modify
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                      onClick={() => {
                        setOpenId(null);
                        handleDelete(item.id);
                      }}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left text-indigo-600 hover:bg-gray-100"
                      onClick={() => {
                        setOpenId(null);
                        setNotesOpenFor(item.id);
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
        <div class ="flex justify-center items-center gap-4 mt-10 mb-6"> 
          <button
            onClick={() => setPage((pPage) => Math.max(1, pPage - 1))}
            disabled={page === 1}
            class="px-4 py-2 rounded-lg bg-[#5D1214] text-white hover:bg-[#2C3A35] disabled:opacity-50"
          >
            Previous
          </button>
          <span class="text-gray-600">
            Page {page} of {Math.ceil(data.length / pageSize) || 1}
          </span> 

          <button
            onClick={() =>
              setPage((pPage) =>
                pPage < Math.ceil(data.length / pageSize) ? pPage + 1 : pPage
              )
            }
            disabled={page >= Math.ceil(data.length / pageSize)}
            class="px-4 py-2 rounded-lg bg-[#5D1214] text-white hover:bg-[#2C3A35] disabled:opacity-50"
          >
            Next
          </button>
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