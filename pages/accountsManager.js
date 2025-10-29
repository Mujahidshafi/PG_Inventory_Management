import React, { useState, useEffect } from "react";
import Button from "../components/button"; 
import Layout from "../components/layout";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useSession } from '@supabase/auth-helpers-react';
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

  // Confirm deletion
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

  // Handle delete user
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
    <Layout title="Accounts Manager" showBack={true} onSettingsClick={() => setShowSettings(!showSettings)}>
      {/* Users Table */}
      <div className="my-6 overflow-x-auto max-h-[600px]">
        <table className="min-w-full bg-[#3D5147] text-white rounded-lg shadow-lg my-6">
          <thead>
            <tr className="bg-[#3D5147]">
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Created At</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="text-left border-b border-white hover:bg-red-500/30 transition-all">
                <td className="px-6 py-4">{user.id}</td>
                <td className="px-6 py-4">{user.name || "-"}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="border px-2 py-1 rounded text-[#3D5147] bg-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                  </select>
                </td>
                <td className="px-6 py-4">{new Date(user.created_at).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => confirmDeleteUser(user)}
                    className="bg-[#5D1214] hover:bg-red-950 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create New User Button */}
      <div className="my-6 flex justify-center">
        <Link href="/createAccount">
          <Button
            label="Create New User"
            color="green"
            className="w-[180px] h-[50px]"
          />
        </Link>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeletePopup && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] text-center">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete user <strong>{selectedUser.name || selectedUser.email}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-[#5D1214] hover:bg-red-950 text-white px-4 py-2 rounded"
                onClick={async () => {
                  await handleDeleteUser(selectedUser.id);
                  setShowDeletePopup(false);
                  setSelectedUser(null);
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

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-200 text-[#3D5147] p-4 rounded-md shadow-md text-center">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 mb-4 bg-red-200 text-[#5D1214] font-[amiri] p-4 rounded-lg shadow-md text-center">
          {error}
        </div>
      )}

    </Layout>
  );
}

export default AccountsManager;
