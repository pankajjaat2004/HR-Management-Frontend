import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient from "../utils/api";
import toast from "react-hot-toast";
import Navigation from "../components/Navigation";

const EditEmployee = () => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showLeavesModal, setShowLeavesModal] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [leavesData, setLeavesData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const [leavesError, setLeavesError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeId: "",
    department: "",
    position: "",
    salary: "",
    startDate: "",
    phone: "",
    role: "employee",
    status: "Active",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
  });
  const [managers, setManagers] = useState([]);
  const navigate = useNavigate();
  const { employeeId } = useParams();

  // Mock managers data
  const mockManagers = [
    { id: "1", name: "John Smith", employeeId: "MGR001" },
    { id: "2", name: "Sarah Johnson", employeeId: "MGR002" },
    { id: "3", name: "Michael Chen", employeeId: "MGR003" },
  ];

  // Mock employee data for demo
  const mockEmployeeData = {
    1: {
      name: "Alice Johnson",
      email: "alice@company.com",
      employeeId: "EMP001",
      department: "Engineering",
      position: "Senior Developer",
      salary: "95000",
      startDate: "2022-01-15",
      manager: "1",
      phone: "+1 (555) 123-4567",
      role: "employee",
      status: "Active",
      address: {
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94105",
        country: "USA",
      },
      emergencyContact: {
        name: "Bob Johnson",
        relationship: "Spouse",
        phone: "+1 (555) 987-6543",
      },
    },
    2: {
      name: "Bob Smith",
      email: "bob@company.com",
      employeeId: "EMP002",
      department: "Marketing",
      position: "Marketing Manager",
      salary: "75000",
      startDate: "2021-06-20",
      manager: "2",
      phone: "+1 (555) 234-5678",
      role: "employee",
      status: "Active",
      address: {
        street: "456 Oak Ave",
        city: "Los Angeles",
        state: "CA",
        zipCode: "90210",
        country: "USA",
      },
      emergencyContact: {
        name: "Jane Smith",
        relationship: "Sister",
        phone: "+1 (555) 876-5432",
      },
    },
    3: {
      name: "Carol Davis",
      email: "carol@company.com",
      employeeId: "EMP003",
      department: "HR",
      position: "HR Specialist",
      salary: "65000",
      startDate: "2023-03-10",
      manager: "",
      phone: "+1 (555) 345-6789",
      role: "employee",
      status: "Active",
      address: {
        street: "789 Pine St",
        city: "Seattle",
        state: "WA",
        zipCode: "98101",
        country: "USA",
      },
      emergencyContact: {
        name: "John Davis",
        relationship: "Father",
        phone: "+1 (555) 765-4321",
      },
    },
  };

  useEffect(() => {
    // Check authentication and admin role
    const token = localStorage.getItem("token");
    const employee = localStorage.getItem("employee");

    if (!token || !employee) {
      toast.error("Please login to access this page");
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

    // Load managers for dropdown
    setManagers(mockManagers);

    // Load employee data
    loadEmployeeData();
  }, [navigate, employeeId]);

  const loadEmployeeData = async () => {
    try {
      setFetchLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        navigate("/admin-login");
        return;
      }

      // Make API call to get employee data
      const response = await apiClient.get(`/api/employees/${employeeId}`);

      if (response.data.success) {
        const employeeData = response.data.employee;

        // Format the data to match form structure
        setFormData({
          name: employeeData.name || "",
          email: employeeData.email || "",
          employeeId: employeeData.employeeId || "",
          department: employeeData.department || "",
          position: employeeData.position || "",
          salary: employeeData.salary?.toString() || "",
          startDate: employeeData.startDate
            ? employeeData.startDate.split("T")[0]
            : "",
          phone: employeeData.phone || "",
          role: employeeData.role || "employee",
          status: employeeData.status || "Active",
          address: {
            street: employeeData.address?.street || "",
            city: employeeData.address?.city || "",
            state: employeeData.address?.state || "",
            zipCode: employeeData.address?.zipCode || "",
            country: employeeData.address?.country || "",
          },
          emergencyContact: {
            name: employeeData.emergencyContact?.name || "",
            relationship: employeeData.emergencyContact?.relationship || "",
            phone: employeeData.emergencyContact?.phone || "",
          },
        });
      } else {
        toast.error("Employee not found");
        navigate("/admin");
      }
    } catch (error) {
      console.error("Load employee error:", error);
      if (error.response?.status === 404) {
        toast.error("Employee not found");
      } else if (error.response?.status === 401) {
        toast.error("Authentication failed");
        navigate("/admin-login");
      } else {
        toast.error("Failed to load employee data");
      }
      navigate("/admin");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (!formData.department) {
      toast.error("Department is required");
      return false;
    }

    if (!formData.position.trim()) {
      toast.error("Position is required");
      return false;
    }

    if (!formData.salary || formData.salary <= 0) {
      toast.error("Valid salary is required");
      return false;
    }

    if (!formData.startDate) {
      toast.error("Start date is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        navigate("/admin-login");
        return;
      }

      const response = await apiClient.put(
        `/api/employees/${employeeId}`,
        formData
      );

      if (response.data.success) {
        toast.success("Employee updated successfully!");
        navigate("/admin");
      }
    } catch (error) {
      console.error("Update employee error:", error);
      const message =
        error.response?.data?.message ||
        "Failed to update employee. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setAttendanceLoading(true);
      setAttendanceError(null);
      const token = localStorage.getItem("token");

      const response = await apiClient.get(
        `/api/attendance/all?employee=${employeeId}&limit=50`
      );

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
        setAttendanceData(formattedAttendance);
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error("Fetch attendance error:", error);
      setAttendanceData([]);
      const errorMessage =
        error.response?.data?.message || "Failed to load attendance records";
      setAttendanceError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchLeavesData = async () => {
    try {
      setLeavesLoading(true);
      setLeavesError(null);
      const token = localStorage.getItem("token");

      const response = await apiClient.get(`/api/leaves?employee=${employeeId}`);

      if (response.data.success && response.data.leaves) {
        const formattedLeaves = response.data.leaves.map((leave) => ({
          _id: leave._id,
          type: leave.type,
          startDate: new Date(leave.startDate).toLocaleDateString(),
          endDate: new Date(leave.endDate).toLocaleDateString(),
          days: leave.totalDays || leave.days,
          status: leave.status,
          reason: leave.reason,
        }));
        setLeavesData(formattedLeaves);
      } else {
        setLeavesData([]);
      }
    } catch (error) {
      console.error("Fetch leaves error:", error);
      setLeavesData([]);
      const errorMessage =
        error.response?.data?.message || "Failed to load leave records";
      setLeavesError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLeavesLoading(false);
    }
  };

  const handleResetPassword = async (newPassword) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication required");
        navigate("/admin-login");
        return;
      }

      const response = await apiClient.put(
        `/api/auth/reset-password/${employeeId}`,
        { newPassword }
      );

      if (response.data.success) {
        toast.success("Password reset successfully!");
        setShowResetPasswordModal(false);
      } else {
        toast.error(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);

      if (error.response?.status === 403) {
        toast.error("Access denied. Admin privileges required.");
      } else if (error.response?.status === 404) {
        toast.error("Employee not found");
      } else if (error.response?.status === 400) {
        toast.error(
          error.response.data.message || "Invalid password format",
        );
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    }
  };

  const AttendanceModal = () => {
    return (
      <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
        <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Attendance Records - {formData.name}</h3>
            <button
              onClick={() => setShowAttendanceModal(false)}
              className="modal-close-btn"
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="modal-content">
            {attendanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="spinner"></span>
                <span className="ml-2">Loading attendance data...</span>
              </div>
            ) : attendanceError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 font-medium">Failed to load attendance records</p>
                <p className="text-sm text-red-500 mt-1">{attendanceError}</p>
                <button
                  onClick={() => {
                    fetchAttendanceData();
                  }}
                  className="btn btn-sm btn-primary mt-3"
                >
                  <i data-lucide="refresh-cw"></i>
                  Retry
                </button>
              </div>
            ) : attendanceData.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {attendanceData.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{record.date}</p>
                      <p className="text-sm text-gray-600">
                        {record.clockIn} - {record.clockOut}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="badge badge-success mb-1 block">
                        {record.status}
                      </span>
                      <p className="text-sm text-gray-600">{record.hours}h</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No attendance records found</p>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setShowAttendanceModal(false)}
              className="btn btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const LeavesModal = () => {
    return (
      <div className="modal-overlay" onClick={() => setShowLeavesModal(false)}>
        <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Leave Records - {formData.name}</h3>
            <button
              onClick={() => setShowLeavesModal(false)}
              className="modal-close-btn"
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="modal-content">
            {leavesLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="spinner"></span>
                <span className="ml-2">Loading leave records...</span>
              </div>
            ) : leavesError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 font-medium">Failed to load leave records</p>
                <p className="text-sm text-red-500 mt-1">{leavesError}</p>
                <button
                  onClick={() => {
                    fetchLeavesData();
                  }}
                  className="btn btn-sm btn-primary mt-3"
                >
                  <i data-lucide="refresh-cw"></i>
                  Retry
                </button>
              </div>
            ) : leavesData.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {leavesData.map((leave) => (
                  <div
                    key={leave._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{leave.type}</p>
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
                      <p className="text-sm text-gray-600">
                        {leave.startDate} - {leave.endDate} ({leave.days} days)
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{leave.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No leave records found</p>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setShowLeavesModal(false)}
              className="btn btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ProfileModal = () => {
    const handleCancel = () => {
      setShowProfileModal(false);
    };

    return (
      <div className="modal-overlay" onClick={handleCancel}>
        <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Employee Full Profile</h3>
            <button
              onClick={handleCancel}
              className="modal-close-btn"
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="modal-content">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Section */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 pb-2 border-b">
                  Personal Information
                </h4>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Name</p>
                  <p className="text-gray-900">{formData.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                  <p className="text-gray-900">{formData.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Employee ID</p>
                  <p className="text-gray-900">{formData.employeeId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                  <p className="text-gray-900">{formData.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Role</p>
                  <p className="text-gray-900">{formData.role}</p>
                </div>
              </div>

              {/* Work Section */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 pb-2 border-b">
                  Work Information
                </h4>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Department</p>
                  <p className="text-gray-900">{formData.department}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Position</p>
                  <p className="text-gray-900">{formData.position}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Salary</p>
                  <p className="text-gray-900">Rs. {formData.salary} per month</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Start Date</p>
                  <p className="text-gray-900">{formData.startDate}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                  <span className={`badge ${formData.status === 'Active' ? 'badge-success' : 'badge-error'}`}>
                    {formData.status}
                  </span>
                </div>
              </div>

              {/* Address Section */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="font-semibold text-gray-900 pb-2 border-b">
                  Address Information
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Street</p>
                    <p className="text-gray-900">{formData.address.street || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">City</p>
                    <p className="text-gray-900">{formData.address.city || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">State</p>
                    <p className="text-gray-900">{formData.address.state || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Zip Code</p>
                    <p className="text-gray-900">{formData.address.zipCode || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Country</p>
                    <p className="text-gray-900">{formData.address.country || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="font-semibold text-gray-900 pb-2 border-b">
                  Emergency Contact
                </h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Name</p>
                    <p className="text-gray-900">{formData.emergencyContact.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Relationship</p>
                    <p className="text-gray-900">{formData.emergencyContact.relationship || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                    <p className="text-gray-900">{formData.emergencyContact.phone || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ResetPasswordModal = () => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState({
      new: false,
      confirm: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const togglePasswordVisibility = (field) => {
      setShowPasswords((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    };

    const validateForm = () => {
      if (!newPassword) {
        toast.error("New password is required");
        return false;
      }
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return false;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
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
        await handleResetPassword(newPassword);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCancel = () => {
      setShowResetPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    };

    return (
      <div className="modal-overlay" onClick={handleCancel}>
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Reset Employee Password</h3>
            <button
              onClick={handleCancel}
              className="modal-close-btn"
              title="Close"
            >
              ×
            </button>
          </div>
          <p className="modal-description">
            Set a new password for {formData.name}. Password must be at least
            6 characters long.
          </p>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter new password"
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
                Minimum 6 characters, combination of uppercase, lowercase, and
                numbers recommended
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="Confirm new password"
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

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Warning:</strong> This will replace the employee's
                current password. They should be notified of the new password
                through a secure channel.
              </p>
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
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <span className="spinner"></span>
          <span>Loading employee data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showProfileModal && <ProfileModal />}
      {showAttendanceModal && <AttendanceModal />}
      {showLeavesModal && <LeavesModal />}
      {showResetPasswordModal && <ResetPasswordModal />}
      <Navigation
        variant="admin"
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("employee");
          navigate("/admin-login");
        }}
      />

      {/* Back to Dashboard Link */}
      <div className="bg-white border-b">
        <div className="container py-3">
          <Link to="/admin" className="btn btn-ghost">
            <i data-lucide="arrow-left"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Employee
          </h1>
          <p className="text-gray-600">
            Update employee details for {formData.name} ({formData.employeeId})
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <i data-lucide="user-check"></i>
              Employee Information
            </h2>
            <p className="card-description">
              Update the fields you want to change
            </p>
          </div>

          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="john.doe@company.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="EMP001"
                      disabled
                      title="Employee ID cannot be changed"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                  Work Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="HR">Human Resources</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Position <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Software Engineer"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Annual Salary <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="75000"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>

                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                  Address Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="form-group md:col-span-2">
                    <label className="form-label">Street Address</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="San Francisco"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="CA"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Zip Code</label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="94105"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                  Emergency Contact
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContact.name"
                      value={formData.emergencyContact.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Relationship</label>
                    <input
                      type="text"
                      name="emergencyContact.relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Spouse"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="+1 (555) 987-6543"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="text-sm text-gray-500">
                  <i data-lucide="info" className="w-4 h-4 inline mr-1"></i>
                  Last updated: {new Date().toLocaleDateString()}
                </div>

                <div className="flex gap-4">
                  <Link to="/admin" className="btn btn-ghost">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Updating Employee...
                      </>
                    ) : (
                      <>
                        <i data-lucide="save"></i>
                        Update Employee
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <div className="card flex-1">
            <div className="card-content p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Additional Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="btn btn-secondary btn-sm"
                >
                  <i data-lucide="eye"></i>
                  View Full Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fetchAttendanceData();
                    setShowAttendanceModal(true);
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  <i data-lucide="clock"></i>
                  View Attendance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fetchLeavesData();
                    setShowLeavesModal(true);
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  <i data-lucide="calendar"></i>
                  View Leaves
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(true)}
                  className="btn btn-warning btn-sm"
                >
                  <i data-lucide="key"></i>
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEmployee;
