import React, { useState, useEffect } from "react";
import Layout from "../components/layout";
import { useRouter } from "next/router";

// --- Helper to safely normalize API responses to an array --- chatGPT
function normalizeToArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function Sale() {
  const router = useRouter();

  const [showSettings, setShowSettings] = useState(false);

  const [inProgressOrders, setInProgressOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [customerMap, setCustomerMap] = useState({});

  // Fetch Customers and create lookup map (id -> name)
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await fetch("/api/fetchCustomers");
        const raw = await res.json();
        const customers = normalizeToArray(raw);

        const map = {};
        customers.forEach((c) => {
          const id = c.customer_id ?? c.id;
          const name = c.name ?? "—";
          if (id != null) map[id] = name;
        });
        setCustomerMap(map);
      } catch (e) {
        console.error("Error loading customers:", e);
        setCustomerMap({});
      }
    };

    loadCustomers();
  }, []);

  const fetchOrders = async () => {
  try {
    const res = await fetch("/api/fetchSaleOrders");
    const progressData = await res.json();
    setInProgressOrders(progressData);
  } catch (err) {
    console.error("Error fetching sale orders:", err);
  }
};


  useEffect(() => {
    fetchOrders();
  }, []);

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

      <div className="flex flex-col space-y-5 max-h-[70vh] overflow-y-auto pr-2">

        {(inProgressOrders ?? []).map((order, index) => {
          const orderId = order.order_id ?? order.id ?? "—";
          const customerName =
            customerMap[order.customer_id] ??
            customerMap[order.customerId] ??
            "—";

          return (
            <div
              key={orderId + "-" + index}
              className="flex flex-row justify-between items-center bg-white border border-gray-400 rounded-lg p-5 shadow-sm cursor-pointer hover:shadow-md transition"
            >
              {/* Orders - MATCH JOB PAGE FORMAT*/}
              <div className="flex flex-row justify-start w-full space-x-8">

                {/* Row Number */}
                <div className="flex flex-col w-[5%]">
                  <span className="font-bold text-sm text-gray-800px-2 py-1 rounded">#</span>
                  <span className="mt-1">{index + 1}</span>
                </div>

                {/* Order ID */}
                <div className="flex flex-col w-[12%]">
                  <span className="font-bold text-sm text-gray-800 px-2 py-1 rounded">
                    Order ID
                  </span>
                  <span className="mt-1">{orderId}</span>
                </div>

                {/* Customer Name (from map) */}
                <div className="flex flex-col w-[18%]">
                  <span className="font-bold text-sm text-gray-800  px-2 py-1 rounded">
                    Customer
                  </span>
                  <span className="mt-1">{customerName}</span>
                </div>

                {/* Sale Type */}
                <div className="flex flex-col w-[12%]">
                  <span className="font-bold text-sm text-gray-800 px-2 py-1 rounded">
                    Sale Type
                  </span>
                  <span className="mt-1">
                    {(order.sale_type ?? order.saleType ?? "—")
                      ?.toString()
                      .toUpperCase()}
                  </span>
                </div>

                {/* Lot Number */}
                <div className="flex flex-col w-[12%]">
                  <span className="font-bold text-sm text-gray-800 px-2 py-1 rounded">
                    Lot Number
                  </span>
                  <span className="mt-1">
                    {order.field_lot_number ?? order.lot_number ?? order.lotNumber ?? "—"}
                  </span>
                </div>

                {/* Product */}
                <div className="flex flex-col w-[18%]">
                  <span className="font-bold text-sm text-gray-800 px-2 py-1 rounded">
                    Product
                  </span>
                  <span className="mt-1">
                    {order.product_name ?? order.product ?? "—"}
                  </span>
                </div>

                {/* Weight */}
                <div className="flex flex-col w-[10%]">
                  <span className="font-bold text-sm text-gray-800 px-2 py-1 rounded">
                    Weight
                  </span>
                  <span className="mt-1">
                    {order.product_weight ?? order.weight ?? "—"}
                  </span>
                </div>

                {/* Amount */}
                <div className="flex flex-col w-[10%]">
                  <span className="font-bold text-sm text-gray-800px-2 py-1 rounded">
                    Amount
                  </span>
                  <span className="mt-1">
                    {order.product_quantity ?? order.amount ?? "—"}
                  </span>
                </div>

                {/* Date */}
                <div className="flex flex-col w-[15%]">
                  <span className="font-bold text-sm text-gray-700 tracking-wide">
                    Date
                  </span>
                  <span className="mt-1">
                    {order.date
                      ? new Date(order.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

export default Sale;
