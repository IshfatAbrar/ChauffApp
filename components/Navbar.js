"use client";

import React, { useState, useEffect } from "react";

import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const currPath = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      const visible =
        prevScrollPos > currentScrollPos || currentScrollPos === 0;
      setPrevScrollPos(currentScrollPos);
      setShowNavbar(visible);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div
      className={`z-50 fixed w-full bg-white p-4 px-5 flex items-center justify-between border-b-[2px] border-slate-300 transition-transform ${
        showNavbar ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <h1>
        <b>Chauff</b>
      </h1>
      <div className="hidden md:flex gap-5">
        <Link
          className={`hover:bg-slate-50 px-3 cursor-pointer p-2 rounded-full ${
            currPath == "/" ? "bg-slate-50" : ""
          }`}
          href="/"
        >
          Home
        </Link>

        <Link
          className={`hover:bg-slate-50 px-3 cursor-pointer p-2 rounded-full ${
            currPath == "/book" ? "bg-slate-50" : ""
          }`}
          href="/book"
        >
          Book a Ride
        </Link>

        <SignedIn>
          <Link
            className={`hover:bg-slate-50 px-3 cursor-pointer p-2 rounded-full ${
              currPath == "/trips" ? "bg-slate-50" : ""
            }`}
            href="/trips"
          >
            My Trips
          </Link>
        </SignedIn>

        <Link
          className={`hover:bg-slate-50 px-3 cursor-pointer p-2 rounded-full ${
            currPath == "/about" ? "bg-slate-50" : ""
          }`}
          href="/about"
        >
          About Us
        </Link>

        <Link
          className={`hover:bg-slate-50 px-3 cursor-pointer p-2 rounded-full ${
            currPath == "/contact" ? "bg-slate-50" : ""
          }`}
          href="/contact"
        >
          Contact Us
        </Link>
      </div>
      <div className="flex flex-row gap-4">
        <UserButton />
        <button className="menu-button visible md:hidden" onClick={toggleMenu}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="absolute top-full right-0 bg-white border-b-[2px] border-slate-300 w-full md:hidden">
          <h2 className="hover:bg-slate-50 px-3 cursor-pointer p-2">Home</h2>
          <h2 className="hover:bg-slate-50 px-3 cursor-pointer p-2">Book</h2>
          <h2 className="hover:bg-slate-50 px-3 cursor-pointer p-2">History</h2>
          <h2 className="hover:bg-slate-50 px-3 cursor-pointer p-2">
            About Us
          </h2>
          <h2 className="hover:bg-slate-50 px-3 cursor-pointer p-2">
            Contact Us
          </h2>
        </div>
      )}
    </div>
  );
}

export default Navbar;
