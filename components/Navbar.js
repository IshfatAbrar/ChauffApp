"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);

  const currPath = usePathname();
  const isBook = currPath === "/signin" || currPath === "/signup";

  const { data: session } = useSession();
  const name = session?.user?.name;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      const visible =
        prevScrollPos > currentScrollPos || currentScrollPos === 0;
      setPrevScrollPos(currentScrollPos);
      setShowNavbar(visible);
      setMenuOpen(false);
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
      } ${isBook ? "hidden" : ""}`}
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

        <Link
          className={`hover:bg-slate-50 px-3 cursor-pointer p-2 rounded-full ${
            currPath == "/trips" ? "bg-slate-50" : ""
          }`}
          href="/trips"
        >
          My Trips
        </Link>

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
        <h1
          className={`p-2 px-3 bg-slate-200 rounded-full ${
            session ? "" : "hidden"
          }`}
        >
          {name}
        </h1>
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
        <button
          onClick={signOut}
          className={`text-slate-400 ${
            session ? "hidden md:flex md:items-center" : "hidden"
          }`}
        >
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
      {menuOpen && (
        <div className="flex flex-col absolute top-full right-0 bg-white border-b-[2px] border-slate-300 w-full md:hidden">
          <Link
            href="/"
            className="hover:bg-slate-50 px-3 cursor-pointer p-2 w-full"
          >
            Home
          </Link>
          <Link
            href="/book"
            className="hover:bg-slate-50 px-3 cursor-pointer p-2 w-full"
          >
            Book
          </Link>
          <Link
            href="/trips"
            className="hover:bg-slate-50 px-3 cursor-pointer p-2 w-full"
          >
            History
          </Link>
          <Link
            href="/about"
            className="hover:bg-slate-50 px-3 cursor-pointer p-2 w-full"
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className="hover:bg-slate-50 px-3 cursor-pointer p-2 w-full"
          >
            Contact Us
          </Link>
          <button
            onClick={signOut}
            className={`hover:bg-slate-50 px-3 cursor-pointer p-2 w-full text-left ${
              session ? "" : "hidden"
            }`}
          >
            sign Out
          </button>
          <Link
            href="/signin"
            className={`hover:bg-slate-50 px-3 cursor-pointer p-2 w-full text-left ${
              session ? "hidden" : ""
            }`}
          >
            sign In
          </Link>
        </div>
      )}
    </div>
  );
}

export default Navbar;
