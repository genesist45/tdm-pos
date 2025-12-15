import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./assets/css/style.css";
import Dashboard from "./pages/dashboard.tsx";
import AdminLoginPage from "./pages/AdminLogin.tsx";
import AdminRoute from "./components/AdminRoute.tsx";
import PointOfSale from "./pages/POS/pos.tsx";

// Transaction History Page
import Transaction_History from "./pages/purchase_history/list.tsx";

// Inventory Pages
import Inventory_List from "./pages/inventory_info/list.tsx";
import Inventory_Registration from "./pages/inventory_info/register.tsx";
import Inventory_Edit from "./pages/inventory_info/edit.tsx";

// Categories Page
import Categories_List from "./pages/categories/list.tsx";

// Item Damage Pages
import ItemDamage_List from "./pages/item_damage/list.tsx";
import ItemDamage_Add from "./pages/item_damage/add.tsx";
import ItemDamage_Edit from "./pages/item_damage/edit.tsx";

// Financial Pages (To be added later)

// Import SalesReport
import SalesReport from "./pages/SalesReport/SalesReport.tsx";



createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Default Route → Redirect to Admin Login */}
        <Route path="/" element={<Navigate to="/admin" />} />

        {/* Admin Login Route */}
        <Route path="/admin" element={<AdminLoginPage />} />

        {/* Protected Routes */}
        <Route element={<AdminRoute />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Transaction History */}
          <Route path="/sales" element={<Transaction_History />} />

          {/* Inventory Routes */}
          <Route path="/inventory" element={<Inventory_List />} />
          <Route path="/inventory/create" element={<Inventory_Registration />} />
          <Route path="/inventory/edit/:id" element={<Inventory_Edit />} />

          {/* Categories Route */}
          <Route path="/categories" element={<Categories_List />} />

          {/* POS Route */}
          <Route path="/pos" element={<PointOfSale />} />

          {/* Sales Report Route */}
          <Route path="/sales-report" element={<SalesReport />} />

          {/* Item Damage Routes */}
          <Route path="/item-damage" element={<ItemDamage_List />} />
          <Route path="/item-damage/add" element={<ItemDamage_Add />} />
          <Route path="/item-damage/edit/:id" element={<ItemDamage_Edit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
