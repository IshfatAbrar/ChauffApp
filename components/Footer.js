"use client";
import React from "react";
import { usePathname } from "next/navigation";

function Footer() {
  const currPath = usePathname();
  const isBook = currPath === "/book";
  return (
    <div
      className={` flex flex-col gap-6 items-center justify-center bg-slate-100 border-t-[2px] border-slate-300 p-8 py-10 ${
        isBook ? "hidden" : ""
      }`}
    >
      <div className="flex flex-row gap-12" id="links">
        <a href="/home" className="text-slate-500 hover:text-slate-900">
          Home
        </a>
        <a href="/about" className="text-slate-500 hover:text-slate-900">
          About
        </a>
        <a href="/contact" className="text-slate-500 hover:text-slate-900">
          Contact
        </a>
        <a href="/history" className="text-slate-500 hover:text-slate-900">
          History
        </a>
      </div>
      <div id="socials" className="flex flex-row gap-12 text-xl">
        <a
          href="https://facebook.com"
          className="text-slate-500 hover:text-slate-900"
        >
          <i className="fa-brands fa-facebook"></i>
        </a>
        <a
          href="https://twitter.com"
          className="text-slate-500 hover:text-slate-900"
        >
          <i className="fa-brands fa-x-twitter"></i>
        </a>
        <a
          href="https://instagram.com"
          className="text-slate-500 hover:text-slate-900"
        >
          <i className="fa-brands fa-instagram"></i>
        </a>
        <a
          href="https://linkedin.com"
          className="text-slate-500 hover:text-slate-900"
        >
          <i className="fa-brands fa-linkedin-in"></i>
        </a>
      </div>
      <div id="copyright" className="text-slate-500">
        © 2024 Chauff Inc. All rights reserved.
      </div>
    </div>
  );
}

export default Footer;
