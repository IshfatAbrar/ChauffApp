"use client";

import React from "react";
import HomeNavbar from "./../components/Home/HomeNavbar";
import Hero from "./../components/Home/Hero";
import Invite from "./../components/Home/Invite";
import StackCarousel from "./../components/Home/StackCarousel";
import FeatureBlock from "./../components/Home/FeatureBlock";
import FeatureList from "./../components/Home/FeatureList";
import TripIntelligence from "./../components/Home/TripIntelligence";
import ClosingCTA from "./../components/Home/ClosingCTA";

export default function Home() {
  return (
    <main className="min-h-screen bg-void font-display text-paper">
      <div className="bg-void">
        <HomeNavbar />
        <Hero />
      </div>
      <div className="hide-in-pwa">
        <Invite />
        <StackCarousel />
        <FeatureBlock />
        <FeatureList />
        <TripIntelligence />
        <ClosingCTA />
      </div>
    </main>
  );
}
