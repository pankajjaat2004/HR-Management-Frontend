import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const CallsDataSection = ({ employeeId, isCheckedOut, onDataUpdated }) => {
  const [todayCallData, setTodayCallData] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    totalCalls: 0,
    totalCallTime: 0,
    interestedStudents: 0,
    visitedToday: 0,
    notes: "",
  });

  // Fetch today's call data
  const fetchTodayCallData = async () => {
    try {
      const response = await axios.get("/api/calls/today");
      if (response.data.success && response.data.callData) {
        setTodayCallData(response.data.callData);
        setFormData({
          totalCalls: response.data.callData.totalCalls,
          totalCallTime: response.data.callData.totalCallTime,
          interestedStudents: response.data.callData.interestedStudents,
          visitedToday: response.data.callData.visitedToday,
          notes: response.data.callData.notes,
        });
      } else {
        setTodayCallData(null);
      }
    } catch (error) {
      console.error("Fetch today call data error:", error);
    }
  };

  // Fetch call history
  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/calls/my?limit=10");
      if (response.data.success && response.data.callDataRecords) {
        setCallHistory(response.data.callDataRecords);
      } else {
        setCallHistory([]);
      }
    } catch (error) {
      console.error("Fetch call history error:", error);
      setCallHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayCallData();
    fetchCallHistory();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "notes" ? value : parseInt(value) || 0,
    }));
  };

  const handleAddUpdate = async (e) => {
    e.preventDefault();

    if (isCheckedOut && !editingRecord) {
      toast.error("Cannot add call data after checking out");
      return;
    }

    try {
      let response;
      if (editingRecord) {
        // Update existing record
        response = await axios.put(`/api/calls/${editingRecord._id}`, {
          ...formData,
        });
        toast.success("Call data updated successfully!");
      } else {
        // Create new record
        response = await axios.post("/api/calls", {
          ...formData,
        });
        toast.success("Call data added successfully!");
      }

      if (response.data.success) {
        setShowModal(false);
        setEditingRecord(null);
        setFormData({
          totalCalls: 0,
          totalCallTime: 0,
          interestedStudents: 0,
          visitedToday: 0,
          notes: "",
        });
        fetchTodayCallData();
        fetchCallHistory();
        if (onDataUpdated) onDataUpdated();
      }
    } catch (error) {
      console.error("Add/Update call data error:", error);
      const message =
        error.response?.data?.message || "Failed to save call data";
      toast.error(message);
    }
  };

  const handleEdit = (record) => {
    if (isCheckedOut) {
      toast.error("Cannot edit call data after checking out");
      return;
    }

    setEditingRecord(record);
    setFormData({
      totalCalls: record.totalCalls,
      totalCallTime: record.totalCallTime,
      interestedStudents: record.interestedStudents,
      visitedToday: record.visitedToday,
      notes: record.notes,
    });
    setShowModal(true);
  };

  const handleDelete = async (recordId) => {
    if (isCheckedOut) {
      toast.error("Cannot delete call data after checking out");
      return;
    }

    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        const response = await axios.delete(`/api/calls/${recordId}`);
        if (response.data.success) {
          toast.success("Call data deleted successfully!");
          fetchTodayCallData();
          fetchCallHistory();
          if (onDataUpdated) onDataUpdated();
        }
      } catch (error) {
        console.error("Delete call data error:", error);
        toast.error(error.response?.data?.message || "Failed to delete");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRecord(null);
    setFormData({
      totalCalls: 0,
      totalCallTime: 0,
      interestedStudents: 0,
      visitedToday: 0,
      notes: "",
    });
  };

  return (
    <div className="calls-data-section">
      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-container modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRecord ? "Edit" : "Add"} Call Data
              </h3>
              <button
                onClick={closeModal}
                className="modal-close-btn"
                title="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddUpdate} className="modal-form">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">
                    Total Calls <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalCalls"
                    value={formData.totalCalls}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Total Call Time (minutes){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalCallTime"
                    value={formData.totalCallTime}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Interested Students <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="interestedStudents"
                    value={formData.interestedStudents}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Visited Today <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="visitedToday"
                    value={formData.visitedToday}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Add any additional notes..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRecord ? "Update Data" : "Add Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Today's Call Data Summary */}
      {todayCallData && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">Today's Call Data</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(todayCallData)}
                disabled={isCheckedOut}
                title={isCheckedOut ? "Cannot edit after checkout" : ""}
                className="btn btn-sm btn-secondary"
              >
                <i data-lucide="edit"></i>
                Edit
              </button>
              <button
                onClick={() => handleDelete(todayCallData._id)}
                disabled={isCheckedOut}
                title={isCheckedOut ? "Cannot delete after checkout" : ""}
                className="btn btn-sm btn-danger"
              >
                <i data-lucide="trash-2"></i>
                Delete
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="stats-box">
                <p className="stats-label">Total Calls</p>
                <p className="stats-value">{todayCallData.totalCalls}</p>
              </div>
              <div className="stats-box">
                <p className="stats-label">Call Time (mins)</p>
                <p className="stats-value">{todayCallData.totalCallTime}</p>
              </div>
              <div className="stats-box">
                <p className="stats-label">Interested Students</p>
                <p className="stats-value text-green-600">
                  {todayCallData.interestedStudents}
                </p>
              </div>
              <div className="stats-box">
                <p className="stats-label">Visited</p>
                <p className="stats-value text-blue-600">
                  {todayCallData.visitedToday}
                </p>
              </div>
            </div>
            {todayCallData.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded border">
                <p className="text-sm text-gray-600">
                  <strong>Notes:</strong> {todayCallData.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Call Data Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            if (isCheckedOut) {
              toast.error("Cannot add call data after checking out");
              return;
            }
            setShowModal(true);
          }}
          disabled={isCheckedOut}
          title={isCheckedOut ? "Cannot add after checkout" : ""}
          className="btn btn-primary"
        >
          <i data-lucide="plus"></i>
          {todayCallData ? "Update" : "Add"} Call Data
        </button>
      </div>

      {/* Call History */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Call History</h3>
        </div>
        <div className="card-content">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="spinner"></span>
              <span className="ml-2">Loading call history...</span>
            </div>
          ) : callHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-center py-3 px-4 font-semibold">
                      Calls
                    </th>
                    <th className="text-center py-3 px-4 font-semibold">
                      Time (mins)
                    </th>
                    <th className="text-center py-3 px-4 font-semibold">
                      Interested
                    </th>
                    <th className="text-center py-3 px-4 font-semibold">
                      Visited
                    </th>
                    <th className="text-center py-3 px-4 font-semibold">
                      Score
                    </th>
                    <th className="text-center py-3 px-4 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {callHistory.map((record) => (
                    <tr key={record._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="text-center py-3 px-4">
                        {record.totalCalls}
                      </td>
                      <td className="text-center py-3 px-4">
                        {record.totalCallTime}
                      </td>
                      <td className="text-center py-3 px-4 text-green-600 font-medium">
                        {record.interestedStudents}
                      </td>
                      <td className="text-center py-3 px-4 text-blue-600 font-medium">
                        {record.visitedToday}
                      </td>
                      <td className="text-center py-3 px-4 font-semibold">
                        {record.performanceScore?.toFixed(1) || 0}
                      </td>
                      <td className="text-center py-3 px-4">
                        <button
                          onClick={() => handleEdit(record)}
                          disabled={
                            isCheckedOut &&
                            new Date(record.date).toDateString() ===
                              new Date().toDateString()
                          }
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Edit"
                        >
                          <i data-lucide="edit-2"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No call data records found</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .stats-box {
          padding: 1rem;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 8px;
          text-align: center;
        }
        .stats-label {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        .stats-value {
          font-size: 1.75rem;
          font-weight: bold;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default CallsDataSection;
