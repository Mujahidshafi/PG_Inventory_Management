import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSupabaseClient, useSession } from "@supabase/auth-helpers-react";

const ScrollingLayout = ({ title, children, showBack, backRoute, onLogout }) => {
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

      if (!error) setRole(data?.role);
    };

    fetchRole();
  }, [session, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    router.push("/login");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white relative font-[amiri] pb-12">
      
      {/* Header */}
      <div className="flex items-center w-[95%] justify-between mt-6 mb-4">
        
        {/* Back button */}
        {showBack ? (
          <button
            onClick={() => (backRoute ? router.push(backRoute) : router.back())}
            className="bg-[#3D5147] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#2c3a35] cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {/* Title */}
        <div className="flex items-center gap-3">
          <img src="/Logo.png" alt="Logo" className="w-[60px] h-[60px] object-contain" />
          <span className="text-[40px] text-[#3D5147]">{title}</span>
        </div>

        {/* Settings */}
        <button onClick={() => setShowSettings((prev) => !prev)}>
          <img
            src="/settings.png"
            alt="Settings"
            className="w-[40px] h-[40px] object-contain hover:opacity-50 cursor-pointer"
          />
        </button>
      </div>

      {/* Settings Dropdown */}
      {showSettings && (
      <div className="absolute top-20 right-4 sm:right-8 md:right-12 w-72 max-w-[90vw] bg-white rounded-lg shadow-2xl p-5 z-50 border border-gray-200">
        <div className="space-y-3">
          {/* Email — wraps cleanly */}
          <div className="text-sm text-gray-700 font-[amiri] break-all leading-tight">
            <span className="font-semibold text-gray-900">Account:</span>{' '}
            {session?.user?.email || "Guest"}
          </div>

          {/* Role */}
          <div className="text-sm text-gray-600 font-[amiri]">
            <span className="font-semibold text-gray-900">Role:</span>{' '}
            {role || "Loading..."}
          </div>

          {/* Logout Button — full width, always visible */}
          <button
            className="w-full bg-[#3D5147] hover:bg-[#2c3a35] text-white py-3 px-4 rounded-lg font-[amiri] text-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 cursor-pointer"
            onClick={() => {
              console.log("Logout clicked");
              (onLogout ?? handleLogout)();
            }}
          >
            Log Out ↪
          </button>
        </div>
      </div>
      )}

      {/* Auto-expanding content box */}
      <div className="bg-[#D9D9D9] w-[95%] rounded-[30px] shadow-lg p-6 mt-4">
        {children}
      </div>
    </div>
  );
};

export default ScrollingLayout;
