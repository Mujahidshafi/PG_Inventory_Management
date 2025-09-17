import React, { useState, useEffect } from "react";
import Layout from "../components/layout"; 
import Button from "../components/button";
import Link from "next/link";
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

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
  }, [session]);

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
      <div className="flex flex-wrap justify-center items-center w-[100%] h-[100%]">
        <div className="grid grid-cols-2 gap-8">
          <Link href="/newFieldRun">
            <Button label="New Field Run" color="red" className="min-w-[160px] h-16" />
          </Link>

          <Link href="/transfer">
            <Button label="Transfer" color="red" className="min-w-[160px] h-16" />
          </Link>

          <Link href="/jobs">
            <Button label="Jobs" color="red" className="min-w-[160px] h-16" />
          </Link>

          <Link href="/updateLocation">
            <Button label="Update Location" color="red" className="min-w-[160px] h-16" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export default EmployeeMenu;
