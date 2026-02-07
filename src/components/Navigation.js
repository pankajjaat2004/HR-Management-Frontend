import React from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import "../styles/components/Navigation.css";

const Navigation = ({
  variant = "default",
  showUserActions = true,
  userInfo = null,
  onLogout = null,
}) => {
  const isAdminVariant = variant === "admin";
  const isDashboardVariant = variant === "dashboard";

  return (
    <nav className="navigation">
      <div className="container navigation-container">
        <div className="navigation-brand-section">
          <Link to="/" className="navigation-brand">
            <div className="navigation-brand-icon">
              <Icon name="building-2" size={24} />
            </div>
            WorkFlow
          </Link>
          {isAdminVariant && (
            <span className="badge badge-secondary">Admin</span>
          )}
          {isDashboardVariant && userInfo && (
            <span className="badge badge-secondary">{userInfo.role}</span>
          )}
        </div>

        {showUserActions && (
          <div className="navigation-actions">
            {!isDashboardVariant && !isAdminVariant ? (
              // Default homepage navigation
              <>
                <Link to="/login" className="btn btn-ghost">
                  Employee Login
                </Link>
                <Link to="/admin-login" className="btn btn-primary">
                  Admin Login
                </Link>
              </>
            ) : (
              // Dashboard navigation
              <>
                <Link to="/" className="btn btn-ghost">
                  <Icon name="home" size={16} />
                  Home
                </Link>
                {onLogout && (
                  <button onClick={onLogout} className="btn btn-secondary">
                    <Icon name="log-out" size={16} />
                    Logout
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
