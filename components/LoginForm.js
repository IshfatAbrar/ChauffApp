"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import React from "react";
import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res.error) {
        setError("Invalid credentials");
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.log(error);
    }

    if (!email || !password) {
      setError("All fields are necessary.");
      return;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-gray-900 text-white">
      <form
        className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md"
        onSubmit={handleLogin}
      >
        <h1 className="text-3xl mb-6">Login</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <label className="mb-4">
          <span className={email ? "text-sm text-gray-400" : "hidden"}>
            Email
          </span>
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="block w-full mt-1 p-3 bg-gray-700 rounded-md border-none focus:ring focus:ring-blue-500 focus:outline-none"
          />
        </label>
        <label className="mb-4">
          <span className={password ? "text-sm text-gray-400" : "hidden"}>
            Password
          </span>
          <input
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="block w-full mt-1 p-3 bg-gray-700 rounded-md border-none focus:ring focus:ring-blue-500 focus:outline-none"
          />
        </label>

        <button className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 disabled:bg-gray-400 disabled:pointer-events-none">
          Login
        </button>
        <Link href={"/signup"}>
          <p className="mt-4 text-gray-400 cursor-pointer hover:underline">
            Don't have an account? Register here.
          </p>
        </Link>
      </form>
    </div>
  );
}
