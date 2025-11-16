import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/layout";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    year: "",
    supplier: "",
    processType: "All",
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
    const [qsageData, sortexData, mixingData, baggingData, orderData, spiralData,] = await Promise.all([
      supabase.from("qsage_reports").select("*"),
      supabase.from("sortex_reports").select("*"),
      supabase.from("mixing_reports").select("*"),
      supabase.from("bagging_reports").select("*"),
      supabase.from("order_fulfillment_reports").select("*"),
      supabase.from("spiral_reports").select("*"),

    ]);

    if (qsageData.error) console.error("Qsage fetch error:", qsageData.error.message);
    if (sortexData.error) console.error("Sortex fetch error:", sortexData.error.message);
    if (mixingData.error) console.error("Mixing fetch error:", mixingData.error.message);
    if (baggingData.error) console.error("Bagging fetch error:", baggingData.error.message);
    if (orderData.error)   console.error("Order fetch error:", orderData.error.message);
    if (spiralData.error)  console.error("Spiral fetch error:", spiralData.error.message);

    // Combine and sort newest first
    const combined = [
      ...(qsageData.data || []),
      ...(sortexData.data || []),
      ...(mixingData.data || []),
      ...(baggingData.data || []),
      ...(orderData.data || []),
      ...(spiralData.data  || []),
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
    const normalize = (val) =>
      Array.isArray(val) ? val.join(", ").toLowerCase() : (val || "").toLowerCase();

    const searchMatch =
      normalize(r.process_id).includes(term) ||
      normalize(r.lot_numbers).includes(term) ||
      normalize(r.products).includes(term);

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
    const qsageIds = selectedReports.filter(k => k.startsWith("Qsage-")) .map(k => Number(k.split("-")[1]));
    const sortexIds = selectedReports.filter(k => k.startsWith("Sortex-")).map(k => Number(k.split("-")[1]));
    const mixingIds = selectedReports.filter(k => k.startsWith("Mixing-")).map(k => Number(k.split("-")[1]));
    const orderIds  = selectedReports.filter(k => k.startsWith("Order Fulfillment-")).map(k => Number(k.split("-")[1]));
    const spiralIds = selectedReports.filter(k => k.startsWith("Spiral-")).map(k => Number(k.split("-")[1]));

    // Delete from each table
    const [qDel, sDel, mDel, oDel, spDel] = await Promise.all([
      qsageIds.length  ? supabase.from("qsage_reports").delete().in("id", qsageIds)   : { error: null },
      sortexIds.length ? supabase.from("sortex_reports").delete().in("id", sortexIds) : { error: null },
      mixingIds.length ? supabase.from("mixing_reports").delete().in("id", mixingIds) : { error: null },
      orderIds.length  ? supabase.from("order_fulfillment_reports").delete().in("id", orderIds) : { error: null },
      spiralIds.length ? supabase.from("spiral_reports").delete().in("id", spiralIds) : { error: null },
    ]);

    if (qDel.error || sDel.error || mDel.error || oDel.error || spDel.error) {
      alert(
        "Error deleting reports: " +
        (qDel.error?.message || sDel.error?.message || mDel.error?.message || oDel.error?.message || spDel.error?.message)
      );
    } else {
      alert("Reports deleted successfully!");
      setReports(prev => prev.filter(r => !selectedReports.includes(`${r.process_type}-${r.id}`)));
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
        supabase
          .from("bagging_reports")
          .delete()
          .gte("created_at", `${deleteYear}-01-01`)
          .lte("created_at", `${deleteYear}-12-31`),
          supabase
          .from("order_fulfillment_reports")
          .delete()
          .gte("created_at", `${deleteYear}-01-01`)
          .lte("created_at", `${deleteYear}-12-31`),
          supabase
          .from("spiral_reports")
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
    <Layout title="Process Reports" showBack={true}> 
    <div className="bg-[#D9D9D9] p-6 overflow-y-auto h-full">
      <div className="mx-auto max-w-7xl">

        {/* 🔹 Filter Controls */}
        <div className="flex flex-wrap gap-3 items-end mb-6">
          <input
            type="text"
            placeholder="Search by Process ID, Lot #, or Product"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="border rounded-lg px-3 py-2 flex-1 bg-white min-w-[240px]"
          />

          <input
            type="number"
            placeholder="Year"
            value={filters.year}
            onChange={(e) =>
              setFilters((f) => ({ ...f, year: e.target.value }))
            }
            className="border rounded-lg bg-white px-3 py-2 w-32"
          />

          <input
            type="text"
            placeholder="Supplier"
            value={filters.supplier}
            onChange={(e) =>
              setFilters((f) => ({ ...f, supplier: e.target.value }))
            }
            className="border rounded-lg bg-white px-3 py-2 w-48"
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
            <option value="Spiral">Spiral</option>
            <option value="Sortex">Sortex</option>
            <option value="Mixing">Mixing</option>
            <option value="Bagging">Bagging</option>
            <option value="Order Fulfillment">Order Fulfillment</option>
            
          </select>

          <button
            onClick={fetchReports}
            className="bg-[#3D5147] text-white rounded-lg px-4 py-2"
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
                : "bg-[#5D1214] hover:bg-red-950"
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
              className="border rounded-lg bg-white px-3 py-2 w-32"
            />
            <button
              disabled={!deleteYear || deleting}
              onClick={handleDeleteByYear}
              className={`px-4 py-2 rounded-lg text-white ${
                !deleteYear
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#5D1214] hover:bg-red-950"
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
          <th className="px-4 py-2 text-left">Employee</th>
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
              <td className="px-4 py-2">{r.employee || "—"}</td>
              <td className="px-4 py-2">{r.lot_numbers || "—"}</td>
              <td className="px-4 py-2">{r.products || "—"}</td>
              <td className="px-4 py-2">{r.supplier || r.suppliers || "—"}</td>
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
    </Layout>
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
  const inputs = safeParse(report.inputs);

  function safeParse(json) {
    try {
      return typeof json === "string" ? JSON.parse(json) : json || {};
    } catch {
      return {};
    }
  }

  // Handle special layout for Mixing Reports
  const isMixing = report.process_type === "Mixing";
  const isBagging = report.process_type === "Bagging";
  const isOrderFulfillment = report.process_type === "Order Fulfillment";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-5xl w-full relative shadow-xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold">
            {report.process_type
              ? `${report.process_type} Process Report — ${report.process_id || "N/A"}`
              : `Process Report — ${report.id}`}
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
            <p><strong>Employee:</strong> {report.employee || "—"}</p>
            <p><strong>Date:</strong> {new Date(report.created_at).toLocaleString()}</p>
            {isMixing ? (
              <p><strong>Bin Used:</strong> {report.co2_bin}</p>
            ) : (
              <p><strong>Supplier:</strong> {report.supplier || report.suppliers || "—"}</p>
            )}
            <p><strong>Customer:</strong> {report.customer || "—"}</p>
            <p><strong>Lot Numbers:</strong> {report.lot_numbers}</p>
            <p><strong>Products:</strong> {report.products}</p>
            <p><strong>Notes:</strong> {report.notes || "—"}</p>
          </div>

          {isBagging ? (
          <>
            <h3 className="font-semibold text-lg mb-2">Inputs</h3>
            {inputs && inputs.boxes?.length > 0 ? (
              <table className="w-full text-sm border mb-6">
                <thead className="bg-gray-50 text-center">
                  <tr>
                    <th className="p-2">Source</th>
                    <th className="p-2">Box ID</th>
                    <th className="p-2">Product</th>
                    <th className="p-2">Lot #</th>
                    <th className="p-2">Weight (lbs)</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {inputs.boxes.map((b, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{b.sourceTable || "—"}</td>
                      <td className="p-2">{b.boxId || "—"}</td>
                      <td className="p-2">{b.product || "—"}</td>
                      <td className="p-2">{b.lotNumber || "—"}</td>
                      <td className="p-2">{b.amount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm italic text-gray-500">No input boxes recorded.</p>
            )}

            {/* 🔹 CO2 Draws Section */}
            {inputs?.co2_draws?.length > 0 && (
              <>
                <h4 className="font-semibold text-md mb-2 mt-4 text-gray-700">
                  CO₂ Tank Inputs
                </h4>
                <table className="w-full text-sm border mb-6">
                  <thead className="bg-gray-50 text-center">
                    <tr>
                      <th className="p-2">CO₂ Bin</th>
                      <th className="p-2">Product(s)</th>
                      <th className="p-2">Lot Number(s)</th>
                      <th className="p-2">Amount Removed (lbs)</th>
                    </tr>
                  </thead>
                  <tbody className="text-center">
                    {inputs.co2_draws.map((draw, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{draw.co2_bin || "—"}</td>
                        <td className="p-2">
                          {Array.isArray(draw.products)
                            ? draw.products.join(", ")
                            : draw.products || "—"}
                        </td>
                        <td className="p-2">
                          {Array.isArray(draw.lotNumbers)
                            ? draw.lotNumbers.join(", ")
                            : draw.lot_numbers || draw.lotNumbers || "—"}
                        </td>
                        <td className="p-2">
                          {draw.weightLbs ?? draw.amount_removed ?? draw.amount ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <h3 className="font-semibold text-lg mb-2 mt-4">Outputs (Pallets)</h3>
            {Array.isArray(report.outputs) && report.outputs.length > 0 ? (
              <table className="w-full text-sm border mb-6">
                <thead className="bg-gray-50 text-center">
                  <tr>
                    <th className="p-2">Pallet ID</th>
                    <th className="p-2">Product</th>
                    <th className="p-2">Bag Type</th>
                    <th className="p-2">Bags</th>
                    <th className="p-2">Weight (lbs)</th>
                    <th className="p-2">Location</th>
                    <th className="p-2">Created</th> {/* NEW */}
                  </tr>
                </thead>
                <tbody className="text-center">
                  {report.outputs.map((p, i) => {
                    const created =
                      p.created_at || p.createdAt || p.date || p.timestamp || p.Date_Created || null;
                    return (
                      <tr key={i} className="border-t">
                        <td className="p-2">{p.pallet_id}</td>
                        <td className="p-2">{p.product}</td>
                        <td className="p-2">{p.bag_type}</td>
                        <td className="p-2">{p.num_bags}</td>
                        <td className="p-2">{p.total_weight}</td>
                        <td className="p-2">{p.storage_location}</td>
                        <td className="p-2">{created ? new Date(created).toLocaleString() : "—"}</td> {/* NEW */}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-sm italic text-gray-500">No pallet data recorded.</p>
            )}

          </>
        ) : null}

        {/* --- Orders REPORT LAYOUT --- */}
        {isOrderFulfillment ? (
          <>
            <h3 className="font-semibold text-lg mb-2">Fulfilled Items</h3>
            {Array.isArray(report.items) && report.items.length > 0 ? (
              <table className="w-full text-sm border mb-6">
                <thead className="bg-gray-50 text-center">
                  <tr>
                    <th className="p-2">Source Type</th>
                    <th className="p-2">Identifier</th>
                    <th className="p-2">Lot Numbers</th>
                    <th className="p-2">Products</th>
                    <th className="p-2">Supplier</th>
                    <th className="p-2">Available (lbs)</th>
                    <th className="p-2">Removed (lbs)</th>
                    <th className="p-2">Partial?</th>
                    <th className="p-2">Remaining (lbs)</th>
                    <th className="p-2">Scanned</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {report.items.map((item, i) => {
                    // pick the first available timestamp field
                    const rawScanned =
                      item.scannedAt ??
                      item.scanned_at ??
                      item.added_at ??
                      item.timestamp ??
                      item.date ??
                      null;

                    // safely parse date
                    const scannedDate = rawScanned ? new Date(rawScanned) : null;
                    const scannedStr =
                      scannedDate && !Number.isNaN(scannedDate.getTime())
                        ? scannedDate.toLocaleString()
                        : "—";

                    // safe number formatting
                    const fmtNum = (v) =>
                      v === "" || v == null ? "0" : Number(v).toLocaleString();

                    return (
                      <tr key={i} className="border-t">
                        <td className="p-2 capitalize">{item.sourceType || "—"}</td>
                        <td className="p-2">{item.identifier || "—"}</td>
                        <td className="p-2">{item.lotNumbers || "—"}</td>
                        <td className="p-2">{item.products || "—"}</td>
                        <td className="p-2">{item.supplier || "—"}</td>
                        <td className="p-2">{fmtNum(item.availableWeight)}</td>
                        <td className="p-2 font-semibold text-blue-700">
                          {fmtNum(item.removeWeight)}
                        </td>
                        <td className="p-2">{item.isPartial ? "Yes" : "No"}</td>
                        <td className="p-2">{fmtNum(item.newRemainingWeight)}</td>
                        <td className="p-2">{scannedStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-sm italic text-gray-500">No fulfillment items recorded.</p>
            )}


            <div className="text-right font-semibold text-base mt-2">
              Total Weight Fulfilled:{" "}
              <span className="text-green-700">
                {Number(report.total_weight || 0).toLocaleString()} lbs
              </span>
            </div>
          </>
        ) : null}



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
              {(() => {
                // show only columns that exist on the report
                const cols = [
                  ["Input",        "input_total"],
                  ["Output",       "output_total"],
                  ["Clean",        "clean_total"],
                  ["Rerun",        "rerun_total"],      // Spiral likely misses this
                  ["Screenings",   "screenings_total"],
                  ["Trash",        "trash_total"],      // Spiral likely misses this
                  ["Balance",      "balance"],
                ].filter(([, key]) => report[key] !== undefined);

                return (
                  <table className="w-full text-sm border mb-6">
                    <thead className="bg-gray-50 text-center">
                      <tr>{cols.map(([label]) => <th key={label} className="p-2">{label}</th>)}</tr>
                    </thead>
                    <tbody className="text-center">
                      <tr>
                        {cols.map(([, key]) => (
                          <td key={key} className="p-2">
                            {String(report[key] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                );
              })()}

              <InboundSection inbound={inbound} />
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

  // 🧩 Handle array-type data (like inbound boxes)
  if (Array.isArray(data)) {
    return (
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <table className="w-full text-xs border mb-2">
          <thead className="bg-gray-50 text-center">
            <tr>
              {Object.keys(data[0] || {}).map((k) => (
                <th key={k} className="p-1 capitalize">
                  {k.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-center">
            {data.map((row, i) => (
              <tr key={i} className="border-t">
                {Object.values(row).map((v, j) => (
                  <td key={j} className="p-1">
                    {String(v ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // --- Enhanced handling for Outputs (Clean, Rerun, Screenings, Trash) ---
    if (title === "Outputs" && data) {
    const clean      = Array.isArray(data.clean)      ? data.clean      : (data.clean ? [data.clean] : []);
    const reruns     = Array.isArray(data.reruns)     ? data.reruns     : (data.reruns ? [data.reruns] : []);
    const screenings = data.screenings ?? [];

    const renderBoxTable = (rows, label) => {
    const formatDate = (d) => (d ? new Date(d).toLocaleString() : "—");

    return (
      <div className="mb-4">
        {label && <h4 className="font-medium mb-1 text-gray-700">{label}</h4>}
        <table className="w-full text-xs border mb-2">
          <thead className="bg-gray-50 text-center">
            <tr>
              <th className="p-1">Box ID</th>
              <th className="p-1">Physical Box ID</th>
              <th className="p-1">Box #</th>
              <th className="p-1">Weight (lbs)</th>
              <th className="p-1">Location</th>
              <th className="p-1">Date</th> {/* NEW */}
            </tr>
          </thead>
          <tbody className="text-center">
            {rows.map((b, i) => {
              const boxId =
                b.Box_ID || b.boxId || b.box_id || b.BoxId || "—";
              const physicalId = b.physicalBoxId || b.physical_box_id || "—";
              const loc =
                b.storageLocation ||
                b.location ||
                b.Location ||
                b.newLocation ||
                b.storage_location ||
                "—";
              const dt =
                b.date ||
                b.created_at ||
                b.timestamp ||
                b.Date_Stored ||
                null; // supports Qsage/Sortex/Spiral variants

              return (
                <tr key={i} className="border-t">
                  <td className="p-1">{boxId}</td>
                  <td className="p-1">{physicalId}</td>
                  <td className="p-1">{b.boxNumber ?? "—"}</td>
                  <td className="p-1">{b.weightLbs ?? b.weight ?? "—"}</td>
                  <td className="p-1">{loc}</td>
                  <td className="p-1">{formatDate(dt)}</td> {/* NEW */}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };


    return (
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">Outputs</h3>

        {clean.length  > 0 && renderBoxTable(clean,  "Clean")}
        {reruns.length > 0 && renderBoxTable(reruns, "Rerun")}

        {/* Screenings can be an array (Spiral) or an object-of-arrays (other UIs) */}
        {Array.isArray(screenings)
          ? (screenings.length > 0 && renderBoxTable(screenings, "Screenings"))
          : (Object.keys(screenings).length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-1 text-gray-700">Screenings</h4>
                {Object.entries(screenings).map(([type, boxes]) => (
                  <div key={type} className="mb-3">
                    <h5 className="font-medium text-gray-600 capitalize">{type}</h5>
                    {renderBoxTable(boxes, "")}
                  </div>
                ))}
              </div>
            ))
        }
      </div>
    );
  }

  // --- Default generic section renderer ---
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="mb-4">
          <h4 className="font-medium capitalize mb-1 text-gray-700">
            {key.replace(/_/g, " ")}
          </h4>
          {Array.isArray(value) ? (
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

function InboundSection({ inbound }) {
  if (!Array.isArray(inbound) || inbound.length === 0) return null;

  // Normalize every inbound row
  const rows = inbound.map((b) => ({
    sourceType: b.sourceType || "—",
    binLocation: b.binLocation || b.bin_location || "—",
    boxNumber: b.boxNumber || "—",
    weightLbs: b.weightLbs || b.weight || "—",
    physicalBoxId: b.physicalBoxId || "—",
    usePhysicalBox: b.usePhysicalBox ? "Yes" : "No",
    lotNumber: b.lotNumber || b.lot || "—",
    product: b.product || b.products || "—",
  }));

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-lg mb-2">Inbound Boxes</h3>

      <table className="w-full text-xs border mb-2">
        <thead className="bg-gray-50 text-center">
          <tr>
            <th className="p-1">Source Type</th>
            <th className="p-1">Bin Location</th>
            <th className="p-1">Box #</th>
            <th className="p-1">Weight (lbs)</th>
            <th className="p-1">Physical Box ID</th>
            <th className="p-1">Use Physical Box</th>
            <th className="p-1">Lot Number</th>
            <th className="p-1">Product</th>
          </tr>
        </thead>

        <tbody className="text-center">
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="p-1 capitalize">{r.sourceType}</td>
              <td className="p-1">{r.binLocation}</td>
              <td className="p-1">{r.boxNumber}</td>
              <td className="p-1">{r.weightLbs}</td>
              <td className="p-1">{r.physicalBoxId}</td>
              <td className="p-1">{r.usePhysicalBox}</td>
              <td className="p-1">{r.lotNumber}</td>
              <td className="p-1">{r.product}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
