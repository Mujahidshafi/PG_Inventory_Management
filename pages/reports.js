import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    year: "",
    supplier: "",
    processType: "Qsage",
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteYear, setDeleteYear] = useState("");

  useEffect(() => {
    fetchReports();
  }, [filters.processType]);

  async function fetchReports() {
    setLoading(true);

    // --- Fetch Qsage, Sortex, and Mixing reports together ---
    const [qsageData, sortexData, mixingData] = await Promise.all([
      supabase.from("qsage_reports").select("*"),
      supabase.from("sortex_reports").select("*"),
      supabase.from("mixing_reports").select("*"),
    ]);

    if (qsageData.error) console.error("Qsage fetch error:", qsageData.error.message);
    if (sortexData.error) console.error("Sortex fetch error:", sortexData.error.message);
    if (mixingData.error) console.error("Mixing fetch error:", mixingData.error.message);

    // Combine and sort newest first
    const combined = [
      ...(qsageData.data || []),
      ...(sortexData.data || []),
      ...(mixingData.data || []),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Filter by process type if needed
    const filteredByType =
      filters.processType && filters.processType !== "All"
        ? combined.filter((r) => r.process_type === filters.processType)
        : combined;

    setReports(filteredByType);
    setLoading(false);
  }


  const filteredReports = reports.filter((r) => {
    const term = filters.search.toLowerCase();
    const searchMatch =
      r.process_id?.toLowerCase().includes(term) ||
      r.lot_numbers?.toLowerCase().includes(term) ||
      r.products?.toLowerCase().includes(term);

    const supplierMatch = filters.supplier
      ? r.suppliers?.toLowerCase().includes(filters.supplier.toLowerCase())
      : true;

    const yearMatch = filters.year
      ? new Date(r.created_at).getFullYear().toString() === filters.year
      : true;

    return searchMatch && supplierMatch && yearMatch;
  });

  // --- Bulk delete selected reports ---
  async function handleDeleteSelected() {
  if (selectedReports.length === 0) return;
  if (!confirm(`Delete ${selectedReports.length} selected report(s)?`)) return;
  setDeleting(true);

  // Separate selected keys by process type
  const qsageIds = selectedReports
    .filter((k) => k.startsWith("Qsage-"))
    .map((k) => Number(k.split("-")[1]));
  const sortexIds = selectedReports
    .filter((k) => k.startsWith("Sortex-"))
    .map((k) => Number(k.split("-")[1]));
  const mixingIds = selectedReports
    .filter((k) => k.startsWith("Mixing-"))
    .map((k) => Number(k.split("-")[1]));

  // Delete from each table
  const [qDel, sDel, mDel] = await Promise.all([
    qsageIds.length
      ? supabase.from("qsage_reports").delete().in("id", qsageIds)
      : { error: null },
    sortexIds.length
      ? supabase.from("sortex_reports").delete().in("id", sortexIds)
      : { error: null },
    mixingIds.length
      ? supabase.from("mixing_reports").delete().in("id", mixingIds)
      : { error: null },
  ]);

  if (qDel.error || sDel.error || mDel.error) {
    alert(
      "Error deleting reports: " +
        (qDel.error?.message || sDel.error?.message || mDel.error?.message)
    );
  } else {
    alert("Reports deleted successfully!");
    setReports((prev) =>
      prev.filter((r) => !selectedReports.includes(`${r.process_type}-${r.id}`))
    );
    setSelectedReports([]);
  }

  setDeleting(false);
}

  // --- Delete by year ---
  async function handleDeleteByYear() {
    if (!deleteYear) return alert("Please enter a year to delete.");
    if (
      !confirm(
        `Delete ALL reports from year ${deleteYear}? This cannot be undone.`
      )
    )
      return;

    setDeleting(true);
    const { error } = await supabase.rpc("delete_reports_by_year", {
      target_year: parseInt(deleteYear),
    });
    setDeleting(false);

    if (error) {
      // fallback if no RPC
      console.warn("RPC not found; deleting manually.");
      const [qDelete, sDelete, mDelete] = await Promise.all([
        supabase
          .from("qsage_reports")
          .delete()
          .gte("created_at", `${deleteYear}-01-01`)
          .lte("created_at", `${deleteYear}-12-31`),
        supabase
          .from("sortex_reports")
          .delete()
          .gte("created_at", `${deleteYear}-01-01`)
          .lte("created_at", `${deleteYear}-12-31`),
        supabase
          .from("mixing_reports")
          .delete()
          .gte("created_at", `${deleteYear}-01-01`)
          .lte("created_at", `${deleteYear}-12-31`),
      ]);

        if (qDelete.error || sDelete.error)
        alert("Error deleting by year: " + (qDelete.error?.message || sDelete.error?.message));
        else {
        alert(`Reports from ${deleteYear} deleted.`);
        fetchReports();
        }
    } else {
      alert(`Reports from ${deleteYear} deleted.`);
      fetchReports();
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Process Reports
        </h1>

        {/* 🔹 Filter Controls */}
        <div className="flex flex-wrap gap-3 items-end mb-6">
          <input
            type="text"
            placeholder="Search by Process ID, Lot #, or Product"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="border rounded-lg px-3 py-2 flex-1 min-w-[240px]"
          />

          <input
            type="number"
            placeholder="Year"
            value={filters.year}
            onChange={(e) =>
              setFilters((f) => ({ ...f, year: e.target.value }))
            }
            className="border rounded-lg px-3 py-2 w-32"
          />

          <input
            type="text"
            placeholder="Supplier"
            value={filters.supplier}
            onChange={(e) =>
              setFilters((f) => ({ ...f, supplier: e.target.value }))
            }
            className="border rounded-lg px-3 py-2 w-48"
          />

          <select
            value={filters.processType}
            onChange={(e) =>
                setFilters((f) => ({ ...f, processType: e.target.value }))
            }
            className="border rounded-lg px-3 py-2 w-48 bg-white"
            >
            <option value="All">All Processes</option>
            <option value="Qsage">Qsage</option>
            <option value="Sortex">Sortex</option>
            <option value="Mixing">Mixing</option>
          </select>

          <button
            onClick={fetchReports}
            className="bg-black text-white rounded-lg px-4 py-2"
          >
            Refresh
          </button>
        </div>

        {/* 🔹 Delete Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button
            disabled={selectedReports.length === 0 || deleting}
            onClick={handleDeleteSelected}
            className={`px-4 py-2 rounded-lg text-white ${
              selectedReports.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {deleting
              ? "Deleting..."
              : `Delete Selected (${selectedReports.length})`}
          </button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Year (e.g. 2023)"
              value={deleteYear}
              onChange={(e) => setDeleteYear(e.target.value)}
              className="border rounded-lg px-3 py-2 w-32"
            />
            <button
              disabled={!deleteYear || deleting}
              onClick={handleDeleteByYear}
              className={`px-4 py-2 rounded-lg text-white ${
                !deleteYear
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-700 hover:bg-red-800"
              }`}
            >
              Delete by Year
            </button>
          </div>
        </div>

        {/* 🔹 Reports Table */}
{loading ? (
  <p className="text-center text-gray-600">Loading reports...</p>
) : filteredReports.length === 0 ? (
  <p className="text-center text-gray-500">No reports found.</p>
) : (
  <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
    <table className="w-full text-sm table-auto">
      <thead className="bg-gray-50 border-b text-gray-700">
        <tr>
          <th className="px-4 py-2 text-center">Select</th>
          <th className="px-4 py-2 text-left">Process ID</th>
          <th className="px-4 py-2 text-left">Process Type</th>
          <th className="px-4 py-2 text-left">Lot Numbers</th>
          <th className="px-4 py-2 text-left">Products</th>
          <th className="px-4 py-2 text-left">Supplier</th>
          <th className="px-4 py-2 text-right">Output Total (lbs)</th>
          <th className="px-4 py-2 text-center">Date</th>
        </tr>
      </thead>
      <tbody>
        {filteredReports.map((r) => {
          const key = `${r.process_type}-${r.id}`;
          return (
            <tr
              key={key}
              onClick={(e) => {
                if (e.target.type !== "checkbox") setSelectedReport(r);
              }}
              className="border-t hover:bg-gray-100 transition cursor-pointer"
            >
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={selectedReports.includes(key)}
                  onChange={(e) => {
                    setSelectedReports((prev) =>
                      e.target.checked
                        ? [...prev, key]
                        : prev.filter((i) => i !== key)
                    );
                  }}
                />
              </td>
              <td className="px-4 py-2">{r.process_id}</td>
              <td className="px-4 py-2">{r.process_type}</td>
              <td className="px-4 py-2">{r.lot_numbers || "—"}</td>
              <td className="px-4 py-2">{r.products || "—"}</td>
              <td className="px-4 py-2">{r.suppliers || "—"}</td>
              <td className="px-4 py-2 text-right">
                {Number(r.output_total || 0).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-center">
                {new Date(r.created_at).toLocaleDateString()}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}

        {selectedReport && (
          <ReportModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
          />
        )}
      </div>
    </div>
  );
}

/* ================================================================
   MODAL: STRUCTURED VIEW FOR QSAGE REPORT
================================================================= */

function ReportModal({ report, onClose }) {
  const inbound = safeParse(report.inbound_boxes);
  const outputs = safeParse(report.outputs);
  const totals = safeParse(report.totals);
  const boxes = safeParse(report.boxes); // for Mixing reports

  function safeParse(json) {
    try {
      return typeof json === "string" ? JSON.parse(json) : json || {};
    } catch {
      return {};
    }
  }

  // Handle special layout for Mixing Reports
  const isMixing = report.process_type === "Mixing";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-5xl w-full relative shadow-xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold">
            {isMixing
              ? `Mixing Process Report — ${report.process_id}`
              : `Qsage Process Report — ${report.process_id}`}
          </h2>
          <button
            className="text-gray-500 hover:text-black text-2xl"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-4 flex-1">
          {/* Common Summary Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
            <p><strong>Process Type:</strong> {report.process_type}</p>
            <p><strong>Process ID:</strong> {report.process_id}</p>
            <p><strong>Date:</strong> {new Date(report.created_at).toLocaleString()}</p>
            {isMixing ? (
              <p><strong>Bin Used:</strong> {report.co2_bin}</p>
            ) : (
              <p><strong>Supplier:</strong> {report.suppliers || "—"}</p>
            )}
            <p><strong>Lot Numbers:</strong> {report.lot_numbers}</p>
            <p><strong>Products:</strong> {report.products}</p>
            <p><strong>Notes:</strong> {report.notes || "—"}</p>
          </div>

          {/* --- MIXING REPORT LAYOUT --- */}
          {isMixing ? (
            <>
              <h3 className="font-semibold text-lg mb-2">Boxes Used in Mix</h3>
              {Array.isArray(boxes) && boxes.length > 0 ? (
                <table className="w-full text-sm border mb-6">
                  <thead className="bg-gray-50 text-center">
                    <tr>
                      <th className="p-2">Box ID</th>
                      <th className="p-2">Product</th>
                      <th className="p-2">Lot #</th>
                      <th className="p-2">Original Weight (lbs)</th>
                      <th className="p-2">New Box Weight (lbs)</th>
                      <th className="p-2">Input Weight (lbs)</th>
                      <th className="p-2">Partial?</th>
                      <th className="p-2">New Location</th>
                    </tr>
                  </thead>
                  <tbody className="text-center">
                    {boxes.map((b, i) => {
                      const original = Number(b.Original_Weight) || 0;
                      const newWeight = Number(b.New_Box_Weight) || 0;
                      const inputWeight = b.IsPartial
                        ? Math.max(original - newWeight, 0)
                        : original;
                      return (
                        <tr key={i} className="border-t">
                          <td className="p-2">{b.Box_ID}</td>
                          <td className="p-2">{b.Product}</td>
                          <td className="p-2">{b.Lot_Number}</td>
                          <td className="p-2">{original.toLocaleString()}</td>
                          <td className="p-2">{newWeight.toLocaleString()}</td>
                          <td className="p-2 font-medium text-blue-700">{inputWeight.toLocaleString()}</td>
                          <td className="p-2">{b.IsPartial ? "Yes" : "No"}</td>
                          <td className="p-2">{b.NewLocation || b.Location || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm italic text-gray-500">No boxes recorded in this mix.</p>
              )}

              <div className="text-right font-semibold text-base mt-2">
                Total Weight Added to Bin:{" "}
                <span className="text-green-700">
                  {Number(report.total_weight || 0).toLocaleString()} lbs
                </span>
              </div>
            </>
          ) : (
            <>
              {/* --- Default Qsage/Sortex Layout --- */}
              <h3 className="font-semibold text-lg mb-2">Totals</h3>
              <table className="w-full text-sm border mb-6">
                <thead className="bg-gray-50 text-center">
                  <tr>
                    <th className="p-2">Input</th>
                    <th className="p-2">Output</th>
                    <th className="p-2">Clean</th>
                    <th className="p-2">Rerun</th>
                    <th className="p-2">Screenings</th>
                    <th className="p-2">Trash</th>
                    <th className="p-2">Balance</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  <tr>
                    <td className="p-2">{report.input_total}</td>
                    <td className="p-2">{report.output_total}</td>
                    <td className="p-2">{report.clean_total}</td>
                    <td className="p-2">{report.rerun_total}</td>
                    <td className="p-2">{report.screenings_total}</td>
                    <td className="p-2">{report.trash_total}</td>
                    <td className="p-2">{report.balance}</td>
                  </tr>
                </tbody>
              </table>

              <Section title="Inbound Boxes" data={inbound} />
              <Section title="Outputs" data={outputs} />
              <Section title="Totals (Detailed)" data={totals} />
            </>
          )}

          <div className="mt-6 flex justify-end">
            <button
              className="bg-black text-white px-4 py-2 rounded-lg"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



function Section({ title, data }) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="mb-4">
          <h4 className="font-medium capitalize mb-1 text-gray-700">
            {key.replace(/_/g, " ")}
          </h4>
          {typeof value === "object" && Array.isArray(value) ? (
            <table className="w-full text-xs border mb-2">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(value[0] || {}).map((k) => (
                    <th key={k} className="p-1 text-left capitalize border-b">
                      {k.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {value.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="p-1 text-left">
                        {String(v || "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : typeof value === "object" ? (
            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto border">
              {JSON.stringify(value, null, 2)}
            </pre>
          ) : (
            <p className="text-sm">{String(value)}</p>
          )}
        </div>
      ))}
    </div>
  );
}