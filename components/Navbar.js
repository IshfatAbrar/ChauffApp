"use client";

import React, { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [showNewBookDropdown, setShowNewBookDropdown] = useState(false);

  const currPath = usePathname();
  const isBook = currPath === "/signin" || currPath === "/signup";

  const { data: session } = useSession();
  const name = session?.user?.name;

  const dropdownRef = useRef(null);
  const newDropdownRef = useRef(null);
  const hamburgerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      const visible =
        prevScrollPos > currentScrollPos || currentScrollPos === 0;
      setPrevScrollPos(currentScrollPos);
      setShowNavbar(visible);
      setMenuOpen(false);
      setShowBookDropdown(false);
    };

    const handleClickOutside = (event) => {
      console.log(event);
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBookDropdown(false);
      }
    };

    const handleClickOutsideSmall = (event) => {
      console.log(event);
      if (
        newDropdownRef.current &&
        !newDropdownRef.current.contains(event.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("mousedown", handleClickOutsideSmall);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutsideSmall);
    };
  }, [prevScrollPos]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleBookDropdown = () => {
    setShowBookDropdown(!showBookDropdown);
  };
  const toggleNewBookDropdown = () => {
    setShowNewBookDropdown(!showNewBookDropdown);
  };

  const right = <i class="fa-solid fa-chevron-right text-xs"></i>;
  const down = <i class="fa-solid fa-chevron-down text-xs"></i>;

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
        <div className="flex flex-row gap-4">
          <Link
            className={`${currPath == "/" ? "font-semibold" : ""}`}
            href="/"
          >
            Home {right}
          </Link>
          <div className="relative " ref={dropdownRef}>
            <button
              onClick={toggleBookDropdown}
              className={` w-[135px] ${
                currPath == "/book" || currPath == "/tour"
                  ? "font-semibold"
                  : ""
              }`}
            >
              Book a Ride {!showBookDropdown ? right : down}
            </button>
            {showBookDropdown && (
              <div className="absolute top-12 left-0 z-10 w-[200px] bg-white border border-slate-300 rounded-b-lg">
                <Link
                  href="/book"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Point to Point
                </Link>
                <Link
                  href="/tour"
                  className="block px-4 py-2 hover:bg-gray-100 rounded-b-lg"
                >
                  Tour
                </Link>
              </div>
            )}
          </div>
          <Link
            className={`  ${currPath == "/trips" ? "font-semibold" : ""}`}
            href="/trips"
          >
            My Trips {right}
          </Link>
          <Link
            className={`  ${currPath == "/about" ? "font-semibold" : ""}`}
            href="/about"
          >
            About Us {right}
          </Link>
          <Link
            className={`  ${currPath == "/contact" ? "font-semibold" : ""}`}
            href="/contact"
          >
            Contact Us {right}
          </Link>
        </div>
      </div>
      <div className="flex flex-row gap-4">
        <Link
          href={session ? "" : "/signin"}
          className={`p-2 px-3 rounded-full cursor-pointer bg-slate-200 ${
            session ? " cursor-default" : ""
          }`}
        >
          {session ? name : "Sign In"}
        </Link>
        <button
          className="menu-button visible md:hidden"
          ref={hamburgerRef}
          onClick={toggleMenu}
        >
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
        <div
          className="flex flex-col absolute top-full right-0 bg-white border-b-[2px] border-slate-300 w-full md:hidden"
          ref={newDropdownRef}
        >
          <Link href="/" className="hover:bg-slate-50  pl-8 w-full">
            Home {right}
          </Link>
          <button
            className="hover:bg-slate-50 text-left pl-8 w-full"
            onClick={toggleNewBookDropdown}
          >
            Book {!showNewBookDropdown ? right : down}
          </button>
          {showNewBookDropdown && (
            <Link href="/book" className="hover:bg-slate-50  pl-12 w-full">
              Point to point {right}
            </Link>
          )}
          {showNewBookDropdown && (
            <Link href="/tour" className="hover:bg-slate-50  pl-12 w-full">
              Tour {right}
            </Link>
          )}
          <Link href="/trips" className="hover:bg-slate-50  pl-8 w-full">
            Trips {right}
          </Link>
          <Link href="/about" className="hover:bg-slate-50  pl-8 w-full">
            About Us {right}
          </Link>
          <Link href="/contact" className="hover:bg-slate-50  pl-8 w-full">
            Contact Us {right}
          </Link>
          <button
            onClick={signOut}
            className={`hover:bg-slate-50  pl-8 w-full text-left ${
              session ? "" : "hidden"
            }`}
          >
            sign Out {right}
          </button>
          <Link
            href="/signup"
            className={`hover:bg-slate-50  pl-8 w-full text-left ${
              session ? "hidden" : ""
            }`}
          >
            sign Up {right}
          </Link>
        </div>
      )}
    </div>
  );
}

export default Navbar;
