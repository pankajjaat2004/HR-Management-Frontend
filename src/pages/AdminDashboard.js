import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/api";
import toast from "react-hot-toast";
import Navigation from "../components/Navigation";
import Icon from "../components/Icon";
import AdminCallerDataSection from "../components/AdminCallerDataSection";
import AdminAddCallerDataSection from "../components/AdminAddCallerDataSection";
import "../styles/components/AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [showPayslipUploadModal, setShowPayslipUploadModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    department: "all",
    position: "all",
    status: "all",
    role: "all",
  });
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [attendanceEmployeeFilter, setAttendanceEmployeeFilter] = useState("all");
  const navigate = useNavigate();

  // Fetch data functions
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        navigate("/admin-login");
        return;
      }

      const response = await apiClient.get("/api/employees");

      if (response.data.success) {
        setEmployees(response.data.employees);
        toast.success("Employees loaded successfully!");
      } else {
        toast.error("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed");
        navigate("/admin-login");
      } else {
        toast.error("Failed to fetch employees");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

    const fetchAttendance = useCallback(async (employeeId = null) => {
    try {
      let url = "/api/attendance/all";
      if (employeeId && employeeId !== "all") {
        url += `?employee=${employeeId}`;
      }

      const response = await apiClient.get(url);
      if (response.data.success && response.data.attendanceRecords) {
        // Transform attendance data to match our table format
        const transformedAttendance = response.data.attendanceRecords.map(
          (record, index) => ({
            id: record._id || index,
            name: record.employee?.name || "Unknown",
            date: new Date(record.date).toLocaleDateString(),
            clockIn: record.clockIn
              ? new Date(record.clockIn).toLocaleTimeString()
              : "-",
            clockOut: record.clockOut
              ? new Date(record.clockOut).toLocaleTimeString()
              : "-",
            hours: record.totalHours || 0,
            status: record.status || "NA",
          }),
        );
        setAttendance(transformedAttendance);
      } else {
        toast.error("Error fetching Attendance data");
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  }, []);

  const fetchLeaves = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/leaves");
      if (response.data.success && response.data.leaves) {
        // Transform leaves data to match our table format
        const transformedLeaves = response.data.leaves.map((leave) => ({
          id: leave._id,
          name: leave.employee?.name || "Unknown",
          employeeId: leave.employee?.employeeId || "N/A",
          type: leave.type,
          startDate: new Date(leave.startDate).toLocaleDateString(),
          endDate: new Date(leave.endDate).toLocaleDateString(),
          days:
            leave.totalDays ||
            leave.days ||
            Math.ceil(
              (new Date(leave.endDate) - new Date(leave.startDate)) /
                (1000 * 60 * 60 * 24),
            ) + 1,
          status: leave.status,
          reason: leave.reason,
          createdAt: leave.createdAt,
          _id: leave._id,
        }));
        setLeaves(transformedLeaves);
      } else {
        toast.error("Error fetching Leaves");
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
    }
  }, []);

  const handleApproveLeave = async (leaveId) => {
    try {
      const response = await apiClient.put(`/api/leaves/${leaveId}/approve`);
      if (response.data.success) {
        toast.success("Leave request approved successfully!");
        fetchLeaves(); // Refresh leave requests
      } else {
        throw new Error(response.data.message || "Failed to approve leave");
      }
    } catch (error) {
      console.error("Error approving leave:", error);
      toast.error(
        error.response?.data?.message || "Failed to approve leave request",
      );
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      const response = await apiClient.put(`/api/leaves/${leaveId}/reject`);
      if (response.data.success) {
        toast.success("Leave request rejected successfully!");
        fetchLeaves(); // Refresh leave requests
      } else {
        toast.error("Failed to reject leave");
      }
    } catch (error) {
      console.error("Error rejecting leave:", error);
      toast.error(
        error.response?.data?.message || "Failed to reject leave request",
      );
    }
  };

  const fetchHolidays = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/holidays");
      if (response.data.success && response.data.holidays) {
        setHolidays(response.data.holidays);
      } else {
        toast.error("Error fetching Holidays");
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  }, []);

  const fetchPayslips = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/payslips");
      if (response.data.success && response.data.payslips) {
        setPayslips(response.data.payslips);
      } else {
        toast.error("Error fetching Payslips");
      }
    } catch (error) {
      console.error("Error fetching payslips:", error);
    }
  }, []);

  const handleHolidaySubmit = async (holidayData) => {
    try {
      if (editingHoliday) {
        // Update holiday
        const response = await apiClient.put(
          `/api/holidays/${editingHoliday._id}`,
          holidayData,
        );
        if (response.data.success) {
          toast.success("Holiday updated successfully!");
          fetchHolidays(); // Refresh holidays list
        }
      } else {
        // Create new holiday
        const response = await apiClient.post("/api/holidays", holidayData);
        if (response.data.success) {
          toast.success("Holiday created successfully!");
          fetchHolidays(); // Refresh holidays list
        }
      }
      setShowAddHolidayModal(false);
      setEditingHoliday(null);
    } catch (error) {
      console.error("Error submitting holiday:", error);
      toast.error(error.response?.data?.message || "Failed to save holiday");
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        const response = await apiClient.delete(`/api/holidays/${holidayId}`);
        if (response.data.success) {
          toast.success("Holiday deleted successfully!");
          fetchHolidays(); // Refresh holidays list
        }
      } catch (error) {
        console.error("Error deleting holiday:", error);
        toast.error(
          error.response?.data?.message || "Failed to delete holiday",
        );
      }
    }
  };

  const handlePayslipUpload = async (payslipData) => {
    try {
      const formData = new FormData();
      formData.append("payslip", payslipData.file);
      formData.append("employeeId", payslipData.employeeId);
      formData.append("month", payslipData.month);
      formData.append("year", payslipData.year);

      const response = await apiClient.post("/api/payslips/upload", formData);

      if (response.data.success) {
        toast.success("Payslip uploaded successfully!");
        fetchPayslips(); // Refresh payslips list
        setShowPayslipUploadModal(false);
      }
    } catch (error) {
      console.error("Error uploading payslip:", error);
      toast.error(error.response?.data?.message || "Failed to upload payslip");
    }
  };

  const handleDeletePayslip = async (payslipId) => {
    if (window.confirm("Are you sure you want to delete this payslip?")) {
      try {
        const response = await apiClient.delete(`/api/payslips/${payslipId}`);
        if (response.data.success) {
          toast.success("Payslip deleted successfully!");
          fetchPayslips(); // Refresh payslips list
        }
      } catch (error) {
        console.error("Error deleting payslip:", error);
        toast.error(
          error.response?.data?.message || "Failed to delete payslip",
        );
      }
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
    } catch (error) {
      console.error("Error downloading payslip:", error);
      toast.error("Failed to download payslip. Please try again.");
    }
  };

  const stats = [
    {
      title: "Total Employees",
      value: employees.length,
    },
    {
      title: "Present Today",
      value: (attendance || []).filter((a) => a.status === "Present").length,
    },
    {
      title: "Monthly Payroll",
      value: `${(employees || []).reduce((sum, emp) => sum + (emp.salary || 0), 0).toLocaleString()} Rs/-`,
    },
    {
      title: "Pending Leaves",
      value: (leaves || []).filter((l) => l.status === "Pending").length,
      change: "Requires approval",
    },
  ];

  // Fetch recent activity from backend
  const fetchRecentActivity = useCallback(async () => {
    try {
      const activities = [];

      // Fetch recent attendance records
      const attendanceResponse = await apiClient.get("/api/attendance/all?limit=5");
      if (
        attendanceResponse.data.success &&
        attendanceResponse.data.attendanceRecords
      ) {
        attendanceResponse.data.attendanceRecords.forEach((record) => {
          if (record.clockIn) {
            activities.push({
              type: "success",
              message: `${record.employee?.name || "Employee"} clocked in`,
              time: new Date(record.clockIn).toLocaleString(),
              timestamp: new Date(record.clockIn),
            });
          }
        });
      }

      // Fetch recent leave requests
      const leavesResponse = await apiClient.get("/api/leaves?limit=5");
      if (leavesResponse.data.success && leavesResponse.data.leaves) {
        leavesResponse.data.leaves.forEach((leave) => {
          const statusType =
            leave.status === "Approved"
              ? "success"
              : leave.status === "Pending"
                ? "warning"
                : "info";
          activities.push({
            type: statusType,
            message: `Leave request ${leave.status.toLowerCase()} for ${leave.employee?.name || "Employee"}`,
            time: new Date(leave.createdAt).toLocaleString(),
            timestamp: new Date(leave.createdAt),
          });
        });
      }

      // Sort by timestamp and take the 5 most recent
      const sortedActivities = activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map((activity) => {
          // Format relative time
          const now = new Date();
          const diff = now - activity.timestamp;
          const minutes = Math.floor(diff / 60000);
          const hours = Math.floor(diff / 3600000);
          const days = Math.floor(diff / 86400000);

          let timeStr;
          if (minutes < 1) timeStr = "Just now";
          else if (minutes < 60)
            timeStr = `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
          else if (hours < 24)
            timeStr = `${hours} hour${hours !== 1 ? "s" : ""} ago`;
          else timeStr = `${days} day${days !== 1 ? "s" : ""} ago`;

          return {
            ...activity,
            time: timeStr,
          };
        });

      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error(" Error fetching recent activity:", error);
    }
  }, []);

  // Fetch department statistics
  const fetchDepartmentStats = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/employees/departments/stats");
      if (response.data.success) {
        const stats = response.data.stats;
        // Calculate total employees for percentage calculation
        const totalEmployees = stats.reduce((sum, dept) => sum + dept.count, 0);

        // Transform data for UI
        const departmentData = stats.map((dept) => ({
          name: dept._id,
          count: dept.count,
          width: `${Math.round((dept.count / totalEmployees) * 100)}%`,
        }));

        setDepartmentStats(departmentData);
      } else {
        console.log("⚠️ Department stats API returned unsuccessful response");
      }
    } catch (error) {
      console.error("Error fetching department stats:", error);
    }
  }, []);

  // Delete employee function with window.confirm
  const handleDeleteEmployee = async (employee) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete employee "${employee.name}"?\n\nThis action cannot be undone. The employee will be marked as terminated.`,
    );

    if (!confirmDelete) {
      return;
    }

    console.log("Attempting to delete employee:", employee);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        navigate("/admin-login");
        return;
      }
      const response = await apiClient.delete(`/api/employees/${employee.id}`);

      if (response.data.success) {
        toast.success(`Employee ${employee.name} deleted successfully!`);
        // Refresh the employees list
        fetchEmployees();
      } else {
        toast.error("Failed to delete employee");
      }
    } catch (error) {
      console.error("Delete employee error:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed");
        navigate("/admin-login");
      } else if (error.response?.status === 404) {
        toast.error("Employee not found");
      } else {
        const message =
          error.response?.data?.message || "Failed to delete employee";
        toast.error(message);
      }
    }
  };

  // Filter and search employees
  const filterAndSearchEmployees = useCallback(() => {
    let filtered = [...employees];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (employee) =>
          employee.name?.toLowerCase().includes(searchLower) ||
          employee.email?.toLowerCase().includes(searchLower) ||
          employee.employeeId?.toLowerCase().includes(searchLower) ||
          employee.department?.toLowerCase().includes(searchLower) ||
          employee.position?.toLowerCase().includes(searchLower),
      );
    }

    // Apply department filter
    if (filterOptions.department !== "all") {
      filtered = filtered.filter(
        (employee) => employee.department === filterOptions.department,
      );
    }

    // Apply position filter
    if (filterOptions.position !== "all") {
      filtered = filtered.filter(
        (employee) => employee.position === filterOptions.position,
      );
    }

    // Apply status filter
    if (filterOptions.status !== "all") {
      filtered = filtered.filter(
        (employee) => employee.status === filterOptions.status,
      );
    }

    // Apply role filter
    if (filterOptions.role !== "all") {
      filtered = filtered.filter(
        (employee) => employee.role === filterOptions.role,
      );
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, filterOptions]);

  // Effect to apply filters when data changes
  useEffect(() => {
    filterAndSearchEmployees();
  }, [filterAndSearchEmployees]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter option change
  const handleFilterChange = (filterType, value) => {
    setFilterOptions((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

    // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterOptions({
      department: "all",
      position: "all",
      status: "all",
      role: "all",
    });
  };

    // Handle attendance employee filter change
  const handleAttendanceEmployeeFilter = async (employeeId) => {
    setAttendanceEmployeeFilter(employeeId);
    await fetchAttendance(employeeId);
  };

  // Export employees to Excel
  const handleExportEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        navigate("/admin-login");
        return;
      }

      const response = await apiClient.get("/api/employees/export", {
        responseType: "blob",
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `employees_${timestamp}.xlsx`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up
      window.URL.revokeObjectURL(url);
      toast.success("Employee data exported successfully!");
    } catch (error) {
      console.error("Error exporting employees:", error);
      if (error.response?.status === 401) {
        toast.error("Authentication failed");
        navigate("/admin-login");
      } else {
        toast.error("Failed to export employee data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filter options
  const getUniqueValues = (field) => {
    const values = employees.map((emp) => emp[field]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Add refresh function for overview data
  const refreshOverviewData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchRecentActivity(), fetchDepartmentStats()]);
    setLoading(false);
  }, [fetchRecentActivity, fetchDepartmentStats]);

  useEffect(() => {
    // Check authentication and admin role
    const token = localStorage.getItem("token");
    const employee = localStorage.getItem("employee");

    if (!token || !employee) {
      toast.error("Please login to access admin dashboard");
      navigate("/admin-login");
      return;
    }

    try {
      const employeeData = JSON.parse(employee);
      if (employeeData.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate("/admin-login");
        return;
      }
    } catch (error) {
      toast.error("Invalid session. Please login again.");
      navigate("/admin-login");
      return;
    }

    // Token is automatically included by apiClient interceptor

    // Fetch all data
    fetchEmployees();
    fetchAttendance();
    fetchLeaves();
    fetchHolidays();
    fetchPayslips();
    fetchRecentActivity();
    fetchDepartmentStats();
  }, [
    navigate,
    fetchEmployees,
    fetchAttendance,
    fetchLeaves,
    fetchHolidays,
    fetchPayslips,
    fetchRecentActivity,
    fetchDepartmentStats,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        variant="admin"
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("employee");
          toast.success("Logged out successfully");
          navigate("/admin-login");
        }}
      />

      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage employees, attendance, Leaves, Holidays, Payslips and more.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="spinner"></div>
            <span className="ml-2">Loading data...</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="card">
              <div className="card-content">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <div className="mb-6">
          {/* Desktop Tab Navigation */}
          <div className="desktop-tabs-only space-x-1 bg-gray-200 p-1">
            {[
              "overview",
              "employees",
              "attendance",
              "leaves",
              "caller-data",
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
                  "employees",
                  "attendance",
                  "leaves",
                  "caller-data",
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
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={refreshOverviewData}
                className="btn btn-secondary"
                disabled={loading}
              >
                ⟳ Refresh
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title flex items-center gap-2">
                    Recent Activity
                  </h3>
                </div>
                <div className="card-content">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="spinner"></div>
                      <span className="ml-2">Loading activity...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                activity.type === "success"
                                  ? "bg-green-500"
                                  : activity.type === "warning"
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                              }`}
                            ></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {activity.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {activity.time}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No recent activity found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Department Overview</h3>
                </div>
                <div className="card-content">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="spinner"></div>
                      <span className="ml-2">Loading departments...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {departmentStats.length > 0 ? (
                        departmentStats.map((dept, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{dept.name}</span>
                            <div className="department-stat-info">
                              <div className="progress-bar-container">
                                <div
                                  className="progress-bar-fill"
                                  style={{ width: dept.width }}
                                ></div>
                              </div>
                              <span className="department-stat-count">
                                {dept.count}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No department data found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "employees" && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="card-title">Employee Management</h3>
                  <p className="card-description">
                    Manage employee information, salaries, and positions
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/admin/add-employee" className="btn btn-primary">
                    <Icon name="user-plus" size={16} />
                    Add Employee
                  </Link>
                  <button
                    onClick={fetchEmployees}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    <Icon name="refresh-cw" size={16} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  
                  <input
                    type="text"
                    placeholder="🔎 Search employees..."
                    className="form-input pl-10"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowFilterModal(true)}
                >
                  <Icon name="filter" size={16} />
                  Filter
                  {(filterOptions.department !== "all" ||
                    filterOptions.position !== "all" ||
                    filterOptions.status !== "all" ||
                    filterOptions.role !== "all") && (
                    <span className="ml-1 bg-primary text-white text-xs px-1 rounded-full">
                      •
                    </span>
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleExportEmployees}
                  disabled={loading}
                >
                  <Icon name="download" size={16} />
                  Export
                </button>
              </div>

              
              {/* Filter Modal */}
              {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-90vh overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        <Icon name="filter" className="inline mr-2" size={20} />
                        Filter Employees
                      </h3>
                      <button
                        onClick={() => setShowFilterModal(false)}
                        className="btn btn-ghost btn-sm"
                      >
                        <Icon name="x" size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Department Filter */}
                      <div>
                        <label className="form-label">Department</label>
                        <select
                          className="form-select"
                          value={filterOptions.department}
                          onChange={(e) =>
                            handleFilterChange("department", e.target.value)
                          }
                        >
                          <option value="all">All Departments</option>
                          {getUniqueValues("department").map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Position Filter */}
                      <div>
                        <label className="form-label">Position</label>
                        <select
                          className="form-select"
                          value={filterOptions.position}
                          onChange={(e) =>
                            handleFilterChange("position", e.target.value)
                          }
                        >
                          <option value="all">All Positions</option>
                          {getUniqueValues("position").map((position) => (
                            <option key={position} value={position}>
                              {position}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={filterOptions.status}
                          onChange={(e) =>
                            handleFilterChange("status", e.target.value)
                          }
                        >
                          <option value="all">All Statuses</option>
                          {getUniqueValues("status").map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Role Filter */}
                      <div>
                        <label className="form-label">Role</label>
                        <select
                          className="form-select"
                          value={filterOptions.role}
                          onChange={(e) => handleFilterChange("role", e.target.value)}
                        >
                          <option value="all">All Roles</option>
                          {getUniqueValues("role").map((role) => (
                            <option key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Active Filters Summary */}
                      {(searchTerm ||
                        Object.values(filterOptions).some(
                          (val) => val !== "all",
                        )) && (
                        <div className="bg-blue-50 p-3 rounded border">
                          <p className="text-sm font-medium text-blue-800 mb-2">
                            Active Filters:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {searchTerm && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                Search: "{searchTerm}"
                              </span>
                            )}
                            {Object.entries(filterOptions).map(
                              ([key, value]) =>
                                value !== "all" && (
                                  <span
                                    key={key}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                                  >
                                    {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
                                    {value}
                                  </span>
                                ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                      <button onClick={clearFilters} className="btn btn-secondary">
                        <Icon name="x-circle" className="mr-1" size={16} />
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowFilterModal(false)}
                        className="btn btn-primary"
                      >
                        <Icon name="check" className="mr-1" size={16} />
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Results Summary */}
              {(searchTerm ||
                Object.values(filterOptions).some((val) => val !== "all")) && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="filter" className="btn btn-secondary" size={16} />
                      <span className="text-sm font-medium btn-secondary">
                        Showing {filteredEmployees.length} of {employees.length}{" "}
                        employees
                      </span>
                    </div>
                    <button
                      onClick={clearFilters}
                      className="text-m text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {searchTerm && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        Search: "{searchTerm}"
                      </span>
                    )}
                    {Object.entries(filterOptions).map(
                      ([key, value]) =>
                        value !== "all" && (
                          <span
                            key={key}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
                            {value}
                          </span>
                        ),
                    )}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Position</th>
                      <th>Salary</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr key={employee._id || employee.id}>
                        <td>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-gray-500">
                              {employee.email}
                            </p>
                          </div>
                        </td>
                        <td>{employee.department}</td>
                        <td>{employee.position}</td>
                        <td>${employee.salary?.toLocaleString()}</td>
                        <td>
                          <span className="badge badge-success">
                            {employee.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/admin/edit-employee/${employee._id || employee.id}`}
                              className="btn btn-ghost btn-sm"
                              title="Edit Employee"
                            >
                              <Icon name="edit" size={16} />
                            </Link>
                            <button
                              className="btn btn-ghost btn-sm"
                              title="Delete Employee"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log(
                                  "Delete button clicked for employee:",
                                  employee,
                                );
                                handleDeleteEmployee({
                                  id: employee._id || employee.id,
                                  name: employee.name,
                                  email: employee.email,
                                });
                              }}
                            >
                              <Icon name="trash-2" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredEmployees.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {employees.length === 0
                      ? "No employees found. Add some employees to get started."
                      : "No employees match your search and filter criteria."}
                    {(searchTerm ||
                      Object.values(filterOptions).some(
                        (val) => val !== "all",
                      )) && (
                      <button
                        onClick={clearFilters}
                        className="btn btn-ghost btn-sm mt-2 ml-2"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {activeTab === "attendance" && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="card-title">Attendance Tracking</h3>
                  <p className="card-description">
                    Monitor daily attendance and working hours
                  </p>
                </div>
                <button
                  onClick={() => fetchAttendance(attendanceEmployeeFilter)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  <Icon name="refresh-cw" size={16} />
                  Refresh
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <label className="form-label">Filter by Employee</label>
                                    <select
                    className="form-select"
                    value={attendanceEmployeeFilter}
                    onChange={(e) => handleAttendanceEmployeeFilter(e.target.value)}
                  >
                    <option value="all">All Employees</option>
                    {employees
                      .filter((employee) => employee.role !== "admin")
                      .map((employee) => (
                        <option key={employee._id || employee.id} value={employee._id || employee.id}>
                          {employee.name} ({employee.employeeId})
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record.id}>
                        <td className="font-medium">{record.name}</td>
                        <td>{record.date}</td>
                        <td>{record.clockIn}</td>
                        <td>{record.clockOut}</td>
                        <td>{record.hours}h</td>
                        <td>
                          <span
                            className={`badge ${
                              record.status === "Present"
                                ? "badge-success"
                                : "badge-error"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "leaves" && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Leave Management</h3>
              <p className="card-description">
                Review and approve employee leave requests
              </p>
            </div>
            <div className="card-content">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length > 0 ? (
                      leaves.map((leave) => (
                        <tr key={leave.id}>
                          <td>
                            <div>
                              <p className="font-medium">{leave.name}</p>
                              <p className="text-sm text-gray-500">
                                {leave.employeeId}
                              </p>
                            </div>
                          </td>
                          <td>{leave.type}</td>
                          <td>{leave.startDate}</td>
                          <td>{leave.endDate}</td>
                          <td>{leave.days}</td>
                          <td>
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
                          </td>
                          <td>
                            {leave.status === "Pending" ? (
                              <div className="flex gap-2">
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() =>
                                    handleApproveLeave(leave._id || leave.id)
                                  }
                                  title="Approve leave request"
                                >
                                  <Icon name="check" size={16} />
                                  Approve
                                </button>
                                <button
                                  className="btn btn-error btn-sm"
                                  onClick={() =>
                                    handleRejectLeave(leave._id || leave.id)
                                  }
                                  title="Reject leave request"
                                >
                                  <Icon name="x" size={16} />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">
                                {leave.status === "Approved"
                                  ? "✓ Approved"
                                  : "�� Rejected"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-8 text-gray-500"
                        >
                          <Icon
                            name="calendar-x"
                            className="mx-auto mb-4 text-gray-300"
                            size={48}
                          />
                          <p>No leave requests found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "holidays" && (
          <div className="space-y-6">
            {/* Holiday Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon
                        name="calendar"
                        className="text-blue-600"
                        size={24}
                      />
                    </div>
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
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Icon name="clock" className="text-green-600" size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Upcoming
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {
                          holidays.filter((h) => new Date(h.date) >= new Date())
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Icon
                        name="building"
                        className="text-purple-600"
                        size={24}
                      />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Office Closed
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {holidays.filter((h) => h.isOfficeClose).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Icon name="star" className="text-yellow-600" size={24} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        This Month
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {
                          holidays.filter((h) => {
                            const holidayDate = new Date(h.date);
                            const now = new Date();
                            return (
                              holidayDate.getMonth() === now.getMonth() &&
                              holidayDate.getFullYear() === now.getFullYear()
                            );
                          }).length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Holiday Management */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="card-title">Holiday Management</h3>
                    <p className="card-description">
                      Manage company holidays and calendar
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddHolidayModal(true)}
                    className="btn btn-primary"
                  >
                    <Icon name="plus" size={16} />
                    Add Holiday
                  </button>
                </div>
              </div>

              {/* Add Holiday Modal */}
              {showAddHolidayModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-semibold">
                        {editingHoliday ? "Edit Holiday" : "Add New Holiday"}
                      </h3>
                      <button
                        onClick={() => {
                          setShowAddHolidayModal(false);
                          setEditingHoliday(null);
                        }}
                        className="btn btn-ghost btn-sm"
                      >
                        <Icon name="x" size={16} />
                      </button>
                    </div>
                    <HolidayForm
                      holiday={editingHoliday}
                      onSubmit={handleHolidaySubmit}
                      onCancel={() => {
                       setShowAddHolidayModal(false);
                       setEditingHoliday(null);
                     }}
                    />
                  </div>
                </div>
              )}

              <div className="card-content">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Holiday Name</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Office Status</th>
                        <th>Recurring</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidays.map((holiday) => (
                        <tr key={holiday._id}>
                          <td>
                            <div>
                              <div className="font-medium">{holiday.name}</div>
                              {holiday.description && (
                                <div className="text-sm text-gray-500">
                                  {holiday.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="text-sm">
                              {new Date(holiday.date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(holiday.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                },
                              )}
                            </div>
                          </td>
                          <td>
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
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                holiday.isOfficeClose
                                  ? "badge-error"
                                  : "badge-success"
                              }`}
                            >
                              {holiday.isOfficeClose ? "Closed" : "Open"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                holiday.isRecurring
                                  ? "badge-default"
                                  : "badge-secondary"
                              }`}
                            >
                              {holiday.isRecurring ? "Yes" : "No"}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingHoliday(holiday);
                                  setShowAddHolidayModal(true);
                                }}
                                className="btn btn-ghost btn-sm"
                              >
                                <Icon name="edit-2" size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteHoliday(holiday._id)}
                                className="btn btn-ghost btn-sm text-red-600"
                              >
                                <Icon name="trash-2" size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {holidays.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No holidays found. Add your first holiday to get started.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "caller-data" && (
          <div className="space-y-6">
            <AdminAddCallerDataSection />
            <AdminCallerDataSection department={filterOptions.department} />
          </div>
        )}

        {activeTab === "payslips" && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="card-title">Payslip Management</h3>
                  <p className="card-description">
                    Upload and manage employee payslips
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPayslipUploadModal(true)}
                    className="btn btn-primary"
                  >
                    <Icon name="upload" size={16} />
                    Upload Payslip
                  </button>
                  <button
                    onClick={fetchPayslips}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    <Icon name="refresh-cw" size={16} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            
            {/* Payslip Upload Modal */}
            {showPayslipUploadModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Upload Payslip</h3>
                    <button
                      onClick={() => setShowPayslipUploadModal(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                    <PayslipUploadForm
                    employees={employees.filter((employee) => employee.role !== "admin")}
                    onSubmit={handlePayslipUpload}
                    onCancel={() => setShowPayslipUploadModal(false)}
                  />
                </div>
              </div>
            )}

            <div className="card-content">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Period</th>
                      <th>File Name</th>
                      <th>File Size</th>
                      <th>Uploaded By</th>
                      <th>Upload Date</th>
                      <th>Downloads</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.length > 0 ? (
                      payslips.map((payslip) => (
                        <tr key={payslip.id}>
                          <td>
                            <div>
                              <p className="font-medium">
                                {payslip.employee?.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {payslip.employee?.employeeId}
                              </p>
                            </div>
                          </td>
                          <td>{payslip.monthYear}</td>
                          <td>{payslip.fileName}</td>
                          <td>{Math.round(payslip.fileSize / 1024)} KB</td>
                          <td>{payslip.uploadedBy?.name}</td>
                          <td>
                            {new Date(payslip.uploadedAt).toLocaleDateString()}
                          </td>
                          <td>
                            <span className="badge badge-secondary">
                              {payslip.downloadCount}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handlePayslipDownload(
                                    payslip.id,
                                    payslip.fileName,
                                  )
                                }
                                className="btn btn-ghost btn-sm"
                                title="Download Payslip"
                              >
                                <Icon name="download" size={16} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm text-red-600"
                                title="Delete Payslip"
                                onClick={() => handleDeletePayslip(payslip.id)}
                              >
                                <Icon name="trash-2" size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="8"
                          className="text-center py-8 text-gray-500"
                        >
                          <Icon
                            name="file-text"
                            className="mx-auto mb-4 text-gray-300"
                            size={48}
                          />
                          <p>
                            No payslips found. Upload your first payslip to get
                            started.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
};

// Holiday Form Component
const HolidayForm = ({ holiday, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: holiday?.name || "",
    description: holiday?.description || "",
    date: holiday?.date
      ? new Date(holiday.date).toISOString().split("T")[0]
      : "",
    type: holiday?.type || "Company",
    isRecurring: holiday?.isRecurring || false,
    notifyEmployees: holiday?.notifyEmployees !== false,
    isOfficeClose: holiday?.isOfficeClose !== false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Holiday name is required");
      return;
    }

    if (!formData.date) {
      toast.error("Holiday date is required");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Holiday Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="form-input"
          placeholder="e.g., Christmas Day"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="form-textarea"
          placeholder="Holiday description (optional)"
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="date" className="form-label">
          Date *
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="type" className="form-label">
          Holiday Type
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className="form-select"
        >
          <option value="Company">Company</option>
          <option value="National">National</option>
          <option value="Religious">Religious</option>
          <option value="Regional">Regional</option>
        </select>
      </div>

      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isRecurring"
            checked={formData.isRecurring}
            onChange={handleInputChange}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="ml-2 text-sm text-gray-700">
            Recurring holiday (yearly)
          </span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="isOfficeClose"
            checked={formData.isOfficeClose}
            onChange={handleInputChange}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="ml-2 text-sm text-gray-700">
            Office will be closed
          </span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="notifyEmployees"
            checked={formData.notifyEmployees}
            onChange={handleInputChange}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="ml-2 text-sm text-gray-700">
            Notify all employees
          </span>
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn btn-primary flex-1">
          {holiday ? "Update Holiday" : "Create Holiday"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// Payslip Upload Form Component
const PayslipUploadForm = ({ employees, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    file: null,
  });

  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        file,
      }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        file,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.employeeId) {
      toast.error("Please select an employee");
      return;
    }

    if (!formData.month || !formData.year) {
      toast.error("Please select month and year");
      return;
    }

    if (!formData.file) {
      toast.error("Please select a PDF file");
      return;
    }

    onSubmit(formData);
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group">
        <label htmlFor="employeeId" className="form-label">
          Select Employee *
        </label>
        <select
          id="employeeId"
          name="employeeId"
          value={formData.employeeId}
          onChange={handleInputChange}
          className="form-select"
          required
        >
          <option value="">Choose an employee...</option>
          {employees.map((employee) => (
            <option
              key={employee._id || employee.id}
              value={employee._id || employee.id}
            >
              {employee.name} ({employee.employeeId}) - {employee.department}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="month" className="form-label">
            Month *
          </label>
          <select
            id="month"
            name="month"
            value={formData.month}
            onChange={handleInputChange}
            className="form-select"
            required
          >
            {months.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="year" className="form-label">
            Year *
          </label>
          <select
            id="year"
            name="year"
            value={formData.year}
            onChange={handleInputChange}
            className="form-select"
            required
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Payslip File (PDF) *</label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary-light"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Icon
              name="upload"
              className="mx-auto mb-2 text-gray-400"
              size={32}
            />
            {formData.file ? (
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formData.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {Math.round(formData.file.size / 1024)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF files only, max 10MB
                </p>
              </div>
            )}
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn btn-primary flex-1">
          Upload Payslip
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AdminDashboard;
