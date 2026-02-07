import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AdminAddCallerDataSection = () => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee: "",
    date: new Date().toISOString().split("T")[0],
    totalCalls: 0,
    totalCallTime: 0,
    interestedStudents: 0,
    visitedToday: 0,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [existingData, setExistingData] = useState(null);

  // Fetch employees list
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setSearchLoading(true);
        const response = await axios.get("/api/employees");
        if (response.data.success) {
          // Filter out admins, only show regular employees
          const regularEmployees = response.data.employees.filter(
            (emp) => emp.role !== "admin"
          );
          setEmployees(regularEmployees);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to load employees");
      } finally {
        setSearchLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Check if data exists for the selected employee and date
  const checkExistingData = async (employeeId, date) => {
    if (!employeeId || !date) return;

    try {
      const response = await axios.get("/api/calls/all", {
        params: {
          employee: employeeId,
          date: date,
          limit: 1,
        },
      });

      if (response.data.success && response.data.callDataRecords.length > 0) {
        const data = response.data.callDataRecords[0];
        setExistingData(data);
        // Pre-fill form with existing data
        setFormData((prev) => ({
          ...prev,
          totalCalls: data.totalCalls,
          totalCallTime: data.totalCallTime,
          interestedStudents: data.interestedStudents,
          visitedToday: data.visitedToday,
          notes: data.notes,
        }));
      } else {
        setExistingData(null);
        // Reset data fields but keep date and employee
        setFormData((prev) => ({
          ...prev,
          totalCalls: 0,
          totalCallTime: 0,
          interestedStudents: 0,
          visitedToday: 0,
          notes: "",
        }));
      }
    } catch (error) {
      console.error("Error checking existing data:", error);
    }
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      employee: employeeId,
    }));
    checkExistingData(employeeId, formData.date);
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setFormData((prev) => ({
      ...prev,
      date,
    }));
    checkExistingData(formData.employee, date);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "notes" ? value : parseInt(value) || 0,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employee || !formData.date) {
      toast.error("Please select an employee and date");
      return;
    }

    try {
      setLoading(true);

      if (existingData) {
        // Update existing data
        const response = await axios.put(`/api/calls/${existingData._id}`, {
          totalCalls: formData.totalCalls,
          totalCallTime: formData.totalCallTime,
          interestedStudents: formData.interestedStudents,
          visitedToday: formData.visitedToday,
          notes: formData.notes,
        });

        if (response.data.success) {
          toast.success("Caller data updated successfully!");
          setExistingData(null);
          setFormData({
            employee: "",
            date: new Date().toISOString().split("T")[0],
            totalCalls: 0,
            totalCallTime: 0,
            interestedStudents: 0,
            visitedToday: 0,
            notes: "",
          });
        }
      } else {
        // Create new data
        const response = await axios.post("/api/calls", {
          employee: formData.employee,
          date: formData.date,
          totalCalls: formData.totalCalls,
          totalCallTime: formData.totalCallTime,
          interestedStudents: formData.interestedStudents,
          visitedToday: formData.visitedToday,
          notes: formData.notes,
        });

        if (response.data.success) {
          toast.success("Caller data added successfully!");
          setExistingData(null);
          setFormData({
            employee: "",
            date: new Date().toISOString().split("T")[0],
            totalCalls: 0,
            totalCallTime: 0,
            interestedStudents: 0,
            visitedToday: 0,
            notes: "",
          });
        }
      }
    } catch (error) {
      console.error("Error submitting caller data:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save caller data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      employee: "",
      date: new Date().toISOString().split("T")[0],
      totalCalls: 0,
      totalCallTime: 0,
      interestedStudents: 0,
      visitedToday: 0,
      notes: "",
    });
    setExistingData(null);
  };

  // Get selected employee info
  const selectedEmployee = employees.find((emp) => emp._id === formData.employee);

  return (
    <div className="add-caller-data-section space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Add/Edit Caller Data</h3>
          <p className="card-description">
            Add caller data for any employee and any date (including previous dates)
          </p>
        </div>

        <div className="card-content">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee and Date Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select
                  value={formData.employee}
                  onChange={handleEmployeeChange}
                  className="form-select"
                  disabled={searchLoading}
                >
                  <option value="">
                    {searchLoading ? "Loading employees..." : "Select an employee"}
                  </option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={handleDateChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* Status Message */}
            {existingData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ✏️ <strong>Editing existing data:</strong> This employee already has caller data
                  for {new Date(formData.date).toLocaleDateString()}. Your changes will update the
                  existing record.
                </p>
              </div>
            )}

            {selectedEmployee && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Employee:</strong> {selectedEmployee.name} ({selectedEmployee.employeeId})
                  <br />
                  <strong>Department:</strong> {selectedEmployee.department}
                </p>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">
                    Visited Students
                    <span className="text-xs text-gray-500 ml-1">(40% weightage)</span>
                  </label>
                  <input
                    type="number"
                    name="visitedToday"
                    value={formData.visitedToday}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Interested Students
                    <span className="text-xs text-gray-500 ml-1">(30% weightage)</span>
                  </label>
                  <input
                    type="number"
                    name="interestedStudents"
                    value={formData.interestedStudents}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">
                    Total Call Time (minutes)
                    <span className="text-xs text-gray-500 ml-1">(20% weightage)</span>
                  </label>
                  <input
                    type="number"
                    name="totalCallTime"
                    value={formData.totalCallTime}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Total Calls
                    <span className="text-xs text-gray-500 ml-1">(10% weightage)</span>
                  </label>
                  <input
                    type="number"
                    name="totalCalls"
                    value={formData.totalCalls}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="4"
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            {/* Performance Score Preview */}
            {(formData.visitedToday ||
              formData.interestedStudents ||
              formData.totalCallTime ||
              formData.totalCalls) && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Expected Performance Score:
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {(
                    formData.visitedToday * 40 +
                    formData.interestedStudents * 30 +
                    formData.totalCallTime * 0.2 +
                    formData.totalCalls * 0.1
                  ).toFixed(1)}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Based on: Visited (40%) + Interested (30%) + Call Time (20%) +
                  Total Calls (10%)
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-secondary"
                disabled={loading}
              >
                Clear
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !formData.employee || !formData.date}
              >
                {loading ? (
                  <>
                    <span className="spinner-small mr-2"></span>
                    {existingData ? "Updating..." : "Adding..."}
                  </>
                ) : existingData ? (
                  "Update Caller Data"
                ) : (
                  "Add Caller Data"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Info Card */}
      <div className="card bg-amber-50 border border-amber-200">
        <div className="card-content">
          <h4 className="font-semibold text-gray-900 mb-3">📋 How to use:</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              ✓ <strong>Select an employee</strong> from the dropdown list
            </li>
            <li>
              ✓ <strong>Choose a date</strong> - you can select any past, present, or
              future date
            </li>
            <li>
              ✓ <strong>Enter the metrics</strong> - visited students, interested
              students, call time, and total calls
            </li>
            <li>
              ✓ <strong>Add notes</strong> (optional) - any additional information
              about the day
            </li>
            <li>
              ✓ <strong>Submit</strong> - the system will either add new data or
              update existing data for that date
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminAddCallerDataSection;
