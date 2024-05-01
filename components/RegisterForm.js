"use client";
import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [authenticating, setAuthenticating] = useState(false);

  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !phone) {
      setError("All fields are necessary.");
      return;
    }

    try {
      const resUserExists = await fetch("api/userExists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          phone,
        }),
      });

      const { user } = await resUserExists.json();

      if (user) {
        setError("User already exists.");
        return;
      }

      if (!validateEmail(email)) {
        setError("Please enter a valid email address.");
        return;
      }

      const res = await fetch("api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });
      if (res.ok) {
        const form = e.target;
        form.reset();
        setError("");
        window.location.href = "/signin";
      } else {
        console.log("User registration failed");
      }
    } catch (error) {
      console.log("Error during registration: ", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-6 bg-gray-900 text-white">
      <form
        className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h1 className="text-3xl mb-6">Register</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <label className="mb-4">
          <span className={name ? "text-sm text-gray-400" : "hidden"}>
            Name
          </span>
          <input
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Name"
            className="block w-full mt-1 p-3 bg-gray-700 rounded-md border-none focus:ring focus:ring-blue-500 focus:outline-none"
          />
        </label>
        <label className="mb-4">
          <span className={phone ? "text-sm text-gray-400" : "hidden"}>
            Phone
          </span>
          <input
            onChange={(e) => setPhone(e.target.value)}
            type="phone"
            placeholder="Phone"
            className="block w-full mt-1 p-3 bg-gray-700 rounded-md border-none focus:ring focus:ring-blue-500 focus:outline-none"
          />
        </label>
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
        <label className="mb-4">
          <span className={confirmPass ? "text-sm text-gray-400" : "hidden"}>
            Confirm Password
          </span>
          <input
            onChange={(e) => setConfirmPass(e.target.value)}
            type="password"
            placeholder="Confirm Password"
            className="block w-full mt-1 p-3 bg-gray-700 rounded-md border-none focus:ring focus:ring-blue-500 focus:outline-none"
          />
        </label>

        <button className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 disabled:bg-gray-400 disabled:pointer-events-none">
          Register
        </button>
        <Link href={"/signin"}>
          <p className="mt-4 text-gray-400 cursor-pointer hover:underline">
            Already have an account? Login here.
          </p>
        </Link>
      </form>
    </div>
  );
}
