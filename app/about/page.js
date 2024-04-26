import React from "react";

function page() {
  return (
    <div className=" pb-[200px]">
      <div
        className="flex flex-col justify-end h-[450px] lg:h-[550px] bg-cover bg-center "
        style={{ backgroundImage: "url('about.jpeg')" }}
      >
        <h1 className=" text-4xl lg:text-6xl font-bold pl-8 lg:pl-[15%] pb-8 text-white">
          About Us
        </h1>
      </div>

      <div className="flex flex-col gap-24  px-8 lg:px-[15%]  pt-16 ">
        <section className=" max-w-[800px]">
          <h2 className=" text-4xl font-bold mb-[2rem]">
            We reimagine the way the world moves for the better
          </h2>
          <p className=" text-md">
            Movement is what we power. It’s our lifeblood. It runs through our
            veins. It’s what gets us out of bed each morning. It pushes us to
            constantly reimagine how we can move better. For you. For all the
            places you want to go. For all the things you want to get. For all
            the ways you want to earn. Across the entire world. In real time. At
            the incredible speed of now.
          </p>
        </section>

        <section id="safety" className=" w-full ">
          <div className="flex flex-col md:flex-row md:gap-8 lg:gap-24 w-full justify-center">
            <div>
              <div className="mb-10">
                <h2 className=" text-4xl font-bold mb-[2rem]">
                  Our commitment to safety
                </h2>
                <p className=" text-md">
                  We want you to move freely, make the most of your time, and be
                  connected to the people and places that matter most to you.
                  That's why we are committed to safety, from the creation of
                  new standards to the development of technology with the aim of
                  reducing incidents.
                </p>
              </div>
              <div className="mb-10">
                <h3 className="text-lg font-semibold">
                  An inclusive community
                </h3>
                <p className=" text-md max-w-[500px]">
                  Millions of riders and drivers share a set of Community
                  Guidelines, holding each other accountable to do the right
                  thing.
                </p>
              </div>
              <div className="mb-10">
                <h3 className="text-lg font-semibold">Support at every turn</h3>
                <p className=" text-md max-w-[500px]">
                  A specially trained team is available 24/7. Reach them in the
                  app, day or night, with any questions or safety concerns.
                </p>
              </div>
            </div>
            <img
              src="safety.jpeg"
              className=" h-[400px] object-cover object-top  w-auto rounded-xl mt-12"
            ></img>
          </div>
        </section>

        <section
          id="payment"
          className=" flex flex-row justify-center gap-24 w-full"
        >
          <div>
            <div className="mb-10">
              <h2 className=" text-4xl font-bold mb-[2rem]">
                All you need to know about Chauff payment methods
              </h2>
              <p className=" text-md">
                Arrived at your destination? No need to reach for your wallet –
                payments with Chauff are cashless and convenient. You can pay
                with your credit card or Apple Pay, and you'll receive a receipt
                by email.
              </p>
            </div>
            <div className="mb-10">
              <h3 className="text-lg font-semibold">Enjoy secure payments.</h3>
              <p className=" text-md ">
                Whether you're booking a ride for a special occasion or regular
                transportation, you can trust that your payment details are
                protected every step of the way. Enjoy convenience and
                confidence as you seamlessly complete your transactions, knowing
                that your financial data is in safe hands. Your satisfaction and
                security are our top priorities.
              </p>
            </div>
            <div className="mb-10">
              <h3 className="text-lg font-semibold">
                Unlock Seamless Transactions: Explore Our Diverse Payment
                Methods!
              </h3>
              <p className=" text-md ">
                Choose convenience and flexibility with our secure payment
                options powered by Stripe. With Stripe, we accept a wide range
                of payment methods, including credit cards, debit cards, and
                digital wallets like Apple Pay and Google Pay. Experience
                seamless transactions with our user-friendly checkout process,
                providing you with the flexibility to pay your way.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default page;
