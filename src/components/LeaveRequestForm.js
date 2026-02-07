import React, { useState } from "react";
import toast from "react-hot-toast";

const LeaveRequestForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || "",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    reason: initialData?.reason || "",
    isHalfDay: initialData?.isHalfDay || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Calculate number of days between start and end date
  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;

    if (formData.isHalfDay) return 0.5;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    return Math.max(daysDiff, 1);
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = "Leave type is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (!formData.reason || formData.reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters long";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        newErrors.startDate = "Start date cannot be in the past";
      }

      if (end < start) {
        newErrors.endDate = "End date cannot be before start date";
      }

      // Check for reasonable leave duration (max 30 days for vacation)
      const days = calculateDays();
      if (formData.type === "Vacation" && days > 7) {
        newErrors.endDate = "Vacation leave cannot exceed 7 days";
      }
      if (formData.type === "Sick Leave" && days > 3) {
        newErrors.endDate = "Sick leave cannot exceed 3 days";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    // Auto-set end date to start date for half-day leaves
    if (field === "isHalfDay" && value === true) {
      setFormData((prev) => ({
        ...prev,
        endDate: prev.startDate,
      }));
    }

    // Clear half-day if dates are different
    if ((field === "startDate" || field === "endDate") && formData.isHalfDay) {
      if (field === "endDate" && value !== formData.startDate) {
        setFormData((prev) => ({
          ...prev,
          isHalfDay: false,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const leaveTypes = [
    {
      value: "Vacation",
      label: "Vacation",
      description: "Planned time off for personal activities",
    },
    {
      value: "Sick Leave",
      label: "Sick Leave",
      description: "Medical leave for illness or injury",
    },
    {
      value: "Personal Leave",
      label: "Personal Leave",
      description: "Time off for personal matters",
    },
    {
      value: "Emergency Leave",
      label: "Emergency Leave",
      description: "Urgent unforeseen circumstances",
    },
    {
      value: "Maternity Leave",
      label: "Maternity Leave",
      description: "Leave for childbirth and childcare",
    },
    {
      value: "Paternity Leave",
      label: "Paternity Leave",
      description: "Leave for fathers after childbirth",
    },
    {
      value: "Bereavement Leave",
      label: "Bereavement Leave",
      description: "Leave due to death of family member",
    },
  ];

  const calculateWorkingDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;

    if (formData.isHalfDay) return 0.5;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    let workingDays = 0;

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Count Monday (1) to Friday (5) as working days
      if (dayOfWeek >= 1 && dayOfWeek <= 7) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Leave Type Selection */}
      <div className="form-group">
        <label className="form-label required">
          <i data-lucide="calendar-check" className="w-4 h-4 inline mr-2"></i>
          Leave Type
        </label>
        <select
          className={`form-select ${errors.type ? "border-red-500" : ""}`}
          value={formData.type}
          onChange={(e) => handleInputChange("type", e.target.value)}
          required
        >
          <option value="">Select leave type</option>
          {leaveTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.type && (
          <p className="text-red-500 text-sm mt-1">{errors.type}</p>
        )}
        {formData.type && (
          <p className="text-gray-600 text-sm mt-1">
            {leaveTypes.find((t) => t.value === formData.type)?.description}
          </p>
        )}
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label required">
            <i data-lucide="calendar-days" className="w-4 h-4 inline mr-2"></i>
            Start Date
          </label>
          <input
            type="date"
            className={`form-input ${errors.startDate ? "border-red-500" : ""}`}
            value={formData.startDate}
            onChange={(e) => handleInputChange("startDate", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            required
          />
          {errors.startDate && (
            <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label required">
            <i data-lucide="calendar-x" className="w-4 h-4 inline mr-2"></i>
            End Date
          </label>
          <input
            type="date"
            className={`form-input ${errors.endDate ? "border-red-500" : ""}`}
            value={formData.endDate}
            onChange={(e) => handleInputChange("endDate", e.target.value)}
            min={formData.startDate || new Date().toISOString().split("T")[0]}
            disabled={formData.isHalfDay}
            required
          />
          {errors.endDate && (
            <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Half Day Option */}
      <div className="form-group">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isHalfDay}
            onChange={(e) => handleInputChange("isHalfDay", e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              Half Day Leave
            </span>
            <p className="text-sm text-gray-500">
              This leave is for half a day only (4 hours)
            </p>
          </div>
        </label>
      </div>

      {/* Leave Duration Display */}
      {formData.startDate && formData.endDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <i data-lucide="info" className="w-4 h-4 text-blue-600"></i>
            <span className="font-medium text-blue-900">Leave Duration</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Days:</span>
              <span className="font-medium ml-2">{calculateDays()} day(s)</span>
            </div>
            <div>
              <span className="text-gray-600">Working Days:</span>
              <span className="font-medium ml-2">
                {calculateWorkingDays()} day(s)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Reason for Leave */}
      <div className="form-group">
        <label className="form-label required">
          <i data-lucide="message-circle" className="w-4 h-4 inline mr-2"></i>
          Reason for Leave
        </label>
        <textarea
          className={`form-textarea ${errors.reason ? "border-red-500" : ""}`}
          placeholder="Please provide a detailed reason for your leave request (minimum 10 characters)..."
          value={formData.reason}
          onChange={(e) => handleInputChange("reason", e.target.value)}
          rows={4}
          minLength={10}
          maxLength={500}
          required
        />
        <div className="flex justify-between items-center mt-1">
          {errors.reason ? (
            <p className="text-red-500 text-sm">{errors.reason}</p>
          ) : (
            <p className="text-gray-500 text-sm">
              Provide details about your leave request
            </p>
          )}
          <span className="text-sm text-gray-400">
            {formData.reason.length}/500
          </span>
        </div>
      </div>

      {/* Manager Notification Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <i
            data-lucide="alert-circle"
            className="w-4 h-4 text-yellow-600 mt-0.5"
          ></i>
          <div className="text-sm">
            <p className="font-medium text-yellow-900 mb-1">Important Notes:</p>
            <ul className="text-yellow-800 space-y-1">
              <li>• Your manager will be automatically notified</li>
              <li>
                • Leave requests should be submitted at least 2 days in advance
              </li>
              <li>
                • Emergency leaves will be reviewed on a case-by-case basis
              </li>
              <li>• You will receive an email confirmation once processed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          <i data-lucide="x" className="w-4 h-4 mr-2"></i>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="spinner w-4 h-4 mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <i data-lucide="send" className="w-4 h-4 mr-2"></i>
              Submit Request
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default LeaveRequestForm;
