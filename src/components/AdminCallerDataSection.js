import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AdminCallerDataSection = ({ department = "all" }) => {
  const [callData, setCallData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [topPerformer, setTopPerformer] = useState(null);
  const [overallStats, setOverallStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (month) params.append("month", month);
      if (year) params.append("year", year);
      if (department && department !== "all")
        params.append("department", department);

      const response = await axios.get(`/api/calls/performance/stats?${params}`);

      if (response.data.success) {
        setPerformanceData(response.data.performanceData || []);
        setTopPerformer(response.data.topPerformer);
        setOverallStats(response.data.overallStats);
      } else {
        toast.error("Failed to fetch performance data");
      }
    } catch (error) {
      console.error("Fetch performance data error:", error);
      toast.error("Error loading performance data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all call data
  const fetchCallData = async () => {
    try {
      const params = new URLSearchParams();
      params.append("limit", "100");
      if (department && department !== "all")
        params.append("department", department);

      const response = await axios.get(`/api/calls/all?${params}`);

      if (response.data.success && response.data.callDataRecords) {
        setCallData(response.data.callDataRecords);
      }
    } catch (error) {
      console.error("Fetch call data error:", error);
    }
  };

  // Fetch employee detailed monthly performance
  const fetchEmployeeMonthlyPerformance = async (employeeId) => {
    try {
      setDetailLoading(true);
      const params = new URLSearchParams();
      params.append("month", month);
      params.append("year", year);
      params.append("employee", employeeId);

      const response = await axios.get(`/api/calls/all?${params}`);

      if (response.data.success && response.data.callDataRecords) {
        // Process the data to get monthly performance
        const records = response.data.callDataRecords;
        const monthlyData = {
          employeeId,
          month,
          year,
          records,
          totalCalls: records.reduce((sum, r) => sum + r.totalCalls, 0),
          totalCallTime: records.reduce((sum, r) => sum + r.totalCallTime, 0),
          totalInterestedStudents: records.reduce(
            (sum, r) => sum + r.interestedStudents,
            0
          ),
          totalVisited: records.reduce((sum, r) => sum + r.visitedToday, 0),
          totalPerformanceScore: records.reduce(
            (sum, r) => sum + r.performanceScore,
            0
          ),
          averagePerformanceScore:
            records.length > 0
              ? (
                  records.reduce((sum, r) => sum + r.performanceScore, 0) /
                  records.length
                ).toFixed(1)
              : 0,
          totalDaysTracked: records.length,
          employee: records[0]?.employee || {},
        };
        setSelectedEmployeeData(monthlyData);
      }
    } catch (error) {
      console.error("Fetch employee monthly performance error:", error);
      toast.error("Failed to load employee performance data");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    fetchCallData();
  }, [month, year, department]);

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth);
  };

  const handleYearChange = (newYear) => {
    setYear(newYear);
  };

  const handleExportToExcel = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (month) params.append("month", month);
      if (year) params.append("year", year);
      if (department && department !== "all")
        params.append("department", department);

      const response = await axios.get(`/api/calls/export/excel?${params}`, {
        responseType: "blob",
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from response headers or use default
      const contentDisposition = response.headers["content-disposition"];
      let fileName = "caller_data.xlsx";
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up
      window.URL.revokeObjectURL(url);
      toast.success("Caller data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      if (error.response?.status === 404) {
        toast.error("No data found to export");
      } else {
        toast.error("Failed to export caller data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportEmployeeData = async () => {
    if (!selectedEmployeeData) return;

    try {
      setDetailLoading(true);
      const params = new URLSearchParams();
      params.append("employee", selectedEmployeeData.employee?._id || selectedEmployeeData.employeeId);
      params.append("month", selectedEmployeeData.month);
      params.append("year", selectedEmployeeData.year);

      const response = await axios.get(`/api/calls/export/excel?${params}`, {
        responseType: "blob",
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Generate filename: employeeName_Month_LastDate.xlsx
      const employeeName = selectedEmployeeData.employee?.name
        ?.replace(/\s+/g, "_")
        .toLowerCase() || "employee";

      const monthName = new Date(selectedEmployeeData.year, selectedEmployeeData.month - 1)
        .toLocaleString("default", { month: "long" });

      const lastDate = selectedEmployeeData.records && selectedEmployeeData.records.length > 0
        ? new Date(selectedEmployeeData.records[0].date).toLocaleDateString("en-IN")
        : new Date().toLocaleDateString("en-IN");

      const fileName = `${employeeName}_${monthName}_${lastDate}.xlsx`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up
      window.URL.revokeObjectURL(url);
      toast.success("Employee data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      if (error.response?.status === 404) {
        toast.error("No data found to export");
      } else {
        toast.error("Failed to export employee data");
      }
    } finally {
      setDetailLoading(false);
    }
  };

  // Simple bar chart component
  const SimpleBarChart = ({ data, maxValue }) => {
    return (
      <div className="space-y-3">
        {data.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-32 truncate text-sm font-medium text-gray-700">
              {item.employee?.name || "Unknown"}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                style={{ width: `${(item.performanceScore / maxValue) * 100}%` }}
              >
                {item.performanceScore > 0 && (
                  <span className="text-white text-xs font-bold">
                    {item.performanceScore?.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Employee Detail Modal Component
  const EmployeeDetailModal = () => {
    if (!selectedEmployeeData) return null;

    const monthName = new Date(selectedEmployeeData.year, selectedEmployeeData.month - 1, 1).toLocaleString(
      "default",
      { month: "long", year: "numeric" }
    );

    return (
      <div className="modal-overlay" onClick={() => {
        setShowEmployeeDetails(null);
        setSelectedEmployeeData(null);
      }}>
        <div
          className="modal-container modal-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <h3 className="modal-title">
                {selectedEmployeeData.employee?.name} - Monthly Performance
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {monthName} · {selectedEmployeeData.employee?.employeeId}
              </p>
            </div>
            <button
              onClick={() => {
                setShowEmployeeDetails(null);
                setSelectedEmployeeData(null);
              }}
              className="modal-close-btn"
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="modal-content">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="spinner"></span>
                <span className="ml-2">Loading performance data...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium mb-1">
                      Performance Score
                    </p>
                    <p className="text-3xl font-bold text-blue-700">
                      {selectedEmployeeData.averagePerformanceScore}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Average ({selectedEmployeeData.totalDaysTracked} days tracked)
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium mb-1">
                      Days Tracked
                    </p>
                    <p className="text-3xl font-bold text-purple-700">
                      {selectedEmployeeData.totalDaysTracked}
                    </p>
                    <p className="text-xs text-purple-600 mt-2">
                      days in {monthName}
                    </p>
                  </div>
                </div>

                {/* Four Key Metrics */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700 mb-1">
                      {selectedEmployeeData.totalVisited}
                    </p>
                    <p className="text-sm text-blue-600 font-medium">
                      👥 Visited
                    </p>
                    <p className="text-xs text-blue-500 mt-2">
                      40% weightage
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-700 mb-1">
                      {selectedEmployeeData.totalInterestedStudents}
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      😊 Interested
                    </p>
                    <p className="text-xs text-green-500 mt-2">
                      30% weightage
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-orange-700 mb-1">
                      {selectedEmployeeData.totalCallTime}
                    </p>
                    <p className="text-sm text-orange-600 font-medium">
                      ⏱️ Call Time (min)
                    </p>
                    <p className="text-xs text-orange-500 mt-2">
                      20% weightage
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-700 mb-1">
                      {selectedEmployeeData.totalCalls}
                    </p>
                    <p className="text-sm text-red-600 font-medium">
                      📞 Total Calls
                    </p>
                    <p className="text-xs text-red-500 mt-2">
                      10% weightage
                    </p>
                  </div>
                </div>

                {/* Daily Breakdown Table */}
                {selectedEmployeeData.records && selectedEmployeeData.records.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h4 className="font-semibold text-gray-900">
                        Daily Performance Breakdown
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-2 px-3 text-sm font-semibold">
                              Date
                            </th>
                            <th className="text-center py-2 px-3 text-sm font-semibold">
                              Visited
                            </th>
                            <th className="text-center py-2 px-3 text-sm font-semibold">
                              Interested
                            </th>
                            <th className="text-center py-2 px-3 text-sm font-semibold">
                              Call Time
                            </th>
                            <th className="text-center py-2 px-3 text-sm font-semibold">
                              Calls
                            </th>
                            <th className="text-center py-2 px-3 text-sm font-semibold">
                              Score
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEmployeeData.records.map((record, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-3 text-sm">
                                {new Date(record.date).toLocaleDateString()}
                              </td>
                              <td className="text-center py-2 px-3">
                                <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                                  {record.visitedToday}
                                </span>
                              </td>
                              <td className="text-center py-2 px-3">
                                <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                                  {record.interestedStudents}
                                </span>
                              </td>
                              <td className="text-center py-2 px-3 text-sm">
                                {record.totalCallTime} min
                              </td>
                              <td className="text-center py-2 px-3 text-sm">
                                {record.totalCalls}
                              </td>
                              <td className="text-center py-2 px-3">
                                <span className="inline-block bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold">
                                  {record.performanceScore?.toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* No Data Message */}
                {(!selectedEmployeeData.records || selectedEmployeeData.records.length === 0) && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p>No call data available for this employee in {monthName}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleExportEmployeeData}
              disabled={detailLoading || !selectedEmployeeData?.records || selectedEmployeeData.records.length === 0}
              className="btn btn-success"
              title="Download employee data as Excel"
            >
              {detailLoading ? (
                <>
                  <span className="spinner-small mr-2"></span>
                  Exporting...
                </>
              ) : (
                <>📥 Download Employee Data</>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEmployeeDetails(null);
                setSelectedEmployeeData(null);
              }}
              className="btn btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="spinner"></span>
        <span className="ml-2">Loading caller data...</span>
      </div>
    );
  }

  const maxScore =
    performanceData.length > 0
      ? Math.max(...performanceData.map((p) => p.performanceScore))
      : 0;

  return (
    <>
      {showEmployeeDetails && <EmployeeDetailModal />}
      <div className="caller-data-section space-y-6">
      {/* Filter and Export Section */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Filters & Export</h3>
            <button
              onClick={handleExportToExcel}
              disabled={loading || performanceData.length === 0}
              className="btn btn-primary"
              title="Download caller data as Excel"
            >
              📥 Download Excel
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Month</label>
              <select
                value={month}
                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                className="form-select"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {new Date(2024, m - 1, 1).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year</label>
              <select
                value={year}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="form-select"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performer Card */}
      {topPerformer && (
        <div className="card border-2 border-yellow-400 bg-yellow-50">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              Top Performer
            </h3>
          </div>
          <div className="card-content">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="text-2xl font-bold text-gray-900">
                  {topPerformer.employee?.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {topPerformer.employee?.employeeId}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-xs text-gray-600 mb-1">Performance Score</p>
                  <p className="text-xl font-bold text-blue-600">
                    {topPerformer.performanceScore?.toFixed(1)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-xs text-gray-600 mb-1">Records</p>
                  <p className="text-xl font-bold text-blue-600">
                    {topPerformer.recordCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Top Performer Stats */}
            <div className="grid md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <p className="text-sm text-gray-600">Visited</p>
                <p className="text-2xl font-bold text-blue-600">
                  {topPerformer.totalVisited}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Interested</p>
                <p className="text-2xl font-bold text-green-600">
                  {topPerformer.totalInterestedStudents}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Call Time (mins)</p>
                <p className="text-2xl font-bold text-purple-600">
                  {topPerformer.totalCallTime}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-orange-600">
                  {topPerformer.totalCalls}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Statistics */}
      {overallStats && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Overall Statistics</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Employees Tracked</span>
                  <span className="text-2xl font-bold">
                    {overallStats.totalEmployeesTracked}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Total Visited</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {overallStats.totalVisited}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Total Interested</span>
                  <span className="text-2xl font-bold text-green-600">
                    {overallStats.totalInterestedStudents}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Total Call Time (mins)</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {overallStats.totalCallTime}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Calls</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {overallStats.totalCalls}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Average Performance</h3>
            </div>
            <div className="card-content">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {overallStats.averagePerformanceScore}
                  </div>
                  <p className="text-gray-600">Average Score</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Based on all tracked employees
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Chart */}
      {performanceData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Performance Ranking</h3>
            <p className="card-description">
              Top performers by performance score
            </p>
          </div>
          <div className="card-content">
            <SimpleBarChart data={performanceData} maxValue={maxScore} />
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Employee Call Data Details</h3>
          <p className="card-description">
            Complete call tracking data for all employees
          </p>
        </div>
        <div className="card-content">
          {performanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-center py-3 px-4 font-semibold">
                      Visited
                    </th>
                    <th className="text-center py-3 px-4 font-semibold">
                      Interested
                    </th>
                    <th className="text-center py-3 px-4 font-semibold">
                      Call Time
                    </th>
                    <th className="text-center py-3 px-4 font-semibold">Calls</th>
                    <th className="text-center py-3 px-4 font-semibold">Score</th>
                    <th className="text-center py-3 px-4 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((performer, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">
                            {performer.employee?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {performer.employee?.employeeId}
                          </p>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {performer.totalVisited}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {performer.totalInterestedStudents}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 font-medium">
                        {performer.totalCallTime} min
                      </td>
                      <td className="text-center py-3 px-4 font-medium">
                        {performer.totalCalls}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded font-semibold">
                          {performer.performanceScore?.toFixed(1)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <button
                          onClick={() => {
                            setShowEmployeeDetails(performer.employee?._id);
                            fetchEmployeeMonthlyPerformance(
                              performer.employee?._id
                            );
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No call data available for the selected period</p>
            </div>
          )}
        </div>
      </div>

      {/* Weightage Info */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="card-content">
          <h4 className="font-semibold text-gray-900 mb-4">
            Performance Score Weightage
          </h4>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-sm font-medium">Visited Students</p>
                <p className="text-lg font-bold text-blue-600">40%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="text-sm font-medium">Interested</p>
                <p className="text-lg font-bold text-green-600">30%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="text-sm font-medium">Call Time</p>
                <p className="text-lg font-bold text-purple-600">20%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📞</span>
              <div>
                <p className="text-sm font-medium">Total Calls</p>
                <p className="text-lg font-bold text-orange-600">10%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminCallerDataSection;
