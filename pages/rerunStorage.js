import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/layout";

export default function ManageRerunStorage() {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    product: "",
    supplier: "",
    lot_number: "",
    location: "",
  });

  const [newBox, setNewBox] = useState({
    Box_ID: "",
    Process_ID: "",
    Location: "",
    Lot_Number: "",
    Product: "",
    Amount: 0,
    Supplier: "",
    Notes: "",
  });

  // 🔹 Fetch rerun boxes
  useEffect(() => {
    const fetchBoxes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("rerun_product_storage")
        .select("*")
        .order("Date_Stored", { ascending: false });
      if (error) console.error("Error fetching rerun boxes:", error);
      else setBoxes(data || []);
      setLoading(false);
    };
    fetchBoxes();
  }, []);

  // 🔹 Add new box
  const addBox = async () => {
    if (!newBox.Box_ID.trim()) {
      alert("Box ID is required.");
      return;
    }
    try {
      const { error } = await supabase.from("rerun_product_storage").insert([newBox]);
      if (error) throw error;

      setBoxes((prev) => [newBox, ...prev]);
      setNewBox({
        Box_ID: "",
        Process_ID: "",
        Location: "",
        Lot_Number: "",
        Product: "",
        Amount: 0,
        Supplier: "",
        Notes: "",
      });
      alert("Box added successfully!");
    } catch (err) {
      alert("Error adding box: " + err.message);
    }
  };

  // 🔹 Update box field
  const updateBox = async (id, field, value) => {
    try {
      const { error } = await supabase
        .from("rerun_product_storage")
        .update({ [field]: value })
        .eq("ID", id);
      if (error) throw error;

      setBoxes((prev) =>
        prev.map((b) => (b.ID === id ? { ...b, [field]: value } : b))
      );
    } catch (err) {
      alert("Error updating box: " + err.message);
    }
  };

  // 🔹 Delete box
  const deleteBox = async (id) => {
    if (!confirm("Delete this box?")) return;
    try {
      const { error } = await supabase
        .from("rerun_product_storage")
        .delete()
        .eq("ID", id);
      if (error) throw error;
      setBoxes((prev) => prev.filter((b) => b.ID !== id));
    } catch (err) {
      alert("Error deleting box: " + err.message);
    }
  };

  // 🔹 Filtered & searched boxes
  const filteredBoxes = useMemo(() => {
    return boxes.filter((b) => {
      const searchMatch =
        search === "" ||
        [
          b.Box_ID,
          b.Process_ID,
          b.Lot_Number,
          b.Product,
          b.Supplier,
          b.Location,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      const filterMatch =
        (filters.product === "" || b.Product === filters.product) &&
        (filters.supplier === "" || b.Supplier === filters.supplier) &&
        (filters.lot_number === "" || b.Lot_Number === filters.lot_number) &&
        (filters.location === "" || b.Location === filters.location);

      return searchMatch && filterMatch;
    });
  }, [boxes, search, filters]);

  // 🔹 Unique values for filters
  const uniqueProducts = [...new Set(boxes.map((b) => b.Product))];
  const uniqueSuppliers = [...new Set(boxes.map((b) => b.Supplier))];
  const uniqueLots = [...new Set(boxes.map((b) => b.Lot_Number))];
  const uniqueLocations = [...new Set(boxes.map((b) => b.Location))];

  return (
    <Layout title="Rerun Product Storage" showBack={true}>
    <div className="bg-[#D9D9D9] p-6 overflow-y-auto h-full">
      <div className="max-w-7xl mx-auto space-y-8">        

        {/* ➕ Add New Box */}
        <section className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Add New Box</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.keys(newBox).map((key) => (
              <input
                key={key}
                type={
                  key === "Amount"
                    ? "number"
                    : key === "Notes"
                    ? "text"
                    : "text"
                }
                placeholder={key.replace(/_/g, " ")}
                value={newBox[key]}
                onChange={(e) =>
                  setNewBox({ ...newBox, [key]: e.target.value })
                }
                className="border rounded-lg px-3 py-2"
              />
            ))}
          </div>
          <div className="mt-4">
            <button
              onClick={addBox}
              className="bg-[#5D1214] text-white px-5 py-2 rounded-lg hover:opacity-90"
            >
              Add Box
            </button>
          </div>
        </section>

        {/* 🔍 Filters Section */}
        <section className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Search & Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
              {uniqueProducts.map((prod) => (
                <option key={prod} value={prod}>
                  {prod}
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
              <option value="">All Lots</option>
              {uniqueLots.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* 📦 Existing Boxes Table */}
        <section className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Current Rerun Boxes</h2>

          {loading ? (
            <p className="text-center text-gray-500">Loading boxes...</p>
          ) : filteredBoxes.length === 0 ? (
            <p className="text-center text-gray-500">No boxes found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="p-2 text-left">Box ID</th>
                    <th className="p-2 text-left">Process ID</th>
                    <th className="p-2 text-left">Location</th>
                    <th className="p-2 text-left">Lot Number</th>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-right">Amount (lbs)</th>
                    <th className="p-2 text-left">Supplier</th>
                    <th className="p-2 text-left">Notes</th>
                    <th className="p-2 text-center">Date Stored</th>
                    <th className="p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBoxes.map((b) => (
                    <tr key={b.ID} className="border-t hover:bg-gray-50">
                      {[
                        "Box_ID",
                        "Process_ID",
                        "Location",
                        "Lot_Number",
                        "Product",
                        "Amount",
                        "Supplier",
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
                            value={b[field] || ""}
                            onChange={(e) =>
                              updateBox(b.ID, field, e.target.value)
                            }
                          />
                        </td>
                      ))}
                      <td className="p-2 text-center text-gray-700">
                        {b.Date_Stored
                          ? new Date(b.Date_Stored).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => deleteBox(b.ID)}
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
