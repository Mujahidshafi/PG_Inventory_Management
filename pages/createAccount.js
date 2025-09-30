import React, { useState } from "react"
import Button from "../components/button"; 
import Link from "next/link";
import Image from "next/image";
import Layout from "../components/layout";
import { supabase } from "../lib/supabaseClient"

function createAccount() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")

  const handleCreateAccount = async () => {
  setLoading(true)
  setError(null)
  setSuccessMessage("")

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(password)) {
    setError(
      "Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character."
    );
    setLoading(false);
    return;
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    setError(signUpError.message)
    setLoading(false)
    return
  }

  const user = signUpData.user

  const { data: profileData, error: profileError } = await supabase
    .from("users")
    .insert({
      id: user.id,
      name,
      email: user.email,
      role,
      created_at: new Date()
    })

  if (profileError) {
    setError(profileError.message)
  } else {
    setSuccessMessage("Account created successfully!")
    setName("")
    setEmail("")
    setPassword("")
    setRole("")
  }

  setLoading(false)
}


  return (
  <Layout title="Create New Account">
    <div className="flex flex-col items-center justify-center my-10">
      <div className="flex flex-row gap-x-10 justify-center">
        <div className="flex flex-col items-center justify-center">
          <div>
            <h1 className="text-black text-[20px] font-[amiri] my-7">
              Name
            </h1>
          </div>
          <div>
            <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Name" onChange={(e) => setName(e.target.value)}/>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div>
            <h1 className="text-black text-[20px] font-[amiri] my-7">
              Email
            </h1>
          </div>
          <div>
            <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Email" onChange={(e) => setEmail(e.target.value)}/>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div>
            <h1 className="text-black text-[20px] font-[amiri] my-7">
              Role
            </h1>
          </div>
          <div>
          <div className="p-4">
          <select className="border border-black-400 rounded-lg px-4 py-[18px] w-[300px] bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setRole(e.target.value)}>
              <option value="">Select</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
          </select>
          </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div>
            <h1 className="text-black text-[20px] font-[amiri] my-7">
              Password
            </h1>
          </div>
          <div>
            <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)}/>
          </div>
        </div>
        
      </div>
      <div>
          <div className="w-[120px] h-[70px] bg-[#D9D9D9] rounded-md my-4"></div>
          <div>
            <Button
              label={loading ? "Creating..." : "Create Account"}
              color="red"
              className="w-[160px] h-[45px] font-[amiri] items-center my-6"
              onClick={handleCreateAccount}
            />
          </div>
      </div>
      </div>
      <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 w-[90%] max-w-md">
      {successMessage && (
      <div className="bg-green-200 text-green-900 p-4 rounded-md shadow-md text-center">
        {successMessage}
      </div>
      )}
      {error && (
      <div className="bg-red-200 text-red-900 p-4 rounded-md shadow-md text-center">
        {error}
      </div>
      )}
    </div>
    </Layout>
  );
}

export default createAccount;