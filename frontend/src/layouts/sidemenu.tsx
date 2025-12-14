import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";


interface SidemenuProps {
  onLogout: () => void;
}

function Sidemenu({ onLogout }: SidemenuProps) {
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(location.pathname);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu);
  };

  return (
    <aside className="app-sidebar" id="sidebar">
      <div className="main-sidebar-header">
        <a href="#" className="header-logo"></a>
      </div>
      <div className="main-sidebar" id="sidebar-scroll">
        <nav className="main-menu-container nav nav-pills flex-col sub-open">
          <ul className="main-menu">
            <li>
              <a href="#">
                <center>
                  <img
                    src="/images/pos-system/logo1.jpg"
                    className="rounded-full transparent-shadow"
                    style={{ maxHeight: "150px" }}
                    alt="Troy-Dean MotorParts Logo"
                  />
                </center>
              </a>
            </li>
            <li>
              <hr className="mt-3" />
            </li>
            <li className="slide__category">
              <span className="category-name">Main</span>
            </li>

            {[
              { to: "/dashboard", icon: "bi-speedometer", label: "Dashboard" },
              { to: "/pos", icon: "bi-cash-coin", label: "Buy/Purchase" },
              { to: "/sales", icon: "bi-cart-fill", label: "Transaction History" },
              { to: "/inventory", icon: "bi-box-seam", label: "Manage Inventory" },
              { to: "/categories", icon: "bi-tags", label: "Categories" },
              { to: "/item-damage", icon: "bi-exclamation-triangle", label: "Item Damage" },
              { to: "/supplier", icon: "bi-truck", label: "Manage Suppliers" },
              { to: "/sales-report", icon: "bi-bar-chart-line", label: "Sales Report" },
            ].map((item) => (
              <li key={item.to} className="slide">
                <Link
                  to={item.to}
                  className={`side-menu__item ${activeMenu === item.to
                    ? "bg-blue-200 text-blue-700 font-bold"
                    : "text-gray-700"
                    }`}
                  onClick={() => handleMenuClick(item.to)}
                >
                  <i className={`bi ${item.icon} side-menu__icon`}></i>
                  <span className="side-menu__label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

export default Sidemenu;