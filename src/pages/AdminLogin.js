import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/api";
import toast from "react-hot-toast";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        // Check if user is admin
        if (response.data.employee.role !== "admin") {
          toast.error("Access denied. Admin privileges required.");
          setLoading(false);
          return;
        }

        // Store token in localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "employee",
          JSON.stringify(response.data.employee),
        );

        toast.success("Admin login successful!");
        navigate("/admin");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      email: "admin@company.com",
      password: "admin123",
      rememberMe: false,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <div className="mb-6">
          <Link to="/" className="btn btn-ghost">
            <i data-lucide="arrow-left"></i>
            Back to Home
          </Link>
        </div>

        {/* Admin Login Card */}
        <div className="card shadow-lg">
          <div className="card-header text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <i
                  data-lucide="shield-check"
                  className="w-7 h-7 text-white"
                ></i>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Admin Portal
            </h1>
            <p className="text-gray-600">
              Sign in with administrator credentials
            </p>
          </div>

          <div className="card-content">
            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Admin Email
                </label>
                <div className="relative">
                  <i
                    data-lucide="shield"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
                  ></i>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input pl-10"
                    placeholder="admin@company.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Admin Password
                </label>
                <div className="relative">
                  <i
                    data-lucide="lock"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
                  ></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input pl-10 pr-10"
                    placeholder="Enter admin password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i
                      data-lucide={showPassword ? "eye-off" : "eye"}
                      className="w-4 h-4"
                    ></i>
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Reset Password
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full btn-lg"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Signing In...
                  </>
                ) : (
                  <>
                    <i data-lucide="shield-check" className="w-4 h-4"></i>
                    Sign In as Admin
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <i
                  data-lucide="shield-alert"
                  className="w-4 h-4 text-red-600 mt-0.5"
                ></i>
                <div>
                  <p className="text-sm font-medium text-red-900">
                    Admin Demo Credentials
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Email: admin@company.com
                    <br />
                    Password: admin123
                  </p>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="text-xs text-red-600 hover:underline mt-1"
                  >
                    Click to fill admin credentials
                  </button>
                </div>
              </div>
            </div>

            {/* Employee Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Employee access?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Employee Login Portal
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            ⚠️ Administrator access is restricted to authorized personnel only.
            <br />
            All administrative actions are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
