import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import Button from "../components/button.js";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 👈 NEW
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
      .maybeSingle();

    let userRole = profile?.role;

    if (!profile) {
      const { data: insertedProfile, error: insertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || "",
          role: "employee",
        })
        .select()
        .single();

      if (insertError) {
        setError("Failed to create profile: " + insertError.message);
        setLoading(false);
        return;
      }

      userRole = insertedProfile.role;
    }

    if (userRole === "admin") {
      router.push("/adminMenu");
    } else if (userRole === "employee") {
      router.push("/employeeMenu");
    } else {
      setError("User role is not valid.");
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
      </div>

      <div className="min-h-screen bg-white rounded-lg flex flex-col items-center justify-start">
        {/* Header */}
        <div className="flex p-6 bg-white m-[40px] flex-row justify-between items-center">
          <Image src="/Logo.png" width={150} height={87} alt="Logo" />
          <span className="text-[#3D5147] text-[55px] font-medium font-[amiri] mx-8">
            Pleasant Grove Farms
          </span>
        </div>

        {/* Form */}
        <div className="flex items-center flex-col justify-center w-[424px] h-[605px] bg-[#3D5147] rounded-3xl">
          <span className="text-white text-[40px] font-[amiri] my-7">Sign In</span>

          {/* Email */}
          <span className="text-white text-[20px] font-[amiri] my-4">Email</span>
          <input
            className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <span className="text-white text-[20px] font-[amiri] my-4">Password</span>

          <div className="relative w-[300px]">
            <input
              type={showPassword ? "text" : "password"} // 👈 show/hide
              className="p-4 w-full bg-white text-black border rounded-lg"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
            />

            {/* Eye Button */}
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  // Eye open
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
                  // Eye closed
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
            label={loading ? "Logging in..." : "Log In"}
            color="red"
            className="w-[120px] h-[45px] items-center font-[amiri] my-6"
            onClick={handleLogin}
          />

          {error && (
            <div className="text-[#5D1214] bg-red-200 text-center mb-4 font-[amiri] rounded-lg px-3 py-2">
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
