import React, { useState } from "react";
import Button from "../components/button";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async () => {
    setLoading(true);
    setSuccessMessage("");
    setError("");

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetPassword` // page user will be sent to
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage(
        "Password reset email sent! Please check your inbox."
      );
    }

    setLoading(false);
  };

  return (
    <div className="flex bg-white flex-wrap flex-col justify-between items-center">
      <div className="flex bg-white p-6 m-[40px] flex-row w-[95%] justify-between items-center">
        <div className="w-2 h-2 bg-white"></div>
        <div className="flex items-center bg-white">
          <Image src="/Logo.png" width={150} height={87} alt="Logo" />
          <span className="text-[#3D5147] text-[55px] font-medium font-[amiri] mx-8">
            Pleasant Grove Farms
          </span>
        </div>
        <div className="w-2 h-2 bg-white"></div>
      </div>

      <div className="flex items-center flex-col justify-center w-[424px] h-[605px] bg-[#3D5147] rounded-3xl">
        <span className="text-white text-[40px] font-[amiri] my-7">
          Forgot Password?
        </span>
        <span className="text-white text-[20px] font-[amiri] my-4">
          Enter your email address:
        </span>
        <input
          className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          label={loading ? "Sending..." : "Submit"}
          color="red"
          className="w-[120px] h-[45px] font-[amiri] items-center my-6"
          onClick={handleResetPassword}
        />

        {/* Feedback messages */}
        {successMessage && (
          <div className="bg-green-200 text-green-900 p-4 rounded-md shadow-md mt-4 text-center w-[300px]">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-200 text-red-900 p-4 rounded-md shadow-md mt-4 text-center w-[300px]">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
