import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import Button from "../components/button";
import Image from "next/image";
import Link from "next/link";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Read tokens from the URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setError("Invalid recovery link.");
      return;
    }

    const params = new URLSearchParams(hash.slice(1)); // Remove the `#`
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type = params.get("type");

    if (!access_token || !refresh_token || type !== "recovery") {
      setError("Invalid or expired recovery link.");
      return;
    }

    const initSession = async () => {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) setError(sessionError.message);
      else setSessionReady(true);
    };

    initSession();
  }, []);

  const handleReset = async () => {
    if (!sessionReady) {
      setError("Session not ready. Please reload the page.");
      return;
    }

    setSuccessMessage("");
    setError("");

    // Password constraints
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else setSuccessMessage("Password updated successfully!");
    setLoading(false);
  };

  return (
    <div className="flex bg-white flex-col justify-center items-center min-h-screen">
      <div className="flex flex-row items-center p-6 m-[40px] w-[95%] justify-between">
        <div className="w-2 h-2 bg-white"></div>
        <div className="flex items-center">
          <Image src="/Logo.png" width={150} height={87} alt="Logo" />
          <span className="text-[#3D5147] text-[55px] font-medium font-[amiri] mx-8">
            Pleasant Grove Farms
          </span>
        </div>
        <div className="w-2 h-2 bg-white"></div>
      </div>

      <div className="flex flex-col items-center justify-center w-[424px] h-[605px] bg-[#3D5147] rounded-3xl">
        <span className="text-white text-[40px] font-[amiri] my-7">Reset Password</span>
        <span className="text-white text-[20px] font-[amiri] my-4">Enter your new password:</span>

        <input
          className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          label={loading ? "Resetting..." : "Submit"}
          color="red"
          className="w-[120px] h-[45px] font-[amiri] items-center my-6"
          onClick={handleReset}
          disabled={!sessionReady || loading}
        />
        <Link href="/login">
            <span className="text-white underline cursor-pointer">Return to the Login page</span>
        </Link>
        {successMessage && (
          <div className="bg-green-200 text-green-900 p-4 rounded-md shadow-md my-2 w-[300px] text-center">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-200 text-red-900 p-4 rounded-md shadow-md my-2 w-[300px] text-center">
            {error}
          </div>
        )}
        
      </div>
    </div>
  );
}

export default ResetPassword;
