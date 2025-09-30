import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient"; // make sure this points to your client
import Button from "../components/button"; 
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";


function login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async () => {
  setLoading(true);
  setError(null);

  const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
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

  // redirect based on role
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
    <>
      <div className="min-h-screen bg-white flex flex-col items-center justify-start">

        <div className="flex p-6 bg-white m-[40px] flex-row justify-between items-center">
          <div>
            <Image 
              src="/Logo.png" 
              width={150}
              height={87}
              alt="Logo" 
            />
          </div>
          <div>
            <span className="text-[#3D5147] text-[55px] font-medium font-[amiri] mx-8">Pleasant Grove Farms</span>
          </div>
        </div>

        <div className="flex items-center flex-col justify-center w-[424px] h-[605px] bg-[#3D5147] rounded-3xl">
          <span className="text-white text-[40px] font-[amiri] my-7">Sign In</span>
          <span className="text-white text-[20px] font-[amiri] my-4">Email</span>
          <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}/>
          <span className="text-white text-[20px] font-[amiri] my-4">Password</span>
          <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>

            <Button 
              label={loading ? "Logging in..." : "Log In"}
              color="red"
              className="w-[120px] h-[45px] font-[amiri] items-center my-6"
              onClick={handleLogin}
            />

          <Link href="/forgotPassword">
            <span className="text-white underline cursor-pointer">Forgot Password?</span>
          </Link>
        </div>
        
      </div>
    </>
  );
}

export default login;