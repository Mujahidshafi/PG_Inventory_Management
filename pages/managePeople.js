import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/layout";

export default function ManagePeoplePage() {
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmployee, setNewEmployee] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", nickname: "" });
  const [statusMsg, setStatusMsg] = useState("");

  // Fetch both tables
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: empData, error: empErr } = await supabase
          .from("employees")
          .select("*")
          .order("name", { ascending: true });
        if (empErr) throw empErr;

        const { data: custData, error: custErr } = await supabase
          .from("customers")
          .select("*")
          .order("name", { ascending: true });
        if (custErr) throw custErr;

        setEmployees(empData || []);
        setCustomers(custData || []);
      } catch (e) {
        console.error(e);
        setStatusMsg("Error loading data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Employee actions
  const addEmployee = async () => {
    if (!newEmployee.trim()) return;

    const { data, error } = await supabase
      .from("employees")
      .insert({ name: newEmployee.trim(), active: true })
      .select()
      .single();   // ← ensure we get back "id"

    if (error) {
      alert(error.message);
    } else {
      // data = { id: 12, name: "...", active: true }
      setEmployees((prev) => [...prev, data]);
      setNewEmployee("");
    }
  };

  const updateEmployee = async (id, field, value) => {
  if (!id) {
    console.error("Missing employee ID for update");
    return;
  }
  const { error } = await supabase
    .from("employees")
    .update({ [field]: value })
    .eq("id", id);

  if (error) alert(error.message);
  else {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp))
    );
  }
};

const deleteEmployee = async (id) => {
  if (!id) {
    console.error("Missing employee ID for delete");
    return;
  }
  if (!confirm("Delete this employee?")) return;

  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id);

  if (error) alert(error.message);
  else {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }
};

  // Customer actions
  const addCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    const { data, error } = await supabase
      .from("customers")
      .insert([newCustomer])
      .select();
    if (error) alert(error.message);
    else {
      setCustomers([...customers, data[0]]);
      setNewCustomer({ name: "", nickname: "" });
    }
  };

  const updateCustomer = async (id, field, value) => {
    const { error } = await supabase
      .from("customers")
      .update({ [field]: value })
      .eq("customer_id", id);
    if (error) alert(error.message);
    else {
      setCustomers((prev) =>
        prev.map((cust) =>
          cust.customer_id === id ? { ...cust, [field]: value } : cust
        )
      );
    }
  };

  const deleteCustomer = async (id) => {
    if (!confirm("Delete this customer?")) return;
    const { error } = await supabase.from("customers").delete().eq("customer_id", id);
    if (error) alert(error.message);
    else setCustomers(customers.filter((c) => c.customer_id !== id));
  };

  return (
    <Layout title="Manage Employees and Customers" showBack={true}>
    <div className="h-full bg-[#D9D9D9] p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {statusMsg && <p className="text-center text-sm text-gray-600">{statusMsg}</p>}

        {loading ? (
  <p className="text-center text-gray-500">Loading...</p>
) : (
  <div className="flex flex-col md:flex-row gap-8">
    {/* Employees (Left) */}
    <section className="flex-1 bg-white rounded-2xl border p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-center">Employees</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="New employee name"
          value={newEmployee}
          onChange={(e) => setNewEmployee(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          onClick={addEmployee}
          className="bg-[#3D5147] text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          Add
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-t">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-center">Active</th>
              <th className="p-2 text-center w-20">Delete</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t">
                <td className="p-2">
                  <input
                    type="text"
                    value={emp.name}
                    onChange={(e) => updateEmployee(emp.id, "name", e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={emp.active}
                    onChange={(e) =>
                      updateEmployee(emp.id, "active", e.target.checked)
                    }
                  />
                </td>
                <td className="text-center">
                  <button
                    onClick={() => deleteEmployee(emp.id)}
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

    {/* Customers (Right) */}
    <section className="flex-1 bg-white rounded-2xl border p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-center">Customers</h2>

      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-2 mb-4">
        <input
          type="text"
          placeholder="Customer name"
          value={newCustomer.name}
          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
          className="border rounded-lg px-3 py-2"
        />
        
        <button
          onClick={addCustomer}
          className="bg-[#3D5147] text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          Add
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-t">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-center w-20">Delete</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((cust) => (
              <tr key={cust.customer_id} className="border-t">
                <td className="p-2">
                  <input
                    type="text"
                    value={cust.name}
                    onChange={(e) =>
                      updateCustomer(cust.customer_id, "name", e.target.value)
                    }
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
                
                <td className="text-center">
                  <button
                    onClick={() => deleteCustomer(cust.customer_id)}
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
  </div>
)}

      </div>
    </div>
    </Layout>
  );
}
