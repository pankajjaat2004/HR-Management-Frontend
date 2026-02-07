import React from "react";
import "../styles/components/StatsSection.css";

const StatCard = ({ stat }) => (
  <div className="stat-card">
    <div className="stat-number">{stat.number}</div>
    <div className="stat-label">{stat.label}</div>
  </div>
);

const StatsSection = ({
  stats = [
    { number: "500+", label: "Companies Using WorkFlow" },
    { number: "50K+", label: "Employees Managed" },
    { number: "99.9%", label: "Uptime Guarantee" },
    { number: "24/7", label: "Support Available" },
  ],
}) => {
  return (
    <section className="stats-section">
      <div className="container stats-container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
