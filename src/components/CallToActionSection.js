import React from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import "../styles/components/CallToActionSection.css";

const CallToActionSection = ({
  title = "Ready to Transform Your HR Operations?",
  description = "Join hundreds of companies that have streamlined their workforce management with WorkFlow. Start your journey today.",
  showStars = true,
  primaryAction = {
    text: "Start Free Trial",
    link: "/admin-login",
    icon: "arrow-right",
  },
  secondaryAction = { text: "Schedule Demo", onClick: () => {} },
}) => {
  return (
    <section className="cta-section">
      <div className="container cta-container">
        <div className="cta-card card bg-primary-light border-0">
          <div className="card-content cta-content">
            {showStars && (
              <div className="cta-stars">
                <div className="cta-stars-container">
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} name="star" className="cta-star" size={16} />
                  ))}
                </div>
              </div>
            )}
            <h3 className="cta-title">{title}</h3>
            <p className="cta-description">{description}</p>
            <div className="cta-actions">
              <Link to={primaryAction.link} className="btn btn-primary btn-lg">
                {primaryAction.text}
                {primaryAction.icon && (
                  <Icon name={primaryAction.icon} size={16} />
                )}
              </Link>
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="btn btn-outline btn-lg"
                >
                  {secondaryAction.text}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
