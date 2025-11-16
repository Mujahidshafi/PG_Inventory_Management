import React, { useState } from "react";
import Button from "../components/button";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleResetPassword = async () => {
    setLoading(true);
    setSuccessMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email");
      return;
    } 

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetPassword`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage(
        "If this email exists in our system, you’ll receive a reset link."
      );
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col flex-wrap items-center justify-between bg-white">
      {/* Header */}
      <div className="relative flex flex-row items-center justify-between w-[95%] p-6 m-[40px] bg-white">
        {/* Back Button */}
        <button
          onClick={() => {
            router.back();
          }}
          className="bg-[#3D5147] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#2c3a35]"
        >
          Back
        </button>

        {/* Center Logo + Title */}
        <div className="absolute left-1/2 flex -translate-x-1/2 transform items-center">
          <Image src="/Logo.png" width={150} height={87} alt="Logo" />
          <span className="mx-8 font-[amiri] text-[55px] font-medium text-[#3D5147]">
            Pleasant Grove Farms
          </span>
        </div>

        {/* Spacer (keeps right side balanced for spacing) */}
        <div className="h-2 w-[120px] bg-white"></div>
      </div>

      {/* Content Box */}
      <div className="flex h-[605px] w-[424px] flex-col items-center justify-center rounded-3xl bg-[#3D5147]">
        <span className="my-7 font-[amiri] text-[40px] text-white">
          Forgot Password?
        </span>

        <span className="my-4 font-[amiri] text-[20px] text-white">
          Enter your email address:
        </span>

        <input
          className="my-4 w-[300px] rounded-lg border bg-white p-4 text-black"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          label={loading ? "Sending..." : "Submit"}
          color="red"
          className="my-6 h-[45px] w-[120px] items-center font-[amiri]"
          onClick={handleResetPassword}
        />

        {/* Messages */}
        {successMessage && (
          <div className="mt-4 w-[300px] rounded-md bg-green-200 p-4 text-center text-green-900 shadow-md">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-200 text-center font-[amiri] text-[#5D1214]">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
