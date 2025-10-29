import React, { useEffect, useState } from "react";
import Layout from "../components/layout";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { format } from "date-fns";

function parseJsonArray(val) {
  // Supabase typically returns jsonb as arrays, but be robust:
  if (!val && val !== 0) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // not JSON (maybe stored as "-")
      return [val];
    }
  }
  return [val];
}

export default function Transfer() {
  const supabase = useSupabaseClient();

  const [silos, setSilos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromRow, setFromRow] = useState(null);
  const [toRow, setToRow] = useState(null);

  const [transferAll, setTransferAll] = useState(false);
  const [weight, setWeight] = useState(""); // lbs
  const [dateTime, setDateTime] = useState(""); // optional

  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch silos
  useEffect(() => {
    fetchSilos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const siloOrder = [
  "HQ-1","HQ-2","HQ-3","HQ-4","HQ-5","HQ-6","HQ-7","HQ-8","HQ-9","HQ-10",
  "HQ-11","HQ-12","HQ-13","HQ-14","HQ-15","HQ-16","HQ-17","HQ-18",
  "BEN-5","BEN-6","BEN-7","BEN-8","BEN-9","BEN-10","BEN-11","BEN-12",
  "Co2-1","Co2-2","Boxes-Mill"
];

const fetchSilos = async () => {
  setLoading(true);
  setMessage(null);
  const { data, error } = await supabase
    .from("field_run_storage_test")
    .select("*");

  if (error) {
    setMessage({ type: "error", text: "Error loading silos: " + error.message });
    setSilos([]);
  } else {
    // Sort according to fixed order
    const sorted = data.sort(
      (a, b) => siloOrder.indexOf(a.location) - siloOrder.indexOf(b.location)
    );
    setSilos(sorted);
  }
  setLoading(false);
};

  // update selected rows when silo lists change or selection changes
  useEffect(() => {
    setFromRow(silos.find((s) => s.location === from) || null);
    // reset weight/transferAll when from changes
    setTransferAll(false);
    setWeight("");
  }, [from, silos]);

  useEffect(() => {
    setToRow(silos.find((s) => s.location === to) || null);
  }, [to, silos]);

  const formatArrayForDisplay = (val) => {
    const arr = parseJsonArray(val);
    if (arr.length === 0) return "-";
    // If it's a single dash marker, show dash
    if (arr.length === 1 && (arr[0] === "-" || arr[0] === "")) return "-";
    return arr.join(", ");
  };

  const handleTransfer = async () => {
    setMessage(null);

    // Basic validation
    if (!from || !to) {
      setMessage({ type: "error", text: "Select both source and destination silos." });
      return;
    }
    if (from === to) {
      setMessage({ type: "error", text: "Source and destination silos must be different." });
      return;
    }
    if (!fromRow) {
      setMessage({ type: "error", text: "Source silo not found (refresh and try again)." });
      return;
    }
    if (!toRow) {
      setMessage({ type: "error", text: "Destination silo not found (refresh and try again)." });
      return;
    }

    const available = Number(fromRow.weight) || 0;
    const transferWeight = transferAll ? available : Number(weight);

    if (!transferAll) {
      if (!weight || isNaN(transferWeight) || transferWeight <= 0) {
        setMessage({ type: "error", text: "Enter a valid transfer weight." });
        return;
      }
      if (transferWeight > available) {
        setMessage({ type: "error", text: `Cannot transfer more than available (${available} lbs).` });
        return;
      }
    } else {
      if (available <= 0) {
        setMessage({ type: "error", text: "Source silo has 0 weight to transfer." });
        return;
      }
    }

    setProcessing(true);

    try {
      // Call the server-side function (recommended approach).
      // Make sure you created the transfer_silo_contents function in your DB (I gave you SQL earlier).
      const { error } = await supabase.rpc("transfer_silo_contents", {
        from_location: from,
        to_location: to,
        transfer_weight: transferAll ? available : transferWeight,
        transfer_all: transferAll,
      });

      if (error) {
        // If RPC not present, Supabase returns an error — show it to the user.
        setMessage({ type: "error", text: "Transfer failed: " + error.message });
      } else {
        setMessage({ type: "success", text: "Transfer completed successfully." });
        // refresh data
        await fetchSilos();
        // clear inputs
        setFrom("");
        setTo("");
        setWeight("");
        setDateTime("");
        setTransferAll(false);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Unexpected error: " + err.message });
    } finally {
      setProcessing(false);
    }
  };

  // computed preview (what dest will look like after transfer) — only for UI preview
  const preview = React.useMemo(() => {
    if (!fromRow || !toRow) return null;
    const transferWeight = transferAll ? Number(fromRow.weight || 0) : Number(weight || 0);
    if (!transferAll && (!weight || isNaN(transferWeight))) return null;

    const destWeight = Number(toRow.weight || 0) + (transferAll ? Number(fromRow.weight || 0) : transferWeight);
    const destMoisture = Math.max(Number(fromRow.moisture || 0), Number(toRow.moisture || 0));
    const destLots = Array.from(new Set([...(parseJsonArray(toRow.lot_number) || []), ...(parseJsonArray(fromRow.lot_number) || [])]));
    const destProducts = Array.from(new Set([...(parseJsonArray(toRow.product) || []), ...(parseJsonArray(fromRow.product) || [])]));

    return {
      destWeight,
      destMoisture,
      destLots,
      destProducts,
    };
  }, [fromRow, toRow, transferAll, weight]);

  return (
    <Layout title="Transfer" showBack={true}>
    <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-6">Transfer Between Silos</h2>

        {loading ? (
        <p>Loading silos…</p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_2fr_2fr] gap-6">
            {/* Controls */}
            <div className="space-y-4 p-4 rounded">
            <label className="block">
                <span className="text-sm font-medium">From Silo</span>
                <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 bg-gray-100"
                >
                <option value="">-- select from --</option>
                {silos.map((s) => (
                    <option key={s.location} value={s.location}>
                    {s.location}
                    </option>
                ))}
                </select>
            </label>

            <label className="block">
                <span className="text-sm font-medium">To Silo</span>
                <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 bg-gray-100"
                >
                <option value="">-- select to --</option>
                {silos.map((s) => (
                    <option key={s.location} value={s.location}>
                    {s.location}
                    </option>
                ))}
                </select>
            </label>

            {!transferAll && (
                <label className="block">
                <span className="text-sm font-medium">Weight to transfer (lbs)</span>
                <input
                    type="number"
                    min="0"
                    step="1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="mt-1 block w-full border rounded px-3 py-2 bg-gray-100"
                    placeholder={fromRow ? `max ${fromRow.weight || 0}` : "Enter weight"}
                    disabled={!fromRow}
                />
                </label>
            )}

            <label className="flex items-center space-x-2">
                <input
                type="checkbox"
                checked={transferAll}
                onChange={(e) => {
                    setTransferAll(e.target.checked);
                    if (e.target.checked && fromRow) {
                    setWeight(String(Number(fromRow.weight || 0)));
                    } else {
                    setWeight("");
                    }
                }}
                />
                <span>Transfer everything from source (empty source)</span>
            </label>

            <label className="block">
                <span className="text-sm font-medium">Transfer date/time (optional)</span>
                <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 bg-gray-100"
                />
                {dateTime ? (
                <p className="text-xs mt-1 text-gray-600">
                    Selected: {format(new Date(dateTime), "MMMM d, yyyy 'at' h:mm a")}
                </p>
                ) : (
                <p className="text-xs mt-1 text-gray-500">No date selected — current DB timestamp will be used.</p>
                )}
            </label>

            <div className="pt-2">
                <button
                onClick={handleTransfer}
                disabled={processing}
                className="w-full bg-[#5D1214] text-white px-4 py-2 rounded hover:bg-[#3D5147] disabled:opacity-60"
                >
                {processing ? "Processing…" : "Execute Transfer"}
                </button>
            </div>

            {message && (
                <div
                className={`mt-3 p-3 rounded text-sm ${
                    message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                }`}
                >
                {message.text}
                </div>
            )}
            </div>

            {/* From Silo */}
            <div className="p-4 border rounded bg-gray-100">
            <h3 className="font-medium mb-2">Source: {from || "—"}</h3>
            <p className="text-sm"><strong>Weight:</strong> {fromRow ? `${fromRow.weight} lbs` : "—"}</p>
            <p className="text-sm"><strong>Moisture:</strong> {fromRow ? `${fromRow.moisture}%` : "—"}</p>
            <p className="text-sm"><strong>Lots:</strong> {fromRow ? formatArrayForDisplay(fromRow.lot_number) : "—"}</p>
            <p className="text-sm"><strong>Products:</strong> {fromRow ? formatArrayForDisplay(fromRow.product) : "—"}</p>
            </div>

            {/* To Silo */}
            <div className="p-4 border rounded bg-gray-100">
            <h3 className="font-medium mb-2">Destination: {to || "—"}</h3>
            <p className="text-sm"><strong>Weight:</strong> {toRow ? `${toRow.weight} lbs` : "—"}</p>
            <p className="text-sm"><strong>Moisture:</strong> {toRow ? `${toRow.moisture}%` : "—"}</p>
            <p className="text-sm"><strong>Lots:</strong> {toRow ? formatArrayForDisplay(toRow.lot_number) : "—"}</p>
            <p className="text-sm"><strong>Products:</strong> {toRow ? formatArrayForDisplay(toRow.product) : "—"}</p>
            </div>

            {/* Preview after transfer */}
            {preview && (
            <div className="p-4 border rounded bg-gray-50">
                <h4 className="font-semibold mb-2">Preview: destination after transfer</h4>
                <p className="text-sm"><strong>New weight:</strong> {preview.destWeight} lbs</p>
                <p className="text-sm"><strong>New moisture:</strong> {preview.destMoisture}%</p>
                <p className="text-sm"><strong>Lots (merged):</strong> {preview.destLots.join(", ")}</p>
                <p className="text-sm"><strong>Products (merged):</strong> {preview.destProducts.join(", ")}</p>
            </div>
            )}
        </div>
        )}
    </div>
    </Layout>
  );
}
