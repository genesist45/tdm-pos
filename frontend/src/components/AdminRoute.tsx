import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
    const token = localStorage.getItem("adminToken");
    return token ? <Outlet /> : <Navigate to="/admin" />; 
};

export default AdminRoute;