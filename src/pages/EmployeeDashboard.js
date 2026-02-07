import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/api";
import toast from "react-hot-toast";

import Navigation from "../components/Navigation";
import LeaveRequestForm from "../components/LeaveRequestForm";
import CallsDataSection from "../components/CallsDataSection";
import "../styles/components/EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({
    total: 0,
    used: 0,
    remaining: 0,
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [todayStatus, setTodayStatus] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString(),
  );
  const navigate = useNavigate();

  const [payslips, setPayslips] = useState([]);

  const [monthlyHours, setMonthlyHours] = useState(0);

  // Manual time refresh function
  const refreshTime = () => {
    setCurrentTime(new Date().toLocaleTimeString());
    toast.success("Time refreshed!");
  };

  // Fetch employee profile
  const fetchEmployee = async () => {
    try {
      const response = await apiClient.get("/api/employees/me");
      if (response.data.success && response.data.employee) {
        setEmployee(response.data.employee);
      } else {
        toast("Error in fetching Employee");
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
    }
  };

  // Fetch attendance records
  const fetchAttendance = async () => {
    try {
      const response = await apiClient.get("/api/attendance/my?limit=20");
      if (response.data.success && response.data.attendanceRecords) {
        const formattedAttendance = response.data.attendanceRecords.map(
          (record) => ({
            date: new Date(record.date).toLocaleDateString(),
            clockIn: record.clockIn
              ? new Date(record.clockIn).toLocaleTimeString()
              : "N/A",
            clockOut: record.clockOut
              ? new Date(record.clockOut).toLocaleTimeString()
              : "N/A",
            hours: record.totalHours ? record.totalHours.toFixed(1) : "0",
            status: record.status,
          }),
        );
        setAttendance(formattedAttendance);

        // Calculate monthly hours
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRecords = response.data.attendanceRecords.filter(
          (record) => {
            const recordDate = new Date(record.date);
            return (
              recordDate.getMonth() === currentMonth &&
              recordDate.getFullYear() === currentYear
            );
          },
        );
        const totalMonthlyHours = monthlyRecords.reduce(
          (sum, record) => sum + (record.totalHours || 0),
          0,
        );
        setMonthlyHours(totalMonthlyHours);
      } else {
        setAttendance([]);
        setMonthlyHours(0);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance([]);
      setMonthlyHours(0);
    }
  };

  // Fetch leave records
  const fetchLeaves = async () => {
    try {
      const response = await apiClient.get("/api/leaves/my");
      if (response.data.success && response.data.leaves) {
        const formattedLeaves = response.data.leaves.map((leave) => ({
          _id: leave._id,
          type: leave.type,
          startDate: new Date(leave.startDate).toLocaleDateString(),
          endDate: new Date(leave.endDate).toLocaleDateString(),
          days: leave.totalDays || leave.days,
          status: leave.status,
          reason: leave.reason,
          createdAt: leave.createdAt,
        }));
        setLeaves(formattedLeaves);

        // Calculate leave balance
        const currentYear = new Date().getFullYear();
        const yearlyLeaves = response.data.leaves.filter((leave) => {
          const leaveYear = new Date(leave.startDate).getFullYear();
          return leaveYear === currentYear && leave.status === "Approved";
        });

        const usedDays = yearlyLeaves.reduce(
          (sum, leave) => sum + (leave.totalDays || leave.days || 0),
          0,
        );

        const totalAllowed = 4; // Company leave allowance
        const remaining = Math.max(0, totalAllowed - usedDays);

        setLeaveBalance({
          total: totalAllowed,
          used: usedDays,
          remaining: remaining,
        });
      } else {
        toast("🔍 No leaves data found");
        setLeaves([]);
        setLeaveBalance({
          total: 4,
          used: 0,
          remaining: 4,
        });
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
      setLeaves([]);
      setLeaveBalance({
        total: 4,
        used: 0,
        remaining: 4,
      });
    }
  };

  // Fetch holidays
  const fetchHolidays = async () => {
    try {
      const response = await apiClient.get("/api/holidays/upcoming?limit=10");
      if (response.data.success && response.data.holidays) {
        setHolidays(response.data.holidays);
      } else {
        toast("Error in fetching Holidays");
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setHolidays([]);
    }
  };

  // Fetch today's attendance status
  const fetchTodayStatus = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await apiClient.get(`/api/attendance/today?date=${today}`);

      if (response.data.success && response.data.attendance) {
        const record = response.data.attendance;
        const newStatus = {
          clockedIn: !!record.clockIn,
          clockedOut: !!record.clockOut,
          clockInTime: record.clockIn ? new Date(record.clockIn) : null,
          clockOutTime: record.clockOut ? new Date(record.clockOut) : null,
          totalHours: record.totalHours || 0,
          status: record.status,
        };

        setTodayStatus(newStatus);
      } else {
        toast("🔍 No attendance record found");

        // If no attendance record found, set default state
        setTodayStatus({
          clockedIn: false,
          clockedOut: false,
          clockInTime: null,
          clockOutTime: null,
          totalHours: 0,
          status: "Not Set",
        });
      }
    } catch (error) {
      console.error("Error fetching today's status:", error);
      setTodayStatus({
        clockedIn: false,
        clockedOut: false,
        clockInTime: null,
        clockOutTime: null,
        totalHours: 0,
        status: "Error",
      });
    }
  };

  // Fetch payslips
  const fetchPayslips = async () => {
    try {
      const response = await apiClient.get("/api/payslips");
      if (response.data.success && response.data.payslips) {
        toast.success("PaySlip fetch success")
        setPayslips(response.data.payslips);
      } else {
        toast.error("No payslip found");
        setPayslips([]);
      }
    } catch (error) {
      console.error("Error fetching payslips:", error);
      setPayslips([]);
    }
  };

  // Handle payslip download
  const handlePayslipDownload = async (payslipId, fileName) => {
    try {
      const response = await apiClient.get(`/api/payslips/download/${payslipId}`, {
        responseType: "blob",
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up
      window.URL.revokeObjectURL(url);

      toast.success("Payslip downloaded successfully!");

      // Refresh payslips to update download count
      fetchPayslips();
    } catch (error) {
      console.error("Error downloading payslip:", error);

      if (error.response?.status === 403) {
        toast.error("Access denied. This payslip doesn't belong to you.");
        console.log("403 Error details:", error.response?.data);
      } else if (error.response?.status === 404) {
        toast.error("Payslip not found.");
      } else {
        toast.error("Failed to download payslip. Please try again.");
      }
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      // Starting dashboard initialization

      const token = localStorage.getItem("token");
      if (!token) {
        // No token found, redirecting to login
        navigate("/login");
        return;
      }

      // Token found, setting up dashboard

      try {
        // Token is automatically included by apiClient interceptor

        // Basic fallback data set, setting loading to false
        setLoading(false);

        // Now fetch real data in background
        // Fetching real data in background
        Promise.allSettled([
          fetchEmployee().catch((err) => {
            /* Employee fetch failed */
          }),
          fetchAttendance().catch((err) => {}),
          fetchLeaves().catch((err) => {}),
          fetchHolidays().catch((err) => {}),
          fetchTodayStatus().catch((err) => {}),
          fetchPayslips().catch((err) => {}),
        ]).then(() => {
          // Background data loading completed
        });
      } catch (error) {
        console.error("Dashboard initialization error:", error);
        toast.error("Failed to load dashboard data");
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate]);

  const handleClockIn = async () => {
    try {
      const response = await apiClient.post("/api/attendance/clock-in");
      if (response.data.success) {
        const record = response.data.attendance;
        setTodayStatus((prev) => ({
          ...prev,
          clockedIn: true,
          clockInTime: new Date(record.clockIn),
          status: "Present",
        }));
        toast.success("Clocked in successfully!");
        // Refresh attendance data
        fetchAttendance();
      } else {
        toast.error("Failed to clock in");
      }
    } catch (error) {
      console.error("Clock in error:", error);
      console.error(
        "Error response data:",
        JSON.stringify(error.response?.data, null, 2),
      );

      if (error.response?.status === 400) {
        const response = error.response?.data;
        const message = response?.message;

        if (response?.code === "ALREADY_CLOCKED_IN") {
          const existing = response.existingRecord;

          // Immediately update the UI state with the existing record
          const newStatus = {
            clockedIn: true,
            clockedOut: !!existing.clockOut,
            clockInTime: existing.clockIn ? new Date(existing.clockIn) : null,
            clockOutTime: existing.clockOut
              ? new Date(existing.clockOut)
              : null,
            totalHours: existing.totalHours || 0,
            status: existing.status || "Present",
          };

          setTodayStatus(newStatus);

          // Force a re-render by updating state again in next tick
          setTimeout(() => {
            setTodayStatus({ ...newStatus }); // Create new object to force re-render
          }, 100);

          if (existing?.canClockOut) {
            toast.error("You're already clocked in! You can clock out now.");
          } else {
            toast.error("You have already completed attendance for today.");
          }

          // Also refresh from server to ensure sync
          setTimeout(() => {
            fetchTodayStatus();
          }, 200);
        } else if (message?.includes("Invalid employee ID")) {
          toast.error("Authentication error. Please logout and login again.");
        } else {
          toast.error(message || "Clock in failed");
        }
      } else if (error.response?.status === 401) {
        toast.error("Authentication required. Please login again.");
      } else {
        toast.error("Failed to clock in. Please try again.");
      }
    }
  };

  const handleClockOut = async () => {
    try {
      const response = await apiClient.post("/api/attendance/clock-out");
      if (response.data.success) {
        const record = response.data.attendance;
        setTodayStatus((prev) => ({
          ...prev,
          clockedOut: true,
          clockOutTime: new Date(record.clockOut),
          totalHours: record.totalHours || 0,
        }));
        toast.success("Clocked out successfully!");
        // Refresh attendance data
        fetchAttendance();
      } else {
        toast.error("Failed to clock out");
      }
    } catch (error) {
      console.error("Clock out error:", error);

      if (error.response?.status === 400) {
        const message = error.response?.data?.message;
        if (message?.includes("already clocked out")) {
          toast.error("You have already clocked out today!");
          // Refresh today's status to update UI
          fetchTodayStatus();
        } else {
          toast.error(message || "Clock out failed");
        }
      } else if (error.response?.status === 404) {
        toast.error("No clock-in record found. Please clock in first.");
        // Refresh today's status to update UI
        fetchTodayStatus();
      } else if (error.response?.status === 401) {
        toast.error("Authentication required. Please login again.");
      } else {
        toast.error("Failed to clock out. Please try again.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employee");
    navigate("/login");
  };

  const handleChangePassword = async (formData) => {
    try {
      const response = await apiClient.put("/api/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        toast.success("Password changed successfully!");
        setShowChangePasswordModal(false);
        // Reset form by closing and opening modal
      } else {
        toast.error(response.data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Change password error:", error);

      if (error.response?.status === 400) {
        toast.error(
          error.response.data.message || "Current password is incorrect",
        );
      } else if (error.response?.status === 404) {
        toast.error("Employee not found");
      } else {
        toast.error("Failed to change password. Please try again.");
      }
    }
  };

  const ChangePasswordModal = () => {
    const [formData, setFormData] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    const [showPasswords, setShowPasswords] = useState({
      current: false,
      new: false,
      confirm: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const togglePasswordVisibility = (field) => {
      setShowPasswords((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    };

    const validateForm = () => {
      if (!formData.currentPassword) {
        toast.error("Current password is required");
        return false;
      }
      if (!formData.newPassword) {
        toast.error("New password is required");
        return false;
      }
      if (formData.newPassword.length < 6) {
        toast.error("New password must be at least 6 characters");
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return false;
      }
      if (formData.currentPassword === formData.newPassword) {
        toast.error(
          "New password must be different from current password",
        );
        return false;
      }
      return true;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await handleChangePassword(formData);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCancel = () => {
      setShowChangePasswordModal(false);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    };

    return (
      <div className="modal-overlay" onClick={handleCancel}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Change Password</h3>
            <button
              onClick={handleCancel}
              className="modal-close-btn"
              title="Close"
            >
              ×
            </button>
          </div>
          <p className="modal-description">
            Update your password to keep your account secure. Password must be
            at least 6 characters long.
          </p>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="currentPassword" className="form-label">
                Current Password *
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="password-toggle-btn"
                >
                  {showPasswords.current ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                New Password *
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="password-toggle-btn"
                >
                  {showPasswords.new ? "Hide" : "Show"}
                </button>
              </div>
              <p className="form-hint">
                Minimum 6 characters, must be different from current password
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password *
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="password-toggle-btn"
                >
                  {showPasswords.confirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const LeaveRequestModal = () => {
    const handleLeaveSubmit = async (formData) => {
      try {
        const response = await apiClient.post("/api/leaves", formData);
        if (response.data.success) {
          toast.success("Leave request submitted successfully!");
          setShowLeaveModal(false);
          // Refresh leave data
          fetchLeaves();
        } else {
          toast("Failed to submit leave request");
        }
      } catch (error) {
        console.error("Leave request error:", error);
        toast.error("Failed to submit leave request");
        throw error; // Re-throw to handle in form component
      }
    };

    const handleCancel = () => {
      setShowLeaveModal(false);
    };

    return (
      <div className="modal-overlay" onClick={handleCancel}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Submit Leave Request</h3>
            <button
              onClick={handleCancel}
              className="modal-close-btn"
              title="Close"
            >
              ×
            </button>
          </div>
          <p className="modal-description">
            Fill in the details for your leave request. All fields marked with *
            are required.
          </p>
          <LeaveRequestForm
            onSubmit={handleLeaveSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {showLeaveModal && <LeaveRequestModal />}
      {showChangePasswordModal && <ChangePasswordModal />}
      <div className="min-h-screen bg-gray-50">
        <Navigation
          variant="dashboard"
          userInfo={{ role: "Employee" }}
          onLogout={handleLogout}
        />

        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {employee?.name?.split(" ")[0]}!
            </h1>
            <p className="text-gray-600">
              Manage your profile, track attendance, and submit requests
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="card bg-primary-light border-0">
              <div className="card-content">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">
                      Clock In/Out
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-primary">
                        {currentTime}
                      </p>
                      <button
                        onClick={refreshTime}
                        className="btn btn-ghost btn-sm p-1"
                        title="Refresh Time"
                      >
                        ⟳
                      </button>
                    </div>
                  </div>
                  <i data-lucide="timer" className="w-8 h-8 text-primary"></i>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleClockIn}
                      className="btn btn-primary btn-sm"
                    >
                      <strong>Clock In</strong>
                    </button>
                    <button
                      onClick={handleClockOut}
                      className="btn btn-secondary btn-sm"
                    >
                      <strong>Clock Out</strong>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Leave Balance
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {leaveBalance.remaining} days
                    </p>
                  </div>
                  <i
                    data-lucide="calendar-check"
                    className="w-8 h-8 text-gray-400"
                  ></i>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      This Month
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {monthlyHours.toFixed(0)}h
                    </p>
                  </div>
                  <i data-lucide="clock" className="w-8 h-8 text-gray-400"></i>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Payslips Available
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {payslips.length}
                    </p>
                    {payslips.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Latest: {payslips[0]?.monthYear}
                      </p>
                    )}
                  </div>
                  <i
                    data-lucide="file-text"
                    className="w-8 h-8 text-gray-400"
                  ></i>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <div className="mb-6">
            {/* Desktop Tab Navigation */}
            <div className="desktop-tabs-only space-x-1 bg-gray-200 p-1">
              {[
                "overview",
                "profile",
                "attendance",
                "leaves",
                "calls",
                "holidays",
                "payslips",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 main-content-button py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? "active bg-white text-gray-900 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Mobile Tab Navigation */}
            <div className="md:hidden relative">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-200 rounded-lg border border-gray-300"
              >
                <span className="font-medium text-gray-900">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    showMobileMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Mobile Dropdown Menu */}
              {showMobileMenu && (
                <div className="mobile-dropdown absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {[
                    "overview",
                    "profile",
                    "attendance",
                    "leaves",
                    "calls",
                    "holidays",
                    "payslips",
                  ].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setShowMobileMenu(false); // Auto-close menu
                      }}
                      className={`mobile-dropdown-item w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-100 last:border-b-0 ${
                        activeTab === tab
                          ? "bg-blue-50 text-blue-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recent Attendance</h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    {attendance.slice(0, 3).map((record, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{record.date}</p>
                          <p className="text-sm text-gray-500">
                            {record.clockIn} - {record.clockOut}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="badge badge-success">
                            {record.status}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {record.hours}h
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Upcoming Events</h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Team Meeting</p>
                        <p className="text-sm text-gray-500">
                          Tomorrow at 2:00 PM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Performance Review</p>
                        <p className="text-sm text-gray-500">
                          Jan 25, 2024 at 10:00 AM
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Company Holiday</p>
                        <p className="text-sm text-gray-500">
                          Jan 26, 2024 - Martin Luther King Jr. Day
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="card-title flex items-center gap-2">
                      <i data-lucide="user"></i>
                      Personal Information
                    </h3>
                    <p className="card-description">
                      View and update your personal details
                    </p>
                  </div>
                  <button
                    onClick={() => setShowChangePasswordModal(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    <strong>Change Password</strong>
                  </button>
                </div>
              </div>
              <div className="card-content">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Full Name</label>
                      <p className="text-lg">{employee?.name}</p>
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <p className="text-lg">{employee?.email}</p>
                    </div>
                    <div>
                      <label className="form-label">Employee ID</label>
                      <p className="text-lg">{employee?.employeeId}</p>
                    </div>
                    <div>
                      <label className="form-label">Department</label>
                      <p className="text-lg">{employee?.department}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Position</label>
                      <p className="text-lg">{employee?.position}</p>
                    </div>
                    <div>
                      <label className="form-label">Salary</label>
                      <p className="text-lg">{employee?.salary} Rs/- per month</p>
                    </div>
                    <div>
                      <label className="form-label">Start Date</label>
                      <p className="text-lg">{(employee?.startDate).split('T')[0]}</p>
                    </div>
                    <div>
                      <label className="form-label">Phone</label>
                      <p className="text-lg">{employee?.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center gap-2">
                  <i data-lucide="clock"></i>
                  Attendance History
                </h3>
                <p className="card-description">
                  View your clock-in and clock-out records
                </p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {attendance.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{record.date}</p>
                        <p className="text-sm text-gray-500">
                          {record.clockIn} - {record.clockOut}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="badge badge-success">
                          {record.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {record.hours} hours
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "leaves" && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="card-title flex items-center gap-2">
                      <strong>Leave Requests</strong>
                    </h3>
                    <p className="card-description">
                      Submit new requests and track existing ones
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="btn btn-primary"
                  >
                    <strong>Request Leave</strong>
                  </button>
                </div>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {leaves.length > 0 ? (
                    leaves.map((leave, index) => (
                      <div
                        key={leave._id || index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-lg">{leave.type}</p>
                            <span
                              className={`badge ${
                                leave.status === "Approved"
                                  ? "badge-success"
                                  : leave.status === "Rejected"
                                    ? "badge-error"
                                    : "badge-warning"
                              }`}
                            >
                              {leave.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {leave.startDate} - {leave.endDate} ({leave.days}{" "}
                            days)
                          </p>
                          <p className="text-sm text-gray-500">
                            
                            {leave.reason}
                          </p>
                          {leave.createdAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Submitted:{" "}
                              {new Date(leave.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="ml-4">
                          {leave.status === "Pending" && (
                            <div className="flex items-center text-orange-500">
                              <span className="text-sm font-medium">
                                Awaiting Approval
                              </span>
                            </div>
                          )}
                          {leave.status === "Approved" && (
                            <div className="flex items-center text-green-500">
                              <span className="text-sm font-medium">
                                Approved
                              </span>
                            </div>
                          )}
                          {leave.status === "Rejected" && (
                            <div className="flex items-center text-red-500">
                              <span className="text-sm font-medium">
                                Rejected
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Leave Requests
                      </h3>
                      <p className="text-gray-600 mb-4">
                        You haven't submitted any leave requests yet.
                      </p>
                      <button
                        onClick={() => setShowLeaveModal(true)}
                        className="btn btn-primary btn-sm"
                      >
                        Submit Your First Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "calls" && (
            <CallsDataSection
              employeeId={employee?._id}
              isCheckedOut={todayStatus?.clockedOut}
              onDataUpdated={() => {
                fetchTodayStatus();
              }}
            />
          )}

          {activeTab === "holidays" && (
            <div className="space-y-6">
              {/* Holiday Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Total Holidays
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {holidays.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Upcoming
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {
                            holidays.filter(
                              (h) => new Date(h.date) >= new Date(),
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-content">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Office Closed
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {
                            holidays.filter(
                              (h) =>
                                h.isOfficeClose &&
                                new Date(h.date) >= new Date(),
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Holidays */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title flex items-center gap-2">
                    Upcoming Holidays
                  </h3>
                  <p className="card-description">
                    Company holidays and important dates
                  </p>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    {holidays
                      .filter((holiday) => new Date(holiday.date) >= new Date())
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .slice(0, 10)
                      .map((holiday) => (
                        <div
                          key={holiday._id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center">
                            <div
                              className={`p-3 rounded-full mr-4 ${
                                holiday.type === "National"
                                  ? "bg-blue-100 text-blue-600"
                                  : holiday.type === "Religious"
                                    ? "bg-purple-100 text-purple-600"
                                    : holiday.type === "Company"
                                      ? "bg-green-100 text-green-600"
                                      : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {holiday.name}
                              </h4>
                              {holiday.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {holiday.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <span
                                  className={`badge ${
                                    holiday.type === "National"
                                      ? "badge-success"
                                      : holiday.type === "Religious"
                                        ? "badge-warning"
                                        : holiday.type === "Company"
                                          ? "badge-default"
                                          : "badge-secondary"
                                  }`}
                                >
                                  {holiday.type}
                                </span>
                                {holiday.isOfficeClose && (
                                  <span className="badge badge-error">
                                    Office Closed
                                  </span>
                                )}
                                {holiday.isRecurring && (
                                  <span className="badge badge-secondary">
                                    Recurring
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {new Date(holiday.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(() => {
                                const holidayDate = new Date(holiday.date);
                                const today = new Date();
                                const diffTime =
                                  holidayDate.getTime() - today.getTime();
                                const diffDays = Math.ceil(
                                  diffTime / (1000 * 60 * 60 * 24),
                                );

                                if (diffDays === 0) return "Today";
                                if (diffDays === 1) return "Tomorrow";
                                if (diffDays < 7) return `${diffDays} days`;
                                if (diffDays < 30)
                                  return `${Math.ceil(diffDays / 7)} weeks`;
                                return `${Math.ceil(diffDays / 30)} months`;
                              })()}
                            </p>
                          </div>
                        </div>
                      ))}
                    {holidays.filter((h) => new Date(h.date) >= new Date())
                      .length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No upcoming holidays found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Today's Holiday (if any) */}
              {holidays.some((h) => {
                const today = new Date();
                const holidayDate = new Date(h.date);
                return today.toDateString() === holidayDate.toDateString();
              }) && (
                <div className="card border-2 border-yellow-200 bg-yellow-50">
                  <div className="card-content">
                    {holidays
                      .filter((h) => {
                        const today = new Date();
                        const holidayDate = new Date(h.date);
                        return (
                          today.toDateString() === holidayDate.toDateString()
                        );
                      })
                      .map((holiday) => (
                        <div key={holiday._id} className="flex items-center">
                          <div className="p-3 bg-yellow-200 rounded-full mr-4">

                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-yellow-800">
                              🎉 Today is {holiday.name}!
                            </h3>
                            {holiday.description && (
                              <p className="text-yellow-700 mt-1">
                                {holiday.description}
                              </p>
                            )}
                            {holiday.isOfficeClose && (
                              <p className="text-sm text-yellow-600 mt-2">
                                📢 Office is closed today. Enjoy your holiday!
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "payslips" && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="card-title flex items-center gap-2">
                      My Payslips
                    </h3>
                    <p className="card-description">
                      Download and view your salary statements
                    </p>
                  </div>
                  <button
                    onClick={fetchPayslips}
                    className="btn btn-secondary btn-sm"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {payslips.length > 0 ? (
                    payslips.map((payslip) => (
                      <div
                        key={payslip.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <p className="font-medium text-lg">
                                {payslip.monthYear}
                              </p>
                              <p className="text-sm text-gray-500">
                                {payslip.fileName}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-600 ml-11">
                            <span>
                              File Size: {Math.round(payslip.fileSize / 1024)}{" "}
                              KB
                            </span>
                            <span>
                              Uploaded:{" "}
                              {new Date(
                                payslip.uploadedAt,
                              ).toLocaleDateString()}
                            </span>
                            {payslip.downloadedAt && (
                              <span>
                                Last Downloaded:{" "}
                                {new Date(
                                  payslip.downloadedAt,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-secondary text-xs">
                            Downloads: {payslip.downloadCount}
                          </span>
                          <button
                            onClick={() =>
                              handlePayslipDownload(
                                payslip.id,
                                payslip.fileName,
                              )
                            }
                            className="btn btn-primary btn-sm"
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Payslips Available
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your payslips will appear here once uploaded by HR.
                      </p>
                      <button
                        onClick={fetchPayslips}
                        className="btn btn-secondary btn-sm"
                      >
                        Check for Updates
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeDashboard;
