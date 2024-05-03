"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false, // Set redirect to false to handle redirect manually
      });

      if (res.error) {
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      // Check if the callbackUrl is provided in the query parameters
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl");

      // Redirect to the intended page after successful login
      if (callbackUrl) {
        window.location.href = callbackUrl;
      } else if (res.url) {
        window.location.href = res.url;
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }

    if (!email || !password) {
      setError("All fields are necessary.");
      setLoading(false);
      return;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-8 bg-white">
      <form
        className="flex flex-col bg-slate-50 p-8 rounded-lg w-full max-w-md border-slate-300 border-[2px]"
        onSubmit={handleLogin}
      >
        <h1 className=" font-mono font-bold text-slate-500  text-3xl mb-6">
          <i className="fa-solid fa-arrow-right-to-bracket"></i> Login
        </h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <label className="mb-2">
          <span className={email ? "text-sm text-gray-400" : "hidden"}>
            Email
          </span>
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="block w-full mt-1 py-2 px-3  rounded-md border-slate-300 border-[2px] focus:outline-none focus:border-slate-400"
          />
        </label>
        <label className="mb-2">
          <span className={password ? "text-sm text-gray-400" : "hidden"}>
            Password
          </span>
          <input
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="block w-full mt-1 py-2 px-3  rounded-md border-slate-300 border-[2px] focus:outline-none focus:border-slate-400"
          />
        </label>

        <button className="w-full py-1 bg-slate-200 border-slate-300 border-[2px] font-bold text-slate-500 rounded-md hover:border-slate-400 transition duration-300 font-mono text-xl">
          {loading ? (
            <div
              className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"
            >
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
          ) : (
            "Login"
          )}
        </button>

        <Link href={"/signup"}>
          <p className="mt-4 text-gray-400 cursor-pointer hover:underline">
            Don&apos;t have an account? Register here.
          </p>
        </Link>
      </form>
    </div>
  );
}
