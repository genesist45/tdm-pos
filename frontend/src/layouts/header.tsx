import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RiMenuLine, RiNotificationLine, RiSettingsLine, RiUserLine } from 'react-icons/ri';
import Avatar from '/src/assets/images/faces/14.jpg';
import axios from 'axios';

interface HeaderProps {
    onLogout: () => void;
}

interface LowStockItem {
    id: number;
    name: string;
    stock: number;
}

function Header({ onLogout }: HeaderProps) {
    const [isLogoutPopupVisible, setIsLogoutPopupVisible] = useState(false);
    const [isNotificationPopupVisible, setIsNotificationPopupVisible] = useState(false);
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
    const navigate = useNavigate();

    // Fetch low stock items
    useEffect(() => {
        const fetchLowStockItems = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/inventory');
                const lowStock = response.data
                    .filter((item: any) => item.quantity < 5)
                    .map((item: any) => ({
                        id: item.id,
                        name: item.product_name,
                        stock: item.quantity
                    }));
                setLowStockItems(lowStock);
            } catch (error) {
                console.error('Error fetching low stock items:', error);
            }
        };

        fetchLowStockItems();
        // Refresh every 5 minutes
        const interval = setInterval(fetchLowStockItems, 300000);
        return () => clearInterval(interval);
    }, []);

    const toggleLogoutPopup = () => {
        setIsLogoutPopupVisible(!isLogoutPopupVisible);
        setIsNotificationPopupVisible(false);
    };

    const toggleNotificationPopup = () => {
        setIsNotificationPopupVisible(!isNotificationPopupVisible);
        setIsLogoutPopupVisible(false);
    };

    const handleLogoutClick = () => {
        onLogout();
        navigate("/admin");
        setIsLogoutPopupVisible(false);
    };

    return (
        <header
            className="app-header sticky"
            id="header"
            style={{
                position: "sticky",
                top: 0,
                backgroundColor: 'white',
                zIndex: 100,
            }}
        >
            <div
                className="main-header-container container-fluid"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 20px",
                }}
            >
                <div className="header-content-right flex items-center space-x-3" style={{ alignItems: 'center', marginLeft: 'auto', marginRight: '-20px' }}>
                    <div className="header-element relative" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '4px', transition: 'background-color 0.2s ease-in-out' }}>
                        <button
                            onClick={toggleNotificationPopup}
                            className="header-link relative"
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                margin: 0,
                            }}
                        >
                            <RiNotificationLine style={{
                                fontSize: "20px",
                                color: "black",
                            }} />
                            {lowStockItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-10 h-5 flex items-center justify-center">
                                    {lowStockItems.length}
                                </span>
                            )}
                        </button>
                        {isNotificationPopupVisible && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    right: 0,
                                    background: 'white',
                                    border: "1px solid #ccc",
                                    borderRadius: "5px",
                                    padding: "10px",
                                    minWidth: "250px",
                                    maxHeight: "300px",
                                    overflowY: "auto",
                                    zIndex: 10,
                                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                                }}
                            >
                                <h3 className="font-semibold mb-2 text-black">Low Stock Items</h3>
                                {lowStockItems.length === 0 ? (
                                    <p className="text-black">No low stock items</p>
                                ) : (
                                    <div className="space-y-2">
                                        {lowStockItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-2 rounded hover:bg-gray-100"
                                            >
                                                <p className="font-medium text-black">{item.name}</p>
                                                <p className="text-sm text-red-500">Stock: {item.stock}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="header-element relative" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '4px', transition: 'background-color 0.2s ease-in-out' }}>
                        <button
                            type="button"
                            className="header-link p-0"
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                margin: 0,
                            }}
                            onClick={toggleLogoutPopup}
                        >
                            {Avatar ? (
                                <img
                                    src={Avatar}
                                    alt="user"
                                    className="rounded-circle header-avatar"
                                    style={{
                                        width: "30px",
                                        height: "30px",
                                        borderRadius: "50%",
                                    }}
                                />
                            ) : (
                                <RiUserLine style={{
                                    fontSize: "20px",
                                    color: "black",
                                }} />
                            )}
                        </button>
                        {isLogoutPopupVisible && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    right: 0,
                                    background: 'white',
                                    border: "1px solid #ccc",
                                    borderRadius: "5px",
                                    padding: "5px",
                                    display: "block",
                                    zIndex: 10,
                                }}
                            >
                                <button
                                    className="side-menu__item rounded hover:bg-gray-300 transition w-full text-left bg-gray-200 text-gray-700"
                                    onClick={handleLogoutClick}
                                >
                                    <i className="bi bi-box-arrow-left side-menu__icon"></i>
                                    <span className="side-menu__label">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;