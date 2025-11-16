import React, { useState, useEffect } from "react";
import Layout from "../components/layout"; 
import Button from "../components/button";
import Link from "next/link";
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

const buttonStyle = "bg-[#5D1214] text-white px-6 py-6 rounded-[15px] text-lg font-[amiri] text-center hover:bg-[#3D5147] transition-all duration-300";


function EmployeeMenu() {
  const [showSettings, setShowSettings] = useState(false);
  const [role, setRole] = useState(null);
  const session = useSession();
  const supabase = useSupabaseClient();

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
  }, [session, supabase]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) window.location.href = '/login';
    else console.error('Logout error:', error.message);
  }

  return (
    <Layout 
      title="Employee Menu"
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

      {/* Employee Buttons */}
      {/*<div className="flex flex-wrap justify-center items-center w-[100%] h-[100%]">*/}
        <div className="grid grid-cols-4 gap-8">
          <Link href="/newFieldRun" className={buttonStyle}>New Field Run</Link>
          <Link href="/transfer" className={buttonStyle}>Transfer</Link>
          <Link href="/qsageJob" className={buttonStyle}>Qsage Job</Link>
          <Link href="/sortexJob" className={buttonStyle}>Sortex Job</Link>
          <Link href="/mixingJob" className={buttonStyle}>Mix</Link>
          <Link href="/baggingJob" className={buttonStyle}>Bagging Job</Link>
          <Link href="/orderFulfillment" className={buttonStyle}>Order Fulfillment</Link>
          <Link href="/jobs" className={buttonStyle}>Jobs</Link>
          <Link href="/inProcess" className={buttonStyle}>In Process</Link>
        </div>
      {/*</div>*/}
    </Layout>
  );
}

export default EmployeeMenu;
