import React from "react";
import Navigation from "../components/Navigation";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import StatsSection from "../components/StatsSection";
import CallToActionSection from "../components/CallToActionSection";
import Footer from "../components/Footer";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <CallToActionSection
        secondaryAction={{
          text: "Schedule Demo",
          onClick: () => alert("Demo scheduling coming soon!"),
        }}
      />
      <Footer />
    </div>
  );
};

export default HomePage;
