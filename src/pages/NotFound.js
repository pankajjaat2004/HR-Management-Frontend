import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="search-x" className="w-12 h-12 text-white"></i>
          </div>
          <h1 className="text-6xl font-bold text-gray-300 mb-2">404</h1>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            Sorry, we couldn't find the page you're looking for. The page may
            have been moved, deleted, or you may have entered an incorrect URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn btn-primary">
            <i data-lucide="home" className="w-4 h-4"></i>
            Go to Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary"
          >
            <i data-lucide="arrow-left" className="w-4 h-4"></i>
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              to="/admin-login"
              className="text-sm text-primary hover:underline"
            >
              Admin Login
            </Link>
            <span className="text-gray-300">•</span>
            <Link to="/login" className="text-sm text-primary hover:underline">
              Employee Login
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/employee"
              className="text-sm text-primary hover:underline"
            >
              Employee Portal
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/admin/add-employee"
              className="text-sm text-primary hover:underline"
            >
              Add Employee
            </Link>
          </div>
        </div>

        {/* WorkFlow Branding */}
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <i data-lucide="building-2" className="w-4 h-4 text-white"></i>
            </div>
            <span className="text-sm font-medium">WorkFlow HR System</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
