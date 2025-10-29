import React, { useState, useEffect } from "react";
import Button from "../components/button"; 
import Link from "next/link";
import Image from "next/image";
import Layout from "../components/layout";
import { supabase } from "../lib/supabaseClient";

function CreateAccount() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // listen for auth state changes and insert profile when user is confirmed/logged in
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          // Insert into your "users" table now that auth.users has the row
          const { error: profileError } = await supabase.from("users").insert({
            id: session.user.id,
            name,
            email: session.user.email,
            role,
            created_at: new Date(),
          });

          if (profileError) {
            setError(profileError.message);
          } else {
            setSuccessMessage("Account created successfully!");
            setName("");
            setEmail("");
            setPassword("");
            setRole("");
          }
        } catch (err) {
          setError(err.message);
        }
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [name, email, role]);

  const handleCreateAccount = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage("");

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character."
      );
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccessMessage(
      "Sign-up email sent! Please confirm your email to complete account creation."
    );
  };

  return (
    <Layout title="Create New Account" onSettingsClick={() => setShowSettings(!showSettings)}>
      <div className="flex flex-col items-center justify-center my-10">
        <div className="flex flex-row gap-x-10 justify-center">

          {/* Name */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-black text-[20px] font-[amiri] my-7">Name</h1>
            <input
              className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
              placeholder="Name"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-black text-[20px] font-[amiri] my-7">Email</h1>
            <input
              className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Role */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-black text-[20px] font-[amiri] my-7">Role</h1>
            <div className="p-4">
              <select
                className="border border-black-400 rounded-lg px-4 py-[18px] w-[300px] bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-black text-[20px] font-[amiri] my-7">Password</h1>
            <input
              className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
              placeholder="Password"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="w-[120px] h-[70px] bg-[#D9D9D9] rounded-md my-4"></div>
          <Button
            label={loading ? "Creating..." : "Create Account"}
            color="red"
            className="w-[160px] h-[45px] font-[amiri] items-center my-6"
            onClick={handleCreateAccount}
          />
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md">
        {successMessage && (
          <div className="bg-green-200 text-[#3D5147] p-4 rounded-md shadow-md text-center">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="text-[#5D1214] bg-red-200 text-center mb-4 font-[amiri] rounded-lg">
            {error}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default CreateAccount;
