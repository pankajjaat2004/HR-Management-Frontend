import React from "react";
import Icon from "./Icon";
import "../styles/components/Footer.css";

const FooterSection = ({ title, links }) => (
  <div className="footer-section">
    <h4 className="footer-section-title">{title}</h4>
    <ul className="footer-links">
      {links.map((link, index) => (
        <li key={index}>
          <a href={link.href || "#"} className="footer-link">
            {link.text}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = ({
  brandName = "WorkFlow",
  brandDescription = "Modern HR management solution for growing businesses.",
  sections = [
    {
      title: "Product",
      links: [
        { text: "Features", href: "#" },
        { text: "Pricing", href: "#" },
        { text: "Integrations", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { text: "About", href: "#" },
        { text: "Careers", href: "#" },
        { text: "Contact", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { text: "Help Center", href: "#" },
        { text: "Documentation", href: "#" },
        { text: "Status", href: "#" },
      ],
    },
  ],
  copyright = "© 2024 WorkFlow. All rights reserved.",
}) => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-brand-header">
              <div className="navigation-brand-icon">
                <Icon name="building-2" size={24} />
              </div>
              <span className="footer-brand-name">{brandName}</span>
            </div>
            <p className="footer-brand-description">{brandDescription}</p>
          </div>

          {sections.map((section, index) => (
            <FooterSection
              key={index}
              title={section.title}
              links={section.links}
            />
          ))}
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">{copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
