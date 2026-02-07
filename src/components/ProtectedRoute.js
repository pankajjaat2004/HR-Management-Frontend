import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const employee = localStorage.getItem("employee");

    if (!token || !employee) {
      toast.error("Please login to access this page");
      navigate(requireAdmin ? "/admin-login" : "/login");
      return;
    }

    try {
      const employeeData = JSON.parse(employee);

      if (requireAdmin && employeeData.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate("/admin-login");
        return;
      }
    } catch (error) {
      toast.error("Invalid session. Please login again.");
      navigate(requireAdmin ? "/admin-login" : "/login");
      return;
    }
  }, [navigate, requireAdmin]);

  return children;
};

export default ProtectedRoute;
