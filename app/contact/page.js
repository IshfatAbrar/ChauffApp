"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import HomeNavbar from "../../components/Home/HomeNavbar";

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease },
  }),
};

const fieldClass =
  "mt-1.5 block w-full rounded-xl border border-white/10 bg-graphite px-3.5 py-3 font-body text-[15px] text-paper placeholder-ash transition-colors focus:border-white/25 focus:outline-none";

function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <main className="min-h-screen bg-void font-display text-paper">
      <HomeNavbar />

      <section className="px-6 pb-atlas-48 pt-atlas-48 md:px-10 md:pt-atlas-64">
        <div className="mx-auto flex max-w-[44rem] flex-col items-center text-center">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ash"
          >
            Support
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.08}
            className="font-instrument text-[48px] font-normal leading-[1.05] tracking-[-0.02em] text-paper md:text-[72px] lg:text-[88px]"
          >
            Contact Chauff Support
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.16}
            className="mt-atlas-24 max-w-[34rem] text-balance font-display text-[17px] leading-[1.55] text-ash md:text-[20px]"
          >
            Tell us what you need help with and our team will follow up. For
            trip issues, please include your booking details so we can respond
            faster.
          </motion.p>
        </div>
      </section>

      <section className="px-6 pb-atlas-128 md:px-10">
        <motion.form
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.24}
          className="mx-auto w-full max-w-[36rem] rounded-[24px] border border-white/10 bg-obsidian p-6 md:p-8"
          onSubmit={handleSubmit}
        >
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
            Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleInputChange}
            className={`${fieldClass} mb-5`}
            required
          />

          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleInputChange}
            className={`${fieldClass} mb-5`}
            required
          />

          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
            Subject
          </label>
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleInputChange}
            className={`${fieldClass} mb-5`}
            required
          />

          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
            Message
          </label>
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleInputChange}
            rows={5}
            className={`${fieldClass} mb-6 resize-none`}
            required
          />

          <button
            type="submit"
            className="w-full rounded-full bg-paper py-3.5 font-body text-[15px] text-black transition-opacity hover:opacity-85"
          >
            Get in touch
          </button>
          <p className="mt-3 text-center font-mono text-[11px] leading-[1.55] text-ash">
            Submit the form for any inquiry, help, or issues.
          </p>
        </motion.form>
      </section>
    </main>
  );
}

export default ContactPage;
