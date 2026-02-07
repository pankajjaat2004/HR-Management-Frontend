import React from "react";
import { Link } from "react-router-dom";
import "../styles/components/HeroSection.css";

const HeroSection = ({
  badge = "Modern HR Management",
  title = "Streamline Your",
  highlightedTitle = "Workforce Management",
  description = "Comprehensive employee management system for salary tracking, attendance monitoring, leave management, and holiday planning. All in one powerful platform.",
  primaryAction = {
    text: "Get Started",
    link: "/admin-login",
    icon: "arrow-right",
  },
  secondaryAction = { text: "Employee Portal", link: "/login" },
}) => {
  return (
    <section className="hero-section">
      <div className="container hero-container">
        <div className="hero-content">
          <div className="badge badge-secondary hero-badge">{badge}</div>
          <h1 className="hero-title">
            {title}
            <span className="hero-title-highlight">{highlightedTitle}</span>
          </h1>
          <p className="hero-description">{description}</p>
          <div className="hero-actions">
            <Link to={primaryAction.link} className="btn btn-primary btn-lg">
              {primaryAction.text}
              {primaryAction.icon && <i data-lucide={primaryAction.icon}></i>}
            </Link>
            <Link to={secondaryAction.link} className="btn btn-outline btn-lg">
              {secondaryAction.text}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
