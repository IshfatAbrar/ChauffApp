"use client";
import React, { useState } from "react";

function Page() {
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
    <div
      className="flex flex-col justify-end h-screen bg-cover bg-center items-center pt-32"
      style={{ backgroundImage: "url('support.jpeg')" }}
    >
      <div className="flex flex-col items-center px-4 mb-12">
        <h1 className="text-4xl lg:text-6xl font-semibold text-center text-white pb-[1rem]">
          Welcome to Chauff Support
        </h1>
        <p className="text-sm lg:text-lg text-center text-white lg:w-1/2">
          We’re here to help. Looking for customer service contact information?
          Explore support resources for the relevant products below to find the
          best way to reach out about your issue.
        </p>
      </div>

      {/* Contact form */}
      <div className=" flex flex-col items-center lg:w-full  w-full p-4 bg-white">
        <form
          className="w-full lg:w-1/2 text-sm p-6 rounded-lg"
          onSubmit={handleSubmit}
        >
          <label className="font-semibold">Name</label>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleInputChange}
            className="block w-full px-2 py-2 mb-4 text-gray-700 border rounded-md focus:outline-none focus:border-black"
            required
          />
          <label className="font-semibold">Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleInputChange}
            className="block w-full px-2 py-2 mb-4 text-gray-700 border rounded-md focus:outline-none focus:border-black"
            required
          />
          <label className="font-semibold">Subject</label>
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleInputChange}
            className="block w-full px-2 py-2 mb-4 text-gray-700 border rounded-md focus:outline-none focus:border-black"
            required
          />
          <label className="font-semibold">Message</label>
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleInputChange}
            rows={4}
            className="block w-full px-2 py-2 mb-4 text-gray-700 border rounded-md resize-none focus:outline-none focus:border-black"
            required
          ></textarea>
          <button
            type="submit"
            className="w-full px-4 py-2 text-lg font-semibold text-white bg-black rounded-md hover:opacity-90 focus:outline-none "
          >
            Get in touch
          </button>
          <p className="p-1 pt-2 text-xs">
            *Submit the form for any inquiry, help, or issues.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Page;
