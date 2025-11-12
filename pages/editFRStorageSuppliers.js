
"use client";
import React, { useRef, useState, useEffect } from "react";
import Layout from "../components/layout";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function EditFRStorageSuppliers() {
  //states
  const [storageName, setStorageName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [msgStorage, setMsgStorage] = useState("");
  const [msgCustomer, setMsgCustomer] = useState("");

  const [storageLocationId, setStorageLocationId] = useState("");
  const [customerId, setCustomerId] = useState("");

  const [storageLocations, setStorageLocations] = useState([]);
  const [customers, setCustomers] = useState([]);

  // styling
  const btn =
    "bg-[#5D1214] text-white px-6 py-2 rounded-[10px] text-base font-semibold text-center hover:bg-[#3D5147] transition-all duration-300 disabled:opacity-60";
  const field =
    "border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none";
  const selectBox =
    "border border-gray-300 rounded-md px-3 py-2 text-gray-700";

  //fetch the lists
  async function fetchList(apiRoute, setData) {
    try {
      const res = await fetch(apiRoute);
      const data = await res.json();
      setData(data || []);
    } catch (err) {
      console.error("Error fetching:", err);
    }
  }

  // lists
  useEffect(() => {
    fetchList("/api/fetchFRStorageLocation", setStorageLocations);
    fetchList("/api/fetchCustomers", setCustomers);
  }, []);

  // functions
  async function handleAddStorage(e) {
    e.preventDefault();
    try {
      // Insert directly into Supabase
      const { error } = await supabase.from("field_run_storage_test").insert([
        {
          location: storageName,        // text primary key
          lot_number: [],                // default empty array
          product: [],                  // default empty array
          weight: 0,
          moisture: 0,
          date_stored: new Date().toISOString(), // default current date
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          throw new Error(`Location "${storageName}" already exists.`);
        } else {
          throw error;
        }
      }

      setMsgStorage("Field Run Storage location added!");
      setStorageName("");
      fetchList("/api/fetchFRStorageLocation", setStorageLocations);

    } catch (err) {
      setMsgStorage(err.message);
    }
  }

  async function handleAddCustomer(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/addCustomer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customerName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add customer");
      setMsgCustomer("Customer added!");
      setCustomerName("");
      fetchList("/api/fetchCustomers", setCustomers);
    } catch (err) {
      setMsgCustomer(err.message);
    }
  }

  // delete functions
  async function deleteFRStorageLocation(id) {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete location "${id}"?\nThis action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/deleteFRStorageLocation", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      alert(`"${id}" deleted!`);
      fetchList("/api/fetchFRStorageLocation", setStorageLocations);
      setStorageLocationId("");
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteCustomer(id) {
    const selectedCustomer = customers.find(c => c.customer_id === id);
    const name = selectedCustomer ? selectedCustomer.name : "Unknown";
    const confirmDelete = window.confirm(
      `Are you sure you want to delete customer "${name}"?\nThis action cannot be undone.`
    );
    if (!confirmDelete) return;
    try {
      const res = await fetch("/api/delCustomer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      alert("Customer deleted!");
      fetchList("/api/fetchCustomers", setCustomers);
      setCustomerId("");
    } catch (err) {
      alert(err.message);
    }
  }

  async function setCustomerNickname(cust) {
    const current = cust.nickname || "";
    const input = window.prompt(`Set nickname for "${cust.name}"`, current);
    if (input === null) return; // user canceled

    const nickname = input.trim();
    try {
      const { error } = await supabase
        .from("customers")
        .update({ nickname })
        .eq("customer_id", cust.customer_id);

      if (error) throw error;

      // refresh the right card list
      await fetchList("/api/fetchCustomers", setCustomers);
    } catch (err) {
      alert(err.message || "Failed to update nickname");
    }
  }

  //customer card
  function CustomerCard({ cust, onSetNickname }) {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
      function handleClickOutside(event) {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setMenuOpen(false);
        }
      }

      if (menuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }

      // cleanup when unmounting
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    return (
      <div className="relative bg-gray-100 h-auto rounded-[30px] shadow-lg
       grid grid-cols-3 items-center justify-between gap-4 p-4 text-black"
        ref={menuRef}>

        <div className="flex flex-col justify-between items-center text-center h-[45px] px-2">
          <span className="text-sm font-semibold">Customer</span>
          <div
            title={cust.name}
            className="text-sm max-w-[6rem] leading-tight overflow-hidden text-ellipsis whitespace-nowrap">
            {cust.name}
          </div>
        </div>

        <div className="flex flex-col justify-between items-center text-center h-[45px] px-2">
          <span className="text-sm font-semibold">Nickname</span>
          <div className="text-sm max-w-[6rem] leading-tight overflow-hidden text-ellipsis whitespace-nowrap">{cust.nickname || "-"}

          </div>
        </div>

        {/* Right: dropdown trigger */}
        <div className="relative flex items-center justify-center">
          <button onClick={() => setMenuOpen((v) => !v)}
            className="shrink-0"
            aria-label="Open menu"
            type="button">

            <img
              src="/more_horiz.png"
              alt="more_horiz"
              className="w-[30px] h-[30px] object-contain opacity-100 hover:opacity-50 transition"
            />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute right-2 top-12 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                onClick={() => {
                  onSetNickname(cust);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit Nickname
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  //return function
  return (
    <Layout title="Edit Field Run Storage & Customers" showBack={true}>
      <div className="w-full px-8 flex flex-col items-center">

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="w-full max-w-5xl bg-white p-8 rounded-xl shadow">
            <h1 className="text-black text-3xl font-bold mb-10 text-center">
              Add / Delete Field Run Storage & Customers
            </h1>

            {/* Add in row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              {/* adding storage location */}
              <form onSubmit={handleAddStorage} className="flex flex-col gap-3">
                <h2 className="text-black font-semibold text-lg text-center md:text-left">
                  Add Field Run Storage Location
                </h2>
                <input
                  className={field}
                  placeholder="Enter Field Run Storage Location"
                  value={storageName}
                  onChange={(e) => setStorageName(e.target.value)}
                />
                <button type="submit" className={btn} disabled={!storageName.trim()}>
                  Add
                </button>
                {msgStorage && (
                  <p className="text-sm text-center md:text-left">{msgStorage}</p>
                )}
              </form>

              {/* adding customer */}
              <form onSubmit={handleAddCustomer} className="flex flex-col gap-3">
                <h2 className="text-black font-semibold text-lg text-center md:text-left">
                  Add Customer
                </h2>
                <input
                  className={field}
                  placeholder="Enter Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <button type="submit" className={btn} disabled={!customerName.trim()}>
                  Add
                </button>
                {msgCustomer && (
                  <p className="text-sm text-center md:text-left">{msgCustomer}</p>
                )}
              </form>
            </div>

            {/* delete in row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* delete FR storage location */}
              <div className="flex flex-col gap-3">
                <h2 className="text-black font-semibold text-lg text-center md:text-left">
                  Delete Field Run Storage Location
                </h2>
                <select
                  className={selectBox}
                  value={storageLocationId}
                  onChange={(e) => setStorageLocationId(e.target.value)}
                >
                  <option value="">Select</option>
                  {storageLocations.map((loc) => (
                    <option key={loc.location} value={loc.location}>
                      {loc.location}
                    </option>
                  ))}
                </select>
                <button
                  className={btn}
                  disabled={!storageLocationId}
                  onClick={() => deleteFRStorageLocation(storageLocationId)}
                >
                  Delete
                </button>
              </div>

              {/* delete customer */}
              <div className="flex flex-col gap-3">
                <h2 className="text-black font-semibold text-lg text-center md:text-left">
                  Delete Customer
                </h2>
                <select
                  className={selectBox}
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Select</option>
                  {customers.map((cust) => (
                    <option key={cust.customer_id} value={cust.customer_id}>
                      {cust.name}
                    </option>
                  ))}
                </select>
                <button
                  className={btn}
                  disabled={!customerId}
                  onClick={() => deleteCustomer(customerId)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
          
          {/* customers */}
          <div className="w-full bg-white p-8 rounded-xl shadow h-[500px] flex flex-col">
            <h1 className="text-black text-3xl font-bold mb-10 text-center">
              Customers
            </h1>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {customers.map((cust) => (
                  <CustomerCard
                    key={cust.customer_id}
                    cust={cust}
                    onSetNickname={setCustomerNickname}
                  />
                ))}
              </div>
           </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}