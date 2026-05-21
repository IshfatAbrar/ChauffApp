"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

function ContactPage() {
  // State variables to store form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here, you can implement your logic to handle form submission,
    // such as sending the form data to a backend server
    console.log(formData);
    // Reset form after submission
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900 pt-36 lg:pt-40 pb-24">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pb-10 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-500 shadow-sm mb-6"
        >
          Support
          <span className="text-slate-300">—</span>
          we&apos;re here to help
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-4xl md:text-5xl lg:text-[3.2rem] font-bold tracking-tight leading-[1.1] mb-4
                     bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500
                     bg-clip-text text-transparent"
        >
          Contact Chauff Support
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="text-sm md:text-base text-slate-500 leading-relaxed max-w-xl mx-auto"
        >
          Tell us what you need help with and our team will follow up. For trip
          issues, please include your booking details so we can respond faster.
        </motion.p>
      </section>

      {/* Contact form */}
      <section className="max-w-3xl mx-auto px-4">
        <motion.form
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="w-full text-sm p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm"
          onSubmit={handleSubmit}
        >
          <label className="font-semibold">Name</label>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 mb-4 text-gray-700 border border-slate-200 rounded-md focus:outline-none focus:border-slate-900"
            required
          />
          <label className="font-semibold">Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 mb-4 text-gray-700 border border-slate-200 rounded-md focus:outline-none focus:border-slate-900"
            required
          />
          <label className="font-semibold">Subject</label>
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 mb-4 text-gray-700 border border-slate-200 rounded-md focus:outline-none focus:border-slate-900"
            required
          />
          <label className="font-semibold">Message</label>
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleInputChange}
            rows={4}
            className="block w-full px-3 py-2 mb-4 text-gray-700 border border-slate-200 rounded-md resize-none focus:outline-none focus:border-slate-900"
            required
          ></textarea>
          <button
            type="submit"
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-full hover:bg-slate-800 focus:outline-none shadow-md"
          >
            Get in touch
          </button>
          <p className="p-1 pt-2 text-xs">
            *Submit the form for any inquiry, help, or issues.
          </p>
        </motion.form>
      </section>
    </main>
  );
}

export default ContactPage;
