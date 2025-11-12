import React, { useState, useEffect } from "react";
import Layout from "../components/layout";
import { useRouter } from "next/router";

// Generic GET fetch
async function fetchList(apiRoute, setData) {
  try {
    const res = await fetch(apiRoute);
    const data = await res.json();
    setData(data);
  } catch (err) {
    console.error("Error fetching:", err);
  }
}

// Generic POST helper
async function handleAddItems(apiRoute, payload, refreshCallback, message) {
  try {
    const res = await fetch(apiRoute, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to add order");
    await res.json();
    if (refreshCallback) refreshCallback();
    alert(message);
  } catch (err) {
    console.error("Error adding item:", err);
    alert("Failed to add order");
  }
}

function Sale() {
  const router = useRouter();

  const [orderType, setOrderType] = useState("");
  const [customerId, setCustomer] = useState("");
  const [customers, setCustomers] = useState([]);
 // const [allOrders, setAllOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const [inProgressOrders, setInProgressOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);

  // Fetch dropdown lists
  useEffect(() => {
    fetchList("/api/fetchCustomers", setCustomers);
  }, []);

  // Fetch orders (both in_progress and done)
  const fetchOrders = async () => {
    try {
      const [progressRes, doneRes] = await Promise.all([
        fetch("/api/fetchSaleOrders?status=in_progress"),
        fetch("/api/fetchSaleOrders?status=done"),
      ]);
      const progressData = await progressRes.json();
      const doneData = await doneRes.json();
      setInProgressOrders(progressData);
      setCompletedOrders(doneData);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleCreateOrder = () => {
    if (!customerId || !orderType) {
      alert("Select both customer and sale type first");
      return;
    }

    handleAddItems(
      "/api/addOrder",
      { customer_id: customerId, sale_type: orderType },
      fetchOrders,
      "New order added!"
    );
  };

  return (
    <Layout
      title="Orders"
      onSettingsClick={() => setShowSettings(!showSettings)}
      showBack={true}
    >
      {showSettings && (
        <div className="absolute top-20 right-12 w-48 bg-white rounded-lg shadow-lg p-4 z-50">
          <p className="text-sm text-gray-600 mb-2">Account: Admin</p>
          <button className="w-full bg-[#3D5147] hover:bg-[#2c3a35] text-white py-1 px-2 rounded-md">
            Log Out ↪
          </button>
        </div>
      )}

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh] p-2">

        {/* New Order Section */}
        <section className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-4">New Order</h2>

          {/* Customer Dropdown */}
          <div className="flex flex-col items-center mb-4">
            <label className="mb-2 font-medium">Customers</label>
            <select
              className="w-full px-4 py-2 rounded border"
              value={customerId}
              onChange={(e) => setCustomer(e.target.value)}
            >
              <option value="">Select</option>
              {customers.map((item) => (
                <option key={item.customer_id} value={item.customer_id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sale Type Dropdown */}
          <div className="flex flex-col items-center mb-6">
            <label className="mb-2 font-medium">Select Order Type</label>
            <select
              className="w-full px-4 py-2 rounded border"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
            >
              <option value="">Select Type</option>
              <option value="raw">Field Run</option>
              <option value="processed">Clean Product</option>
              <option value="packaged">Screening Product</option>
            </select>
          </div>

          {/* Create Button */}
          <div className="mt-8 text-center w-full">
            <button
              onClick={handleCreateOrder}
              className="bg-[#5A2E2E] hover:bg-[#432121] text-white font-semibold px-8 py-2 rounded-full"
            >
              Create
            </button>
          </div>
        </section>

        {/* Order Info */}
        <section className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-4">Order Information</h2>
          {selectedOrder ? (
            <div className="space-y-2">
              <p>
                <strong>Order ID:</strong> {selectedOrder.order_id}
              </p>
              <p>
                <strong>Customer:</strong> {selectedOrder.customer_name}
              </p>
              <p>
                <strong>Sale Type:</strong> {selectedOrder.sale_type}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    selectedOrder.status === "done"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }
                >
                  {selectedOrder.status}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Select an order to view details.</p>
          )}
        </section>

        {/* In Progress Section */}
        <section className="bg-white rounded-xl shadow p-6 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Orders In Progress</h2>
          {inProgressOrders.length === 0 ? (
            <p className="text-gray-500">No orders in progress.</p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="p-2">Order ID</th>
                  <th className="p-2">Customer ID</th>
                  <th className="p-2">Sale Type</th>
                  <th className="p-2">Lot Number</th>
                  <th className="p-2">Product</th>
                  <th className="p-2">Weight</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {inProgressOrders.map((order) => (
                  <tr
                    key={order.order_id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="p-2">{order.order_id}</td>
                    <td className="p-2">{order.customer_id}</td>
                    <td className="p-2">{order.sale_type?.toUpperCase()}</td>
                    <td className="p-2">{order.field_lot_numner || "—"}</td>
                    <td className="p-2">{order.product_name || "—"}</td>
                    <td className="p-2">{order.product_weight ?? "—"}</td>
                    <td className="p-2">{order.product_quantity ?? "—"}</td>
                    <td className="p-2">
                      {order.date
                        ? new Date(order.date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-2 text-yellow-600">{order.status}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="bg-[#5A2E2E] hover:bg-[#432121] text-white font-semibold px-4 py-1 rounded-full"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          )}
        
        </section>

        {/* Completed */}
        <section className="bg-white rounded-xl shadow p-6 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Completed Orders</h2>
          {completedOrders.length === 0 ? (
            <p className="text-gray-500">No orders in progress.</p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="p-2">Order ID</th>
                  <th className="p-2">Customer ID</th>
                  <th className="p-2">Sale Type</th>
                  <th className="p-2">Lot Number</th>
                  <th className="p-2">Product</th>
                  <th className="p-2">Weight</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.map((order) => (
                  <tr
                    key={order.order_id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="p-2">{order.order_id}</td>
                    <td className="p-2">{order.customer_id}</td>
                    <td className="p-2">{order.sale_type?.toUpperCase()}</td>
                    <td className="p-2">{order.field_lot_numner || "—"}</td>
                    <td className="p-2">{order.product_name || "—"}</td>
                    <td className="p-2">{order.product_weight ?? "—"}</td>
                    <td className="p-2">{order.product_quantity ?? "—"}</td>
                    <td className="p-2">
                      {order.date
                        ? new Date(order.date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-2 text-green-600">{order.status}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="bg-[#5A2E2E] hover:bg-[#432121] text-white font-semibold px-4 py-1 rounded-full"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default Sale;
