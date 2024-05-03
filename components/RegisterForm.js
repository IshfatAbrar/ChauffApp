"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const router = useRouter();

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

    if (password !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setAuthenticating(true);
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
        setAuthenticating(false);
        return;
      }

      if (!validateEmail(email)) {
        setError("Please enter a valid email address.");
        setAuthenticating(false);
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
        setAuthenticating(false);
        router.push("/signin");
      } else {
        console.log("User registration failed");
        setAuthenticating(false);
      }
    } catch (error) {
      console.log("Error during registration: ", error);
      setAuthenticating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-8 bg-white">
      <form
        className="flex flex-col bg-slate-50 p-8 rounded-lg w-full max-w-md border-slate-300 border-[2px]"
        onSubmit={handleSubmit}
      >
        <h1 className="font-bold font-mono text-slate-500 text-3xl mb-6">
          <i class="fa-solid fa-pen-to-square"></i> Register
        </h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <label className="mb-2">
          <span className={name ? "text-sm text-gray-400" : "hidden"}>
            Name
          </span>
          <input
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Name"
            className="block w-full mt-1 py-2 px-3 rounded-md border-slate-300 border-[2px] focus:outline-none focus:border-slate-400"
          />
        </label>
        <label className="mb-2">
          <span className={phone ? "text-sm text-gray-400" : "hidden"}>
            Phone
          </span>
          <input
            onChange={(e) => setPhone(e.target.value)}
            type="phone"
            placeholder="Phone"
            className="block w-full mt-1 py-2 px-3 rounded-md border-slate-300 border-[2px] focus:outline-none focus:border-slate-400"
          />
        </label>
        <label className="mb-2">
          <span className={email ? "text-sm text-gray-400" : "hidden"}>
            Email
          </span>
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="block w-full mt-1 py-2 px-3 rounded-md border-slate-300 border-[2px] focus:outline-none focus:border-slate-400"
          />
        </label>
        <label className="mb-2">
          <span className={password ? "text-sm text-gray-400" : "hidden"}>
            Password
          </span>
          <input
            key="password"
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="block w-full mt-1 py-2 px-3 rounded-md border-slate-300 border-[2px] focus:outline-none focus:border-slate-400"
          />
        </label>
        <label className="mb-2">
          <span className={confirmPass ? "text-sm text-gray-400" : "hidden"}>
            Confirm Password
          </span>
          <input
            key="confirmPass"
            onChange={(e) => setConfirmPass(e.target.value)}
            type="password"
            placeholder="Confirm Password"
            className="block w-full mt-1 py-2 px-3 rounded-md border-slate-300 border-[2px] focus:outline-none focus:border-slate-400"
          />
        </label>

        <button className="w-full py-1 bg-slate-200 border-slate-300 border-[2px] font-bold text-slate-500 rounded-md hover:border-slate-400 transition duration-300 font-mono text-xl">
          {authenticating ? (
            <div
              className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"
            >
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
          ) : (
            "Register"
          )}
        </button>
        <Link href="/signin">
          <p className="mt-4 text-gray-400 cursor-pointer hover:underline">
            Already have an account? Login here.
          </p>
        </Link>
      </form>
    </div>
  );
}
