import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/layout"; 

function ScreeningStorageModify() {
  const router = useRouter();
  const { id } = router.query;
  const [item, setItem] = useState(null)
  const [lotNumber, setLotNumber] = useState("");
  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [dateStored, setDateStored] = useState("");
  const [notes, setNotes] = useState("");
      useEffect(() => {
        if(!id) return;
        (async () => {
          try{
          const res = await fetch(`/api/screeningStorageBackend?id=${encodeURIComponent(id)}`);
          const json = await res.json();
          setItem(json);
          setLotNumber(json?.Lot_Number ?? "");
          setProduct(json?.Product ?? "");
          setAmount(String(json?.Amount ?? ""));
          const d = json?.Date_Stored ? new Date(json.Date_Stored) : null;
          setDateStored(d ? d.toLocaleString() : "");
          setNotes(json?.Notes ?? "");
          } catch (err) {
            console.error("Error fetching item:", err);
          }
        })();
      }, [id]);
    const handleSave = async () => {
      try {
        const res = await fetch(`/api/screeningStorageBackend?id=${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            Lot_Number: lotNumber ?? "",
            Product: product ?? "",
            Amount: amount ?? "",
            Date_Stored: dateStored ?? "",
            Notes: notes ?? ""
          }),
        });
    if (!res.ok) throw new Error("Save failed");
    alert("Saved!");
      } catch (err) {
        console.error("Error saving item:", err);
      }
    };
    if (!item) {
      return <div>Loading...</div>;
    }
    return (
      <Layout title="Screening Storage Modify" showBack={true}>
            <div className="flex flex-wrap items-center justify-center gap-16 p-6">
              <div className="flex flex-col items-center">
                <label className="font-bold">Field Lot Number</label>
                <input
                  className="bg-white p-2 w-[175px] border rounded-lg my-2"
                  placeholder="Input"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                />
              </div>
              <div className="flex flex-col items-center">
                <label className="font-bold">Product Description</label>
                <input
                  className="bg-white p-2 w-[175px] border rounded-lg my-2"
                  placeholder="Product"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>
              <div className="flex flex-col items-center">
                <label className="font-bold">Weight</label>
                <input
                  className="bg-white p-2 w-[175px] border rounded-lg my-2"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col items-center">
                <label className="font-bold">Date and Time</label>
                <input
                  className="bg-white p-2 w-[175px] border rounded-lg my-2"
                  placeholder="mm/dd/yyyy"
                  value={dateStored}
                  onChange={(e) => setDateStored(e.target.value)}
                />
              </div>
              <div className="w-full mt-6 flex justify-center">
                <div className="w-full max-w-3xl px-6">
                  <label className="font-bold block mb-2">Notes</label>
                  <textarea
                    className="bg-white p-3 w-full min-h-[180px] border rounded-lg resize-none"
                    placeholder="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
            </div>
              <button
                type="button"
                onClick={handleSave}
                className="justify-center items-center w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]"
              >
                Save
              </button>
            </div>
          </Layout>
    );
  }

export default ScreeningStorageModify;
