import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import './assets/css/style.css';
import Dashboard from './pages/dashboard.tsx';
import AdminLoginPage from './pages/AdminLogin.tsx';
import PointOfSale from './pages/POS/pos.tsx';

// Transaction History Page
import Transaction_History from './pages/purchase_history/list.tsx';

// Supplier Pages
import Supplier_List from './pages/supplier/list.tsx';
import Supplier_Registration from './pages/supplier/registration.tsx';

// Inventory Pages
import Inventory_List from './pages/inventory_info/list.tsx';
import Inventory_Registration from './pages/inventory_info/register.tsx';

// Categories Page
import Categories_List from './pages/categories/list.tsx';

// Item Damage Page
import ItemDamage_List from './pages/item_damage/list.tsx';

// Financial Pages (To be added later)

// Import SalesReport
import SalesReport from './pages/SalesReport/SalesReport.tsx';

// Function to check if the user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem("adminToken") !== null;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Default Route → Redirect to Admin Login */}
        <Route path="/" element={<Navigate to="/admin" />} />

        {/* Admin Login Route */}
        <Route path="/admin" element={<AdminLoginPage />} />

        {/* Dashboard (Protected) */}
        <Route
          path="/dashboard"
          element={isAuthenticated() ? <Dashboard /> : <Navigate to="/admin" />}
        />

        {/* Transaction History Route (Protected) */}
        <Route path="/sales" element={isAuthenticated() ? <Transaction_History /> : <Navigate to="/admin" />} />

        {/* Supplier Routes (Protected) */}
        <Route path="/supplier" element={isAuthenticated() ? <Supplier_List /> : <Navigate to="/admin" />} />
        <Route path="/supplier/create" element={isAuthenticated() ? <Supplier_Registration /> : <Navigate to="/admin" />} />

        {/* Inventory Routes (Protected) */}
        <Route path="/inventory" element={isAuthenticated() ? <Inventory_List /> : <Navigate to="/admin" />} />
        <Route path="/inventory/create" element={isAuthenticated() ? <Inventory_Registration /> : <Navigate to="/admin" />} />

        {/* Categories Route (Protected) */}
        <Route path="/categories" element={isAuthenticated() ? <Categories_List /> : <Navigate to="/admin" />} />

        {/* POS Route (Protected) */}
        <Route path="/pos" element={isAuthenticated() ? <PointOfSale /> : <Navigate to="/admin" />} />

        {/* Sales Report Route (Protected) */}
        <Route path="/sales-report" element={isAuthenticated() ? <SalesReport /> : <Navigate to="/admin" />} />

        {/* Item Damage Route (Protected) */}
        <Route path="/item-damage" element={isAuthenticated() ? <ItemDamage_List /> : <Navigate to="/admin" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);