import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/layout";

export default function ManageCo2Tanks() {
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTank, setNewTank] = useState({
    co2_bin: "",
    process_id: "",
    lot_numbers: "",
    products: "",
    total_weight: "",
    notes: "",
    boxes: [],
  });
  const [statusMsg, setStatusMsg] = useState("");

  // Load tanks
  useEffect(() => {
    const loadTanks = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("inside_co2_bins")
          .select("*")
          .order("co2_bin", { ascending: true });
        if (error) throw error;
        setTanks(data || []);
      } catch (err) {
        console.error(err);
        setStatusMsg("Error loading CO₂ tanks.");
      } finally {
        setLoading(false);
      }
    };
    loadTanks();
  }, []);

  // Add tank
  const addTank = async () => {
    if (!newTank.co2_bin.trim()) {
      alert("Tank name (co2_bin) is required.");
      return;
    }
    try {
      const { error } = await supabase.from("inside_co2_bins").insert([
        {
          co2_bin: newTank.co2_bin,
          process_id: newTank.process_id || "N/A",
          lot_numbers:
            newTank.lot_numbers?.split(",").map((s) => s.trim()) || [],
          products: newTank.products?.split(",").map((s) => s.trim()) || [],
          total_weight: Number(newTank.total_weight) || 0,
          notes: newTank.notes || null,
          boxes: newTank.boxes || [],
        },
      ]);
      if (error) throw error;

      setTanks((prev) => [...prev, newTank]);
      setNewTank({
        co2_bin: "",
        process_id: "",
        lot_numbers: "",
        products: "",
        total_weight: "",
        notes: "",
        boxes: [],
      });
    } catch (err) {
      alert("Error adding tank: " + err.message);
    }
  };

  // Update tank
  const updateTank = async (bin, field, value) => {
    try {
      const { error } = await supabase
        .from("inside_co2_bins")
        .update({ [field]: value })
        .eq("co2_bin", bin);
      if (error) throw error;

      setTanks((prev) =>
        prev.map((t) => (t.co2_bin === bin ? { ...t, [field]: value } : t))
      );
    } catch (err) {
      alert("Error updating tank: " + err.message);
    }
  };

  // Delete tank
  const deleteTank = async (bin) => {
    if (!confirm(`Delete CO₂ tank ${bin}?`)) return;
    try {
      const { error } = await supabase
        .from("inside_co2_bins")
        .delete()
        .eq("co2_bin", bin);
      if (error) throw error;
      setTanks((prev) => prev.filter((t) => t.co2_bin !== bin));
    } catch (err) {
      alert("Error deleting tank: " + err.message);
    }
  };

  return (
    <Layout title="Inside CO₂ Tank Management" showBack={true}>
    <div className="bg-[#D9D9D9] h-full p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {loading ? (
          <p className="text-center text-gray-500">Loading tanks...</p>
        ) : (
          <>
            {/* Add new tank */}
            <section className="bg-white border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Add New CO₂ Tank</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="CO₂ Bin (e.g., Co2-3)"
                  value={newTank.co2_bin}
                  onChange={(e) =>
                    setNewTank({ ...newTank, co2_bin: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Process ID"
                  value={newTank.process_id}
                  onChange={(e) =>
                    setNewTank({ ...newTank, process_id: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Lot Numbers (comma separated)"
                  value={newTank.lot_numbers}
                  onChange={(e) =>
                    setNewTank({ ...newTank, lot_numbers: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Products (comma separated)"
                  value={newTank.products}
                  onChange={(e) =>
                    setNewTank({ ...newTank, products: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Total Weight (lbs)"
                  value={newTank.total_weight}
                  onChange={(e) =>
                    setNewTank({ ...newTank, total_weight: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={newTank.notes}
                  onChange={(e) =>
                    setNewTank({ ...newTank, notes: e.target.value })
                  }
                  className="border rounded-lg px-3 py-2"
                />
              </div>
              <div className="mt-4">
                <button
                  onClick={addTank}
                  className="bg-[#5D1214] text-white px-5 py-2 rounded-lg hover:opacity-90"
                >
                  Add Tank
                </button>
              </div>
            </section>

            {/* Existing tanks */}
            <section className="bg-white border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">
                Existing CO₂ Tanks
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-2 text-left">CO₂ Bin</th>
                      <th className="p-2 text-left">Process ID</th>
                      <th className="p-2 text-left">Lot Numbers</th>
                      <th className="p-2 text-left">Products</th>
                      <th className="p-2 text-right">Weight (lbs)</th>
                      <th className="p-2 text-left">Notes</th>
                      <th className="p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tanks.map((t) => (
                      <tr key={t.co2_bin} className="border-t hover:bg-gray-50">
                        <td className="p-2 font-medium">{t.co2_bin}</td>
                        <td className="p-2">
                          <input
                            className="w-full border rounded px-2 py-1"
                            value={t.process_id || ""}
                            onChange={(e) =>
                              updateTank(t.co2_bin, "process_id", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-full border rounded px-2 py-1"
                            value={t.lot_numbers?.join(", ") || ""}
                            onChange={(e) =>
                              updateTank(
                                t.co2_bin,
                                "lot_numbers",
                                e.target.value.split(",").map((s) => s.trim())
                              )
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-full border rounded px-2 py-1"
                            value={t.products?.join(", ") || ""}
                            onChange={(e) =>
                              updateTank(
                                t.co2_bin,
                                "products",
                                e.target.value.split(",").map((s) => s.trim())
                              )
                            }
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            className="w-24 border rounded px-2 py-1 text-right"
                            value={t.total_weight}
                            onChange={(e) =>
                              updateTank(
                                t.co2_bin,
                                "total_weight",
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-full border rounded px-2 py-1"
                            value={t.notes || ""}
                            onChange={(e) =>
                              updateTank(t.co2_bin, "notes", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => deleteTank(t.co2_bin)}
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
            </section>
          </>
        )}
      </div>
    </div>
    </Layout>
  );
}
