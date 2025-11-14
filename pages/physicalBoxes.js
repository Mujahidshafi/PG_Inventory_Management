import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Layout from "../components/layout";

export default function PhysicalBoxes() {
  const supabase = useSupabaseClient();
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ physical_box_id: "", weight: "" });
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);

  // Load boxes
  const fetchBoxes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("physical_boxes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to load boxes." });
    } else {
      setBoxes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBoxes();
  }, []);

  // Add or update a box
  const handleSave = async (e) => {
    e.preventDefault();
    const { physical_box_id, weight } = form;

    if (!physical_box_id.trim() || !weight) {
      setMessage({ type: "error", text: "Please fill all fields." });
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("physical_boxes")
        .update({
          physical_box_id: physical_box_id.trim(),
          weight: Number(weight),
        })
        .eq("id", editingId);

      if (error) {
        setMessage({ type: "error", text: "Error updating box: " + error.message });
      } else {
        setMessage({ type: "success", text: "Box updated successfully!" });
        setEditingId(null);
        setForm({ physical_box_id: "", weight: "" });
        fetchBoxes();
      }
    } else {
      const { error } = await supabase.from("physical_boxes").insert([
        {
          physical_box_id: physical_box_id.trim(),
          weight: Number(weight),
        },
      ]);

      if (error) {
        setMessage({ type: "error", text: "Error adding box: " + error.message });
      } else {
        setMessage({ type: "success", text: "Box added successfully!" });
        setForm({ physical_box_id: "", weight: "" });
        fetchBoxes();
      }
    }
  };

  // Edit box
  const handleEdit = (box) => {
    setEditingId(box.id);
    setForm({ physical_box_id: box.physical_box_id, weight: box.weight });
  };

  // Delete box
  const handleDelete = async (id) => {
    if (!confirm("Delete this physical box?")) return;

    const { error } = await supabase.from("physical_boxes").delete().eq("id", id);

    if (error) {
      setMessage({ type: "error", text: "Error deleting box: " + error.message });
    } else {
      setMessage({ type: "success", text: "Box deleted successfully!" });
      fetchBoxes();
    }
  };

  // Filter by search
  const filteredBoxes = boxes.filter((b) =>
    b.physical_box_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Physical Boxes" showBack>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Physical Box Management</h1>

        {/* Message */}
        {message && (
          <div
            className={`p-3 mb-4 rounded ${
              message.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Add/Edit Form */}
        <form
          onSubmit={handleSave}
          className="flex flex-wrap gap-3 items-end border rounded-lg bg-white shadow-sm p-4 mb-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Physical Box ID
            </label>
            <input
              type="text"
              value={form.physical_box_id}
              onChange={(e) => setForm({ ...form, physical_box_id: e.target.value })}
              placeholder="e.g., PB-12"
              className="border rounded px-3 py-2 w-48"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Weight (lbs)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              placeholder="e.g., 17.5"
              className="border rounded px-3 py-2 w-40"
            />
          </div>

          <button
            type="submit"
            className="bg-[#5D1214] text-white px-4 py-2 rounded hover:bg-[#3D5147]"
          >
            {editingId ? "Update Box" : "Add Box"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ physical_box_id: "", weight: "" });
              }}
              className="ml-2 px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </form>

        {/* Search Bar */}
        <div className="flex justify-between items-center mb-3">
          <input
            type="text"
            placeholder="Search by Box ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded bg-white px-3 py-2 w-64"
          />
          <p className="text-sm text-gray-500">
            Showing {filteredBoxes.length} of {boxes.length}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-2 border-b">Box ID</th>
                <th className="p-2 border-b">Weight (lbs)</th>
                <th className="p-2 border-b">Date Added</th>
                <th className="p-2 border-b w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredBoxes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    No boxes found.
                  </td>
                </tr>
              ) : (
                filteredBoxes.map((box) => (
                  <tr key={box.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 font-mono">{box.physical_box_id}</td>
                    <td className="p-2">{box.weight}</td>
                    <td className="p-2">
                      {box.created_at
                        ? new Date(box.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-2 space-x-2">
                      <button
                        onClick={() => handleEdit(box)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(box.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
