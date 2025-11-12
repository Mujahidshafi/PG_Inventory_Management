import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import Button from "../components/button.js";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    // Redirect based on role
    if (profile.role === "admin") {
      router.push("/adminMenu");
    } else if (profile.role === "employee") {
      router.push("/employeeMenu");
    } else {
      setError("User role is not valid");
    }

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/growing-methods.jpg"
          alt="Background"
          fill
          style={{ objectFit: "cover" }}
          quality={100}
        />
        <div className="absolute inset-0 bg-black/20"></div>
        <div>
        </div>
      </div>

      {/* Login Form */}
      <div className="min-h-screen bg-white rounded-lg flex flex-col items-center justify-start">
        {/* Header */}
        <div className="flex p-6 bg-white m-[40px] flex-row justify-between items-center">
          <div>
            <Image src="/Logo.png" width={150} height={87} alt="Logo" />
          </div>
          <div>
            <span className="text-[#3D5147] text-[55px] font-medium font-[amiri] mx-8">
              Pleasant Grove Farms
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="flex items-center flex-col justify-center w-[424px] h-[605px] bg-[#3D5147] rounded-3xl">
          <span className="text-white text-[40px] font-[amiri] my-7">Sign In</span>
          
          <span className="text-white text-[20px] font-[amiri] my-4">Email</span>
          <input
            className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <span className="text-white text-[20px] font-[amiri] my-4">Password</span>
          <input
            type="password"
            className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
          />
          <Button
            label={loading ? "Logging in..." : "Log In"}
            color="red"
            className="w-[120px] h-[45px] items-center font-[amiri] my-6"
            onClick={handleLogin}
          />

          {/* Error Message */}
          {error && (
            <div className="text-[#5D1214] bg-red-200 text-center mb-4 font-[amiri] rounded-lg">
              {error}
            </div>
          )}

          <Link href="/forgotPassword">
            <span className="text-white underline font-[amiri] cursor-pointer">
              Forgot Password?
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
