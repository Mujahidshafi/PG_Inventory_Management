import React, { useState, useEffect } from "react";
import Link from "next/link"; 
import Layout from "../components/layout";
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

const buttonStyle = "bg-[#5D1214] text-white px-6 py-6 rounded-[15px] text-lg font-semibold text-center hover:bg-[#3D5147] transition-all duration-300";


function AdminMenu() {
  const [showSettings, setShowSettings] = useState(false);
  const [role, setRole] = useState(null);
  const session = useSession();
  const supabase = useSupabaseClient();

  return (
    <Layout title="Admin Menu">
      <div className="grid grid-cols-4 gap-8">
        <Link href="/newFieldRun" className={buttonStyle}> New Field Run </Link>

        <Link href="/transfer" className={buttonStyle}> Transfer </Link>

        <Link href="/mix" className={buttonStyle}> Mix </Link>

        <Link href="/addNewItems" className={buttonStyle}> Add New Items </Link>

        <Link href="/deleteItems" className={buttonStyle}> Delete Items </Link>


  // Fetch user role
  useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) console.error('Error fetching role:', error.message);
      else setRole(data.role);
    };

    fetchRole();
  }, [session]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) window.location.href = '/login';
    else console.error('Logout error:', error.message);
  }

  return (
    <Layout 
      title="Admin Menu" 
      onSettingsClick={() => setShowSettings(!showSettings)}
    >
      {/* Settings Dropdown */}
      {showSettings && (
        <div className="absolute top-20 right-12 w-48 bg-white rounded-lg shadow-lg p-4 z-50">
          <p className="text-sm text-gray-600 mb-1">
            Account: {session?.user?.email || 'Guest'}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Role: {role || 'Unknown'}
          </p>
          <button 
            className="w-full bg-[#3D5147] hover:bg-[#2c3a35] text-white py-1 px-2 rounded-md"
            onClick={handleLogout}
          >
            Log Out ↪
          </button>
        </div>
      )}

      {/* Admin Buttons */}
      <div className="grid grid-cols-4 gap-8">
        <Link href="/newFieldRun" className={buttonStyle}>New Field Run</Link>
        <Link href="/transfer" className={buttonStyle}>Transfer</Link>
        <Link href="/addNewItems" className={buttonStyle}>Add New Items</Link>
        <Link href="/deleteItems" className={buttonStyle}>Delete Items</Link>
        <Link href="/jobs" className={buttonStyle}>Jobs</Link>
        <Link href="/updateLocation" className={buttonStyle}>Update Location</Link>
        <Link href="/createJob" className={buttonStyle}>Create Job</Link>
        <Link href="/inProcess" className={buttonStyle}>In Process</Link>
        <Link href="/storageDashboard" className={buttonStyle}>Storage Dashboard</Link>
        <Link href="/sale" className={buttonStyle}>Sale</Link>
        <Link href="/search" className={buttonStyle}>Search</Link>
        <Link href="/accountsManager" className={buttonStyle}>Accounts Manager</Link>
      </div>
    </Layout>
  );
}

export default AdminMenu;
