import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../components/breadcrums";
import Header from "../layouts/header";
import Sidemenu from "../layouts/sidemenu";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MdBuild, MdDirectionsCar, MdElectricBolt, MdSettings, MdShoppingCart, MdSpeed } from "react-icons/md";
import "./dashboard.css";
import axios from "axios";

interface SalesData {
    name: string;
    sales: number;
}

const motorPartsCategories = [
    { name: "Engine Parts", icon: <MdBuild size={32} /> },
    { name: "Brake Parts", icon: <MdSpeed size={32} /> },
    { name: "Electrical Parts", icon: <MdElectricBolt size={32} /> },
    { name: "Body Parts", icon: <MdDirectionsCar size={32} /> },
    { name: "Transmission Parts", icon: <MdSettings size={32} /> },
    { name: "Accessories", icon: <MdShoppingCart size={32} /> },
];

function Dashboard() {
    const navigate = useNavigate();
    const [totalSales, setTotalSales] = useState<number | null>(null);
    const [totalInventory, setTotalInventory] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [salesTrendData, setSalesTrendData] = useState<SalesData[]>([]);

    useEffect(() => {
        console.log("Token in Dashboard useEffect: ", localStorage.getItem("adminToken"));
        const adminToken = localStorage.getItem("adminToken");
        if (!adminToken) {
            navigate("/admin");
        }

        const fetchSalesData = async () => {
            try {
                // Fetch purchase history
                const purchaseResponse = await axios.get('http://localhost:8000/api/purchase-history');
                const purchaseHistory = purchaseResponse.data;

                // Fetch total refunds from damaged items
                const refundsResponse = await axios.get('http://localhost:8000/api/damaged-items-refunds');
                const totalRefunds = parseFloat(refundsResponse.data.total_refunds) || 0;

                // Calculate total sales (purchases only, not damage returns)
                const purchases = purchaseHistory.filter((item: any) => item.type === 'purchase');
                const grossSales = purchases.reduce((sum: number, purchase: any) => sum + parseFloat(purchase.total_amount), 0);

                // Net sales = Gross sales - Refunds
                const netSales = grossSales - totalRefunds;
                setTotalSales(netSales);

                // Process data for sales trend
                const monthlySales: { [key: string]: number } = {};

                // Initialize all months with 0
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                months.forEach(month => {
                    monthlySales[month] = 0;
                });

                // Aggregate sales by month (purchases only)
                purchases.forEach((purchase: any) => {
                    const date = new Date(purchase.created_at);
                    const month = months[date.getMonth()];
                    monthlySales[month] += parseFloat(purchase.total_amount);
                });

                // Convert to array format for the chart
                const trendData = months.map(month => ({
                    name: month,
                    sales: monthlySales[month]
                }));

                setSalesTrendData(trendData);

            } catch (err: any) {
                console.error('Error fetching sales data:', err);
                setError(err.response?.data?.message || 'Failed to fetch sales data');
            }
        };

        const fetchTotalInventory = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/inventory', {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                });

                if (!response.data || !Array.isArray(response.data)) {
                    throw new Error('Invalid response format from inventory API');
                }

                const inventory = response.data.reduce((sum: number, item: any) => {
                    const quantity = parseInt(item.quantity) || 0;
                    return sum + quantity;
                }, 0);

                setTotalInventory(inventory);
            } catch (err: any) {
                console.error('Error fetching total inventory:', err);
                setError(err.response?.data?.message || 'Failed to fetch total inventory');
                setTotalInventory(0);
            }
        };

        Promise.all([fetchSalesData(), fetchTotalInventory()])
            .finally(() => setLoading(false));

    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        console.log("Admin token removed on logout from Dashboard");
        navigate("/admin");
    };

    return (
        <div className="dashboard-page">
            <Sidemenu onLogout={handleLogout} />
            <div className="main-content-wrapper">
                <Header onLogout={handleLogout} />
                <div className="main-content app-content p-6">
                    <div className="container-fluid">
                        <Breadcrumb title="Dashboard" links={[{ text: "Home", link: "/dashboard" }, { text: "Dashboard", link: "/dashboard" }]} />

                        <div className="mb-10">
                            <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Categories</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-4 gap-y-6">
                                {motorPartsCategories.map((category, index) => (
                                    <div
                                        key={index}
                                        className={`bg-white p-3 rounded-md shadow-sm flex flex-col items-center hover:shadow-md transition-all ${index < 3 ? 'mb-6 md:mb-0' : ''
                                            }`}
                                    >
                                        {category.icon}
                                        <h3 className="text-sm font-semibold mt-1 text-gray-800 dark:text-white">{category.name}</h3>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-12 mt-10">
                            {loading ? (
                                <div className="col-span-2 text-center">Loading data...</div>
                            ) : error ? (
                                <div className="col-span-2 text-center text-red-500">Error: {error}</div>
                            ) : (
                                <>
                                    <div className="box p-10 bg-blue-100 rounded-lg text-center shadow-md">
                                        <h3 className="text-2xl font-semibold dark:text-white">Total Sales</h3>
                                        <p className="text-4xl font-bold dark:text-white">₱{totalSales !== null ? totalSales.toFixed(2) : 'N/A'}</p>
                                    </div>
                                    <div className="box p-10 bg-yellow-100 rounded-lg text-center shadow-md dark:bg-gray-700">
                                        <h3 className="text-2xl font-semibold dark:text-white">Inventory</h3>
                                        <p className="text-4xl font-bold dark:text-white">{totalInventory !== null ? totalInventory : 'N/A'} Items</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-white p-6 shadow-lg rounded-lg">
                            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Sales Trends</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={salesTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => `₱${value}`} />
                                    <Tooltip
                                        formatter={(value: number) => [`₱${value.toFixed(2)}`, 'Sales']}
                                        labelFormatter={(label) => `Month: ${label}`}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#8884d8"
                                        strokeWidth={2}
                                        name="Monthly Sales"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;