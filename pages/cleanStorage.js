import React, { useEffect, useState } from "react";
import Layout from "../components/layout";
import Link from "next/link";

import CleanStorageCard from "../components/CleanStorageCard";
import { supabase } from "../lib/supabaseClient";
import { set } from "date-fns";
import { useRouter } from "next/router";
//import { headers } from "next/headers";

function CleanStorage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [notesOpenFor, setNotesOpenFor] = useState(null);
  const [notesText, setNotesText] = useState("");
  const [lotQuery, setLotQuery] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [nSupplierFilter, setSupplierFilter] = useState("");
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(1);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const  category_map = {
    "Corn Products": new Set(["YPCBL", "YPCM", "MCPC", "WPC", "FC", "WC", "YC", "BC-K", "RPC", "BPC"]),
    "Wheat Products": new Set(["SWW","HRW","TRIT","TRIT-V"]),
    "Pulses Products": new Set(["DRK", "BTB", "GB", "MUNG", "URAD", "PB", "BLB", "RL", "GL", "GSP", "YSP"]),
    "Non-Food Products / Seeds": new Set(["BELL", "CV", "CVHV", "CVPV", "HV", "HVPV", "LV", "PV"]),
  };
  function categorizeProducts (product) {
    const tokens = String(product || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
    const foundCategories = [];
    for(const [category,codes] of Object.entries(category_map)){
      if(tokens.some((t) => codes.has(t))){
        foundCategories.push(category);
      }
    }
    if(foundCategories.length === 0)
      foundCategories.push("Uncategorized Products");{
    }
    return foundCategories;
  }
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cleanStorageBackend",{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lot: lotQuery.trim() || undefined,
          product: productFilter.trim() || undefined,
          supplier: nSupplierFilter.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (Array.isArray(json) ){
        const list = json.map((item) => {
          //const category = categorizeProducts(item.Product);
          return{
            id: item.ID,
            boxId: item.Box_ID,
            supplier: item.Supplier,
            product: item.Product,
            lotNumber: item.Lot_Number,
            processId: item.Process_ID,
            amount: item.Amount,
            dateStored: item.Date_Stored ? new Date(item.Date_Stored) : null,
            type: item.Type,
            notes: item.Notes,
            category: categorizeProducts(item.Product),
          }
        });
        setGroups(list);
        setPage(1)
      } else {
        console.error("Did not Recieve", json)
        setGroups([]);
      }
    } catch (err) {
      console.error("Error fetching clean storage data:", err);
      setGroups([]);
    } finally {
      setLoading(false);
    } 
  };
  const handleSearch = () => {
    fetchData();
  };
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
        const { data, error } = await supabase
          .from("clean_product_storage")
          .select("Product")
          .not("Product", "is", null);
        if (data && alive) {
          const uniqueProducts = Array.from(
            new Set(data.flatMap(item => 
              String(item.Product || "")
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
          .from("clean_product_storage")
          .select("Supplier")
          .not("Supplier", "is", null);
        if (data && alive) {
          const uniqueSupplier = Array.from(new Set(data.map(item => item.Supplier))).filter(Boolean);
          setSuppliers(uniqueSupplier);
        }
      })();
    return () => { alive = false; };
  }, []);

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this item?");
    if (!confirm) return;
    try {
      const res = await fetch(`/api/cleanStorageBackend?id=${encodeURIComponent(id)}`, 
        { method: "DELETE"}
      );
      if (!res.ok) throw new Error("Delete failed");
      setGroups((prev) => prev.filter((x) => x.id !== id)); 
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
      const res = await fetch(`/api/cleanStorageBackend?id=${encodeURIComponent(notesOpenFor)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Notes: notesText }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setGroups(prev =>
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
  const groupedByCategory = React.useMemo(() => {
    const out = {};
    const rows = Array.isArray(groups) ? groups : [];

    rows.forEach((item) => {
      const cats =
        Array.isArray(item.category) && item.category.length
          ? item.category
          : ["Uncategorized Products"];

      cats.forEach((cat) => {
        (out[cat] ||= []).push({ ...item, category: cat });
      });
    });

    return out;
  }, [groups]);
  const orderedCategories = [
    "Corn Products",
    "Wheat Products",
    "Pulses Products",
    "Non-Food Products / Seeds",
    "Uncategorized Products",
    ...Object.keys(groupedByCategory).filter(
      (c) => !["Corn Products","Wheat Products","Pulses Products","Non-Food Products / Seeds","Uncategorized Products"].includes(c)
    ),
  ];
  const visibleData = Array.isArray(groups) ? groups : [];;
  return (
    <Layout title="Clean Storage">
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
  <div class="w-[100%] h-[90%] flex flex-col items-center gap-4 overflow-y-scroll text-black">
    {orderedCategories
      .filter((cat) => (groupedByCategory[cat]?.length || 0) > 0)
      .map((cat) => (
        <React.Fragment key={`section-${cat}`}>
          <div class="w-full bg-[#5D1214] text-white py-2 px-4 rounded-md mt-6 mb-2">
            <h3 class="text-base font-semibold">{cat}</h3>
          </div>

          {groupedByCategory[cat].map((item, idx) => {
            const rowKey = `${item.id}|${cat}|${idx}`;
            const menuKey = `${item.id}|${cat}`;
            return (
              <div
                key={rowKey}
                class="bg-gray-100 w-[100%] rounded-[30px] shadow-lg items-center justify-around flex gap-2 p-4"
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
                  <span class = "text-sm">Date Stored</span>
                  <div class = "text-sm items-center justify-cente">
                    {item.dateStored instanceof Date ? item.dateStored.toLocaleString() : "N/A"}
                  </div>
                </div>

                <div class="relative inline-block">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenId((id) => (id === menuKey ? null : menuKey));
                    }}
                    class="p-1 rounded hover:bg-black/5"
                  >
                    <img
                      src="/more_horiz.png"
                      alt="more"
                      class="w-[30px] h-[30px] object-contain"
                    />
                  </button>

                  {openId === menuKey && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      class="absolute right-0 mt-2 bg-white border rounded shadow-md z-50"
                    >
                      <button
                        class="block w-full px-4 py-2 text-left text-green-600 hover:bg-gray-100"
                        onClick={() => {
                          setOpenId(null);
                          router.push(`/cleanStorageModify?id=${encodeURIComponent(item.id)}`);
                        }}
                      >
                        Modify
                      </button>
                      <button
                        class="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                        onClick={() => {
                          setOpenId(null);
                          handleDelete(item.id);
                        }}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        class="block w-full px-4 py-2 text-left text-indigo-600 hover:bg-gray-100"
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
            );
          })}
        </React.Fragment>
      ))}
  </div>
      {notesOpenFor && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setNotesOpenFor(null)}
        >
          <div
            class="w-[520px] max-w-[90vw] rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 class="text-lg font-semibold mb-2">Add Notes</h3>
            <textarea
              class="w-full h-[160px] border rounded-md p-2 resize-none"
              placeholder="Enter notes…"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
            />
            <div class="mt-4 flex justify-end gap-2">
              <button
                type="button"
                class="px-4 py-2 rounded-md border"
                onClick={() => setNotesOpenFor(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-md bg-[#5D1214] text-white hover:bg-[#2C3A35]"
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

export default CleanStorage;
