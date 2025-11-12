import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";
import Image from "next/image";

const Layout = ({ title, children, showBack, backRoute }) => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const session = useSession();
  const [showSettings, setShowSettings] = useState(false);
  const [role, setRole] = useState(null);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-white relative font-amiri">
      
      {/* Header */}
      <div className="flex items-center w-[95%] justify-between translate-y-[-3vh] mt-6">
        {/* Back Button */}
        {showBack ? (
          <button
            onClick={() => {
              if (backRoute) router.push(backRoute);
              else router.back();
            }}
            className="bg-[#3D5147] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#2c3a35]"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {/* Page Title */}
        <div className="flex items-center gap-3">
          <img
            src="/Logo.png"
            alt="Logo"
            className="w-[60px] h-[60px] object-contain"
          />
          <span className="text-[40px] text-[#3D5147] font-[amiri]">{title}</span>
        </div>

        {/* Settings */}
        <div className="flex items-center gap-4">
          <button onClick={() => setShowSettings((prev) => !prev)}>
            <img
              src="/settings.png"
              alt="Settings"
              className="w-[40px] h-[40px] object-contain opacity-100 hover:opacity-50 transition"
            />
          </button>
        </div>
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

      {/* Main Content */}
      <div className="bg-[#D9D9D9] w-[95%] h-[80vh] rounded-[30px] shadow-lg flex flex-wrap justify-center items-center gap-4 p-6 font-[amiri] relative">
        {children}

        {/* Copyright */}
        <p className="absolute bottom-2 left-6 text-sm text-[#3D5147] opacity-70 font-[amiri]">
          © 2025 Pleasant Grove Farms
        </p>
      </div>
    </div>
  );
};

export default Layout;
