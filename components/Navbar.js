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
      <h1 className="text-black  text-xl font-serif md:text-white">
        <b>Chauff</b>
      </h1>
      <div className="hidden md:flex md:flex-col justify-center items-center gap-2">
        <h1 className=" font-serif text-4xl">
          <b>Chauff</b>
        </h1>
        <div className="gap-5">
          <Link
            className={` px-3 cursor-pointer p-2 rounded-full ${
              currPath == "/" ? "font-semibold" : ""
            }`}
            href="/"
          >
            Home &gt;
          </Link>
          <Link
            className={` px-3 cursor-pointer p-2 rounded-full ${
              currPath == "/book" ? "font-semibold" : ""
            }`}
            href="/book"
          >
            Book a Ride &gt;
          </Link>
          <Link
            className={` px-3 cursor-pointer p-2 rounded-full ${
              currPath == "/trips" ? "font-semibold" : ""
            }`}
            href="/trips"
          >
            My Trips &gt;
          </Link>
          <Link
            className={` px-3 cursor-pointer p-2 rounded-full ${
              currPath == "/about" ? "font-semibold" : ""
            }`}
            href="/about"
          >
            About Us &gt;
          </Link>
          <Link
            className={` px-3 cursor-pointer p-2 rounded-full ${
              currPath == "/contact" ? "font-semibold" : ""
            }`}
            href="/contact"
          >
            Contact Us &gt;
          </Link>
        </div>
      </div>
      <div className="flex flex-row gap-4">
        <Link
          href={session ? "" : "/signin"}
          className={`p-2 px-3 bg-slate-200 rounded-full ${
            session ? " cursor-default" : " cursor-pointer"
          }`}
        >
          {session ? name : "Sign In"}
        </Link>
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
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
      {menuOpen && (
        <div className="flex flex-col absolute top-full right-0 bg-white border-b-[2px] border-slate-300 w-full md:hidden">
          <Link
            href="/"
            className="hover:bg-slate-50 px-3 cursor-pointer p-2 pl-8 w-full"
          >
            Home &gt;
          </Link>
          <Link
            href="/book"
            className="hover:bg-slate-50 px-3 cursor-pointer p-2 pl-8 w-full"
          >
            Book &gt;
          </Link>
          <Link
            href="/trips"
            className="hover:bg-slate-50 px-3 cursor-pointer p-2 pl-8 w-full"
          >
            History &gt;
          </Link>
          <Link
            href="/about"
            className="hover:bg-slate-50 px-3 cursor-pointer p-2 pl-8 w-full"
          >
            About Us &gt;
          </Link>
          <Link
            href="/contact"
            className="hover:bg-slate-50 px-3 cursor-pointer p-2 pl-8 w-full"
          >
            Contact Us &gt;
          </Link>
          <button
            onClick={signOut}
            className={`hover:bg-slate-50 px-3 cursor-pointer p-2 pl-8 w-full text-left ${
              session ? "" : "hidden"
            }`}
          >
            sign Out &gt;
          </button>
          <Link
            href="/signup"
            className={`hover:bg-slate-50 px-3 cursor-pointer p-2 pl-8 w-full text-left ${
              session ? "hidden" : ""
            }`}
          >
            sign Up &gt;
          </Link>
        </div>
      )}
    </div>
  );
}

export default Navbar;
