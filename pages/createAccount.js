import React, { useState } from "react";
import Button from "../components/button";
import Layout from "../components/layout";
import { supabase } from "../lib/supabaseClient";

function CreateAccount() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleCreateAccount = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage("");

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character."
      );
      setLoading(false);
      return;
    }

    // Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;

    if (!userId) {
      setError("Failed to create account: no user ID returned.");
      setLoading(false);
      return;
    }

    // Create/Update users profile row
    const { error: profileError } = await supabase
      .from("users")
      .upsert(
        { id: userId, name, email, role },
        { onConflict: "id" } // primary key
      );

    if (profileError) {
      setError("Failed to create user profile: " + profileError.message);
      setLoading(false);
      return;
    }

    setSuccessMessage("Account created successfully!");

    // Clear fields
    setName("");
    setEmail("");
    setPassword("");
    setRole("");

    setLoading(false);
  };

  return (
    <Layout title="Create New Account" showBack={true}>
      <div className="flex flex-col items-center justify-center my-10">
        <div className="flex flex-row gap-x-10 justify-center">
          {/* Name */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-black text-[20px] font-[amiri] my-7">Name</h1>
            <input
              className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-black text-[20px] font-[amiri] my-7">Email</h1>
            <input
              className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Role */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-black text-[20px] font-[amiri] my-7">Role</h1>
            <div className="p-4">
              <select
                className="border border-black-400 rounded-lg px-4 py-[18px] w-[300px] bg-white text-black"
                value={role}
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

            <div className="relative w-[300px]">
              <input
                className="p-4 w-full bg-white text-black border rounded-lg my-4 pr-12"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Eye Toggle Button */}
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
          </div>
        </div>

        {/* Button */}
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

      {/* Notification Messages */}
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md">
        {successMessage && (
          <div className="bg-green-200 text-[#3D5147] p-4 rounded-md shadow-md text-center">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="text-[#5D1214] bg-red-200 text-center mb-4 font-[amiri] rounded-lg p-4">
            {error}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default CreateAccount;
