import React, { useState, useEffect } from "react";
import Button from "../components/button"; 
import Layout from "../components/layout";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import Link from "next/link";

function AccountsManager() {
  const supabase = useSupabaseClient();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);


  const confirmDeleteUser = (user) => {
  setSelectedUser(user);
  setShowDeletePopup(true);
  };
  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) console.error('Error fetching users:', error);
      else setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, [supabase]);

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) console.error('Error updating role:', error);
    else setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleDeleteUser = async (userId) => {
  try {
    const res = await fetch("/api/deleteUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await res.json();
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSuccessMessage("User deleted successfully!");
    } else {
      setError(data.error || "Failed to delete user");
    }
  } catch (err) {
    setError(err.message);
  }
};



  if (loading) return <Layout title="Accounts Manager">Loading...</Layout>;

  return (
    <Layout title="Accounts Manager" onSettingsClick={() => setShowSettings(!showSettings)}>

      {/* Settings Dropdown */}
    {showSettings && (
    <div className="absolute top-20 right-12 w-48 bg-white rounded-lg shadow-lg p-4 z-50">
      <p className="text-sm text-gray-600 mb-2">Account: Admin</p>
      <p className="text-sm text-gray-600 mb-2">Role: Admin</p>
      <button 
        className="w-full bg-[#3D5147] hover:bg-[#2c3a35] text-white py-1 px-2 rounded-md"
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }}
      >
        Log Out ↪
      </button>
    </div>
  )}

      <div className="my-6 overflow-x-auto">
        <table className="min-w-full bg-[#5D1214] text-white rounded-lg overflow-hidden shadow-lg my-6 max-h-[600px] overflow-y-auto overflow-x-auto">
          <thead>
            <tr className="bg-[#5D1214]">
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
  {users.map((user) => (
    <tr key={user.id} className="text-center border-b border-white hover:bg-red-500/30 transition-all">
      <td className="px-6 py-4">{user.id}</td>
      <td className="px-6 py-4">{user.name || "-"}</td>
      <td className="px-6 py-4">{user.email}</td>
      <td className="px-6 py-4">
        <select
          value={user.role}
          onChange={(e) => handleRoleChange(user.id, e.target.value)}
          className="border px-2 py-1 rounded text-black bg-white"
        >
          <option value="admin">Admin</option>
          <option value="employee">Employee</option>
        </select>
      </td>
      <td className="px-6 py-4">{new Date(user.created_at).toLocaleString()}</td>
      <td className="px-6 py-4">
  <button
    onClick={() => confirmDeleteUser(user)}
    className="bg-[#3D5147] hover:bg-[#5D1214] text-white px-3 py-1 rounded"
  >
    Delete
  </button>
</td>

    </tr>
  ))}
</tbody>

        </table>
      </div>

      <div className="my-6 flex justify-center">
        <Link href="/createAccount">
          <Button
            label="Create New User"
            color="green"
            className="w-[180px] h-[50px] font-[amiri]"
          />
        </Link>
      </div>

      {showDeletePopup && selectedUser && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] text-center">
      <h2 className="text-lg font-semibold mb-4">
        Confirm Delete
      </h2>
      <p className="mb-6">
        Are you sure you want to delete user <strong>{selectedUser.name || selectedUser.email}</strong>?
      </p>
      <div className="flex justify-center gap-4">
        <button
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          onClick={async () => {
            try {
              const res = await fetch("/api/deleteUser", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedUser.id }),
              });

              const data = await res.json();
              if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
                setSuccessMessage("User deleted successfully!");
              } else {
                setError(data.error || "Failed to delete user");
              }
            } catch (err) {
              setError(err.message);
            } finally {
              setShowDeletePopup(false);
              setSelectedUser(null);
            }
          }}
        >
          Delete
        </button>
        <button
          className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
          onClick={() => setShowDeletePopup(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
{successMessage && (
  <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-200 text-green-900 p-4 rounded-md shadow-md text-center">
    {successMessage}
  </div>
)}
{error && (
  <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-red-200 text-red-900 p-4 rounded-md shadow-md text-center">
    {error}
  </div>
)}


    </Layout>
  );
}

export default AccountsManager;
