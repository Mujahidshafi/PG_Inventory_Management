import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/layout";

export default function ManageTrash() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    product: "",
    supplier: "",
    lot_number: "",
  });

  // 🔹 Fetch trash data
  useEffect(() => {
    const fetchTrash = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("trash")
        .select("*")
        .order("Date_Stored", { ascending: false });

      if (error) console.error("Error fetching trash data:", error);
      else setRecords(data || []);
      setLoading(false);
    };
    fetchTrash();
  }, []);

  // 🔹 Update field inline
  const updateRecord = async (id, field, value) => {
    try {
      const { error } = await supabase
        .from("trash")
        .update({ [field]: value })
        .eq("ID", id);
      if (error) throw error;

      setRecords((prev) =>
        prev.map((r) => (r.ID === id ? { ...r, [field]: value } : r))
      );
    } catch (err) {
      alert("Error updating record: " + err.message);
    }
  };

  // 🔹 Delete record
  const deleteRecord = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const { error } = await supabase.from("trash").delete().eq("ID", id);
      if (error) throw error;
      setRecords((prev) => prev.filter((r) => r.ID !== id));
    } catch (err) {
      alert("Error deleting record: " + err.message);
    }
  };

  // 🔹 Filters & search
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const searchMatch =
        search === "" ||
        [
          r.Process_ID,
          r.Lot_Number,
          r.Product,
          r.Supplier,
          r.Location,
          r.Notes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      const filterMatch =
        (filters.product === "" || r.Product === filters.product) &&
        (filters.supplier === "" || r.Supplier === filters.supplier) &&
        (filters.lot_number === "" || r.Lot_Number === filters.lot_number);

      return searchMatch && filterMatch;
    });
  }, [records, search, filters]);

  // 🔹 Unique filter options
  const uniqueProducts = [...new Set(records.map((r) => r.Product))];
  const uniqueSuppliers = [...new Set(records.map((r) => r.Supplier))];
  const uniqueLots = [...new Set(records.map((r) => r.Lot_Number))];

  return (
    <Layout title="Trash Records" showBack={true}>
    <div className="bg-[#D9D9D9] p-6 overflow-y-auto h-full">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 🔍 Filters Section */}
        <section className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Search & Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
            <select
              value={filters.product}
              onChange={(e) =>
                setFilters({ ...filters, product: e.target.value })
              }
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="">All Products</option>
              {uniqueProducts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={filters.supplier}
              onChange={(e) =>
                setFilters({ ...filters, supplier: e.target.value })
              }
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="">All Suppliers</option>
              {uniqueSuppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filters.lot_number}
              onChange={(e) =>
                setFilters({ ...filters, lot_number: e.target.value })
              }
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="">All Lot Numbers</option>
              {uniqueLots.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* 🗑️ Trash Records Table */}
        <section className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Current Trash Records</h2>

          {loading ? (
            <p className="text-center text-gray-500">Loading records...</p>
          ) : filteredRecords.length === 0 ? (
            <p className="text-center text-gray-500">No trash records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="p-2 text-left">Process ID</th>
                    <th className="p-2 text-left">Lot Number</th>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-right">Amount (lbs)</th>
                    <th className="p-2 text-left">Supplier</th>
                    <th className="p-2 text-left">Location</th>
                    <th className="p-2 text-left">Notes</th>
                    <th className="p-2 text-center">Date Stored</th>
                    <th className="p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r) => (
                    <tr key={r.ID} className="border-t hover:bg-gray-50">
                      {[
                        "Process_ID",
                        "Lot_Number",
                        "Product",
                        "Amount",
                        "Supplier",
                        "Location",
                        "Notes",
                      ].map((field) => (
                        <td
                          key={field}
                          className={`p-2 ${
                            field === "Amount" ? "text-right" : "text-left"
                          }`}
                        >
                          <input
                            type={field === "Amount" ? "number" : "text"}
                            className="w-full border rounded px-2 py-1"
                            value={r[field] || ""}
                            onChange={(e) =>
                              updateRecord(r.ID, field, e.target.value)
                            }
                          />
                        </td>
                      ))}
                      <td className="p-2 text-center text-gray-700">
                        {r.Date_Stored
                          ? new Date(r.Date_Stored).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => deleteRecord(r.ID)}
                          className="text-red-600 hover:underline"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
    </Layout>
  );
}
