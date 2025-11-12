import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ManageBaggedStorage() {
  const [pallets, setPallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    product: "",
    supplier: "",
    lot_number: "",
    bag_type: "",
  });

  const [newPallet, setNewPallet] = useState({
    pallet_id: "",
    lot_number: "",
    product: "",
    supplier: "",
    bag_type: "25lb",
    num_bags: 0,
    total_weight: 0,
    storage_location: "",
    notes: "",
  });

  // 🔹 Load pallets
  useEffect(() => {
    const fetchPallets = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bagged_storage")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) console.error("Error fetching pallets:", error);
      else setPallets(data || []);
      setLoading(false);
    };
    fetchPallets();
  }, []);

  // 🔹 Add new pallet
  const addPallet = async () => {
    if (!newPallet.pallet_id.trim()) {
      alert("Pallet ID is required.");
      return;
    }
    try {
      const { error } = await supabase.from("bagged_storage").insert([
        {
          ...newPallet,
          num_bags: Number(newPallet.num_bags) || 0,
          total_weight: Number(newPallet.total_weight) || 0,
        },
      ]);
      if (error) throw error;
      setPallets((prev) => [newPallet, ...prev]);
      setNewPallet({
        pallet_id: "",
        lot_number: "",
        product: "",
        supplier: "",
        bag_type: "25lb",
        num_bags: 0,
        total_weight: 0,
        storage_location: "",
        notes: "",
      });
    } catch (err) {
      alert("Error adding pallet: " + err.message);
    }
  };

  // 🔹 Update pallet
  const updatePallet = async (id, field, value) => {
    try {
      const { error } = await supabase
        .from("bagged_storage")
        .update({ [field]: value })
        .eq("pallet_id", id);
      if (error) throw error;
      setPallets((prev) =>
        prev.map((p) => (p.pallet_id === id ? { ...p, [field]: value } : p))
      );
    } catch (err) {
      console.error("Error updating pallet:", err);
    }
  };

  // 🔹 Delete pallet
  const deletePallet = async (id) => {
    if (!confirm(`Delete pallet ${id}?`)) return;
    try {
      const { error } = await supabase
        .from("bagged_storage")
        .delete()
        .eq("pallet_id", id);
      if (error) throw error;
      setPallets((prev) => prev.filter((p) => p.pallet_id !== id));
    } catch (err) {
      alert("Error deleting pallet: " + err.message);
    }
  };

  // 🔹 Compute filtered & searched pallets
  const filteredPallets = useMemo(() => {
    return pallets.filter((p) => {
      const matchesSearch =
        search === "" ||
        [p.pallet_id, p.product, p.supplier, p.lot_number, p.bag_type]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilters =
        (filters.product === "" || p.product === filters.product) &&
        (filters.supplier === "" || p.supplier === filters.supplier) &&
        (filters.lot_number === "" || p.lot_number === filters.lot_number) &&
        (filters.bag_type === "" || p.bag_type === filters.bag_type);

      return matchesSearch && matchesFilters;
    });
  }, [pallets, search, filters]);

  // 🔹 Collect filter options
  const uniqueProducts = [...new Set(pallets.map((p) => p.product))];
  const uniqueSuppliers = [...new Set(pallets.map((p) => p.supplier))];
  const uniqueLots = [...new Set(pallets.map((p) => p.lot_number))];
  const bagTypes = ["25lb", "50lb", "2000lb tote"];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-center">
          Bagged Storage Management
        </h1>

        

        {/* Add New Pallet */}
        <section className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Add New Pallet</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Pallet ID"
              value={newPallet.pallet_id}
              onChange={(e) =>
                setNewPallet({ ...newPallet, pallet_id: e.target.value })
              }
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="text"
              placeholder="Lot Number"
              value={newPallet.lot_number}
              onChange={(e) =>
                setNewPallet({ ...newPallet, lot_number: e.target.value })
              }
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="text"
              placeholder="Product"
              value={newPallet.product}
              onChange={(e) =>
                setNewPallet({ ...newPallet, product: e.target.value })
              }
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="text"
              placeholder="Supplier"
              value={newPallet.supplier}
              onChange={(e) =>
                setNewPallet({ ...newPallet, supplier: e.target.value })
              }
              className="border rounded-lg px-3 py-2"
            />
            <select
              value={newPallet.bag_type}
              onChange={(e) =>
                setNewPallet({ ...newPallet, bag_type: e.target.value })
              }
              className="border rounded-lg px-3 py-2 bg-white"
            >
              {bagTypes.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Bags"
              value={newPallet.num_bags}
              onChange={(e) =>
                setNewPallet({ ...newPallet, num_bags: e.target.value })
              }
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="number"
              placeholder="Weight (lbs)"
              value={newPallet.total_weight}
              onChange={(e) =>
                setNewPallet({ ...newPallet, total_weight: e.target.value })
              }
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="text"
              placeholder="Location"
              value={newPallet.storage_location}
              onChange={(e) =>
                setNewPallet({
                  ...newPallet,
                  storage_location: e.target.value,
                })
              }
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="text"
              placeholder="Notes"
              value={newPallet.notes}
              onChange={(e) =>
                setNewPallet({ ...newPallet, notes: e.target.value })
              }
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div className="mt-4">
            <button
              onClick={addPallet}
              className="bg-black text-white px-5 py-2 rounded-lg hover:opacity-90"
            >
              Add Pallet
            </button>
          </div>
        </section>

        {/* Filters */}
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
              value={filters.bag_type}
              onChange={(e) =>
                setFilters({ ...filters, bag_type: e.target.value })
              }
              className="border rounded-lg px-3 py-2 bg-white"
            >
              <option value="">All Bag Types</option>
              {bagTypes.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Pallets Table */}
        <section className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Current Pallets</h2>
          {loading ? (
            <p className="text-center text-gray-500">Loading pallets...</p>
          ) : filteredPallets.length === 0 ? (
            <p className="text-center text-gray-500">No pallets found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="p-2 text-left">Pallet ID</th>
                    <th className="p-2 text-left">Lot Number</th>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-left">Supplier</th>
                    <th className="p-2 text-left">Bag Type</th>
                    <th className="p-2 text-right">Bags</th>
                    <th className="p-2 text-right">Weight (lbs)</th>
                    <th className="p-2 text-left">Location</th>
                    <th className="p-2 text-left">Notes</th>
                    <th className="p-2 text-center">Date</th>
                    <th className="p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPallets.map((p) => (
                    <tr
                      key={p.pallet_id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-2 font-semibold">{p.pallet_id}</td>
                      <td className="p-2">
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={p.lot_number}
                          onChange={(e) =>
                            updatePallet(p.pallet_id, "lot_number", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={p.product}
                          onChange={(e) =>
                            updatePallet(p.pallet_id, "product", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={p.supplier || ""}
                          onChange={(e) =>
                            updatePallet(p.pallet_id, "supplier", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={p.bag_type}
                          onChange={(e) =>
                            updatePallet(p.pallet_id, "bag_type", e.target.value)
                          }
                          className="border rounded px-2 py-1 bg-white"
                        >
                          {bagTypes.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          className="w-20 border rounded px-2 py-1 text-right"
                          value={p.num_bags}
                          onChange={(e) =>
                            updatePallet(p.pallet_id, "num_bags", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          className="w-24 border rounded px-2 py-1 text-right"
                          value={p.total_weight}
                          onChange={(e) =>
                            updatePallet(
                              p.pallet_id,
                              "total_weight",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={p.storage_location}
                          onChange={(e) =>
                            updatePallet(
                              p.pallet_id,
                              "storage_location",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={p.notes || ""}
                          onChange={(e) =>
                            updatePallet(p.pallet_id, "notes", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 text-center text-gray-700">
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => deletePallet(p.pallet_id)}
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
  );
}
