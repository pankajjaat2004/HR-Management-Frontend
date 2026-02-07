import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/api";
import toast from "react-hot-toast";
import Navigation from "../components/Navigation";

const AddEmployee = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    employeeId: "",
    department: "",
    position: "",
    salary: "",
    startDate: new Date().toISOString().split("T")[0], // Default to today
    phone: "",
    role: "employee",
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

  const navigate = useNavigate();

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
  }, [navigate]);

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

    if (!formData.password) {
      toast.error("Password is required");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Remove confirmPassword from submission data
      const { confirmPassword, ...submitData } = formData;

      console.log("form data is:", submitData);

      const response = await apiClient.post("/api/employees", submitData);

      if (response.data.success) {
        toast.success("Employee added successfully!");
        navigate("/admin");
      }
    } catch (error) {
      console.error("Add employee error:", error);
      const message =
        error.response?.data?.message ||
        "Failed to add employee. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      employeeId: "",
      department: "",
      position: "",
      salary: "",
      startDate: new Date().toISOString().split("T")[0],
      phone: "",
      role: "employee",
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
            Add New Employee
          </h1>
          <p className="text-gray-600">
            Enter employee details to add them to the system
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <i data-lucide="user-plus"></i>
              Employee Information
            </h2>
            <p className="card-description">
              Fill in all required fields to create a new employee account
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
                    <label className="form-label">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Re-enter password"
                      required
                    />
                  </div>

                  {/* <div className="form-group">
                    <label className="form-label">Employee ID</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="EMP001 (leave blank for auto-generation)"
                    />
                  </div> */}

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
                      <option value="manager">Manager</option>
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
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary"
                >
                  <i data-lucide="refresh-cw"></i>
                  Reset Form
                </button>

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
                        Adding Employee...
                      </>
                    ) : (
                      <>
                        <i data-lucide="user-plus"></i>
                        Add Employee
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Form Notes */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <i data-lucide="info" className="w-4 h-4 text-blue-600 mt-0.5"></i>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Important Notes:
              </p>
              <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
                <li>
                  Employee ID is optional - a unique ID will be automatically
                  generated if left blank
                </li>
                <li>
                  The employee will receive login credentials via email (if
                  configured)
                </li>
                <li>
                  Default leave balances will be assigned based on company
                  policy
                </li>
                <li>All fields marked with * are required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
