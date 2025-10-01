import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";

const Layout = ({ title, children, showBack }) => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const session = useSession(); // Supabase session
  const [showSettings, setShowSettings] = useState(false);
  const [role, setRole] = useState(null);

  // Fetch role from Supabase users table
  useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error) console.error("Error fetching role:", error.message);
      else setRole(data?.role);
    };

    fetchRole();
  }, [session, supabase]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push("/login");
    else console.error("Logout error:", error.message);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative font-amiri">
      
      {/* Header */}
      <div className="flex items-center w-[95%] justify-between translate-y-[-3vh] mt-6">
        {showBack ? (
          <button
            onClick={() => router.back()}
            className="bg-[#3D5147] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#2c3a35]"
          >
            Back
          </button>
        ) : <div />}

        <span className="text-[40px] text-[#3D5147] font-[amiri]">{title}</span>

        <button onClick={() => setShowSettings(prev => !prev)}>
          <img
            src="/settings.png"
            alt="Settings"
            className="w-[40px] h-[40px] object-contain opacity-100 hover:opacity-50 transition"
          />
        </button>
      </div>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="absolute top-20 right-12 w-48 bg-white rounded-lg shadow-lg p-4 z-50">
          <p className="text-sm text-gray-600 mb-1 font-[amiri]">
            Account: {session?.user?.email || "Guest"}
          </p>
          <p className="text-sm text-gray-600 mb-2 font-[amiri]">
            Role: {role || "Unknown"}
          </p>
          <button 
            className="w-full bg-[#3D5147] hover:bg-[#2c3a35] text-white py-1 px-2 rounded-md font-[amiri]"
            onClick={handleLogout}
          >
            Log Out ↪
          </button>
        </div>
      )}

      {/* Content Box */}
      <div className="bg-[#D9D9D9] w-[95%] h-[80vh] rounded-[30px] shadow-lg flex flex-wrap justify-center items-center gap-4 p-6 font-[amiri]">
        {children}
      </div>
    </div>
  );
};

export default Layout;
