import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import Button from "../components/button";
import Image from "next/image";
import Link from "next/link";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👈 NEW
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setError("Invalid recovery link.");
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
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

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError(
        "Password must be at least 8 characters long, contain at least one uppercase letter and one number."
      );
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) setError(updateError.message);
    else setSuccessMessage("Password updated successfully!");

    await supabase.auth.signOut();
    setLoading(false);
  };

  return (
    <div className="flex bg-white flex-col justify-center items-center min-h-screen">
      {/* Header */}
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

      {/* Box */}
      <div className="flex flex-col items-center justify-center w-[424px] h-[605px] bg-[#3D5147] rounded-3xl">
        <span className="text-white text-[40px] font-[amiri] my-7">
          Reset Password
        </span>
        <span className="text-white text-[20px] font-[amiri] my-4">
          Enter your new password:
        </span>

        {/* Password Input + Eye Toggle */}
        <div className="relative w-[300px]">
          <input
            className="p-4 w-full bg-white text-black border rounded-lg my-4 pr-12"
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Eye Button */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              // 👁 Eye Open
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
                <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
              </svg>
            ) : (
              // 👁‍🗨 Eye Closed
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3l18 18M10.584 10.587A3 3 0 0113.413 13.42M9.88 4.939A10.45 10.45 0 0112 4.5c4.478 0 8.268 2.943 9.542 7a10.52 10.52 0 01-1.272 2.612M6.228 6.23C4.406 7.363 3.064 9.126 2.458 12c1.274 4.057 5.064 7 9.542 7a10.46 10.46 0 003.063-.463"
                />
              </svg>
            )}
          </button>
        </div>

        <Button
          label={loading ? "Resetting..." : "Submit"}
          color="red"
          className="w-[120px] h-[45px] font-[amiri] items-center my-6"
          onClick={handleReset}
          disabled={!sessionReady || loading}
        />

        <Link href="/login">
          <span className="text-white underline cursor-pointer">
            Return to the Login page
          </span>
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
