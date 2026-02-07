import React from "react";
import "../styles/components/FeaturesSection.css";

const FeatureCard = ({ feature }) => {
  return (
    <div className="feature-card card">
      <div className="card-header">
        <div className="feature-icon">{feature.icon}</div>
        <h3 className="card-title">{feature.title}</h3>
        <p className="card-description">{feature.description}</p>
      </div>
      <div className="card-content">
        <ul className="feature-benefits">
          {feature.benefits.map((benefit, idx) => (
            <li key={idx} className="feature-benefit">
              <i
                data-lucide="check-circle-2"
                className="feature-benefit-icon"
              ></i>
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const FeaturesSection = ({
  title = "Everything You Need to Manage Your Team",
  description = "Powerful features designed to simplify HR operations and empower your workforce",
  features = [],
}) => {
  const defaultFeatures = [
    {
      icon: "💰",
      title: "Salary Management",
      description:
        "Track and manage employee salaries with detailed payroll processing and reporting",
      benefits: [
        "Automated payroll calculations",
        "Salary history tracking",
        "Tax and deduction management",
      ],
    },
    {
      icon: "⏰",
      title: "Attendance Tracking",
      description:
        "Monitor employee attendance with real-time tracking and comprehensive analytics",
      benefits: [
        "Real-time clock in/out",
        "Overtime calculations",
        "Attendance reports",
      ],
    },
    {
      icon: "📅",
      title: "Leave Management",
      description:
        "Streamlined leave requests, approvals, and balance tracking for all employees",
      benefits: [
        "Leave request workflow",
        "Balance tracking",
        "Calendar integration",
      ],
    },
    {
      icon: "👥",
      title: "Employee Portal",
      description:
        "Self-service portal for employees to access their information and submit requests",
      benefits: [
        "Personal dashboard",
        "Document access",
        "Request submissions",
      ],
    },
    {
      icon: "📊",
      title: "Analytics & Reports",
      description:
        "Comprehensive reporting and analytics to make data-driven HR decisions",
      benefits: [
        "Custom reports",
        "Performance metrics",
        "Export capabilities",
      ],
    },
    {
      icon: "🔒",
      title: "Security & Compliance",
      description:
        "Enterprise-grade security with role-based access and audit trails",
      benefits: ["Role-based access", "Audit logging", "Data encryption"],
    },
  ];

  const displayFeatures = features.length > 0 ? features : defaultFeatures;

  return (
    <section className="features-section">
      <div className="container features-container">
        <div className="features-header">
          <h2 className="features-title">{title}</h2>
          <p className="features-description">{description}</p>
        </div>

        <div className="features-grid">
          {displayFeatures.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
