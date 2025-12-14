import React, { useState, useEffect } from 'react';
import Header from '../../layouts/header';
import Sidemenu from '../../layouts/sidemenu';
import Breadcrumb from '../../components/breadcrums';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import './SalesReport.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface SalesData {
    date: string;
    totalAmount: number;
    transactions?: number;
    purchase_id: string;
    items: any[];
    amount_received: number;
    change: number;
}

interface ProcessedSalesData {
    period: string;
    totalSales: number;
    transactions: number;
    averageOrderValue: number;
}

const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const formatWeekLabel = (weekKey: string): string => {
    const [year, week] = weekKey.split('-W');
    const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);
    return `${date.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
};

const groupSalesByWeek = (data: SalesData[]): ProcessedSalesData[] => {
    const weeklySales: { [week: string]: { total: number; count: number; orders: number[] } } = {};
    data.forEach((sale) => {
        const date = new Date(sale.date);
        const year = date.getFullYear();
        const weekNumber = getWeekNumber(date);
        const weekKey = `${year}-W${weekNumber}`;
        weeklySales[weekKey] = weeklySales[weekKey] || { total: 0, count: 0, orders: [] };
        weeklySales[weekKey].total += sale.totalAmount;
        weeklySales[weekKey].count += sale.transactions || 1;
        weeklySales[weekKey].orders.push(sale.totalAmount);
    });

    return Object.entries(weeklySales).map(([week, { total, count, orders }]) => ({
        period: formatWeekLabel(week),
        totalSales: total,
        transactions: count,
        averageOrderValue: total / count
    }));
};

const groupSalesByMonth = (data: SalesData[]): ProcessedSalesData[] => {
    const monthlySales: { [monthYear: string]: { total: number; count: number; orders: number[] } } = {};
    data.forEach((sale) => {
        const date = new Date(sale.date);
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long' });
        const monthYearKey = `${year}-${month}`;
        monthlySales[monthYearKey] = monthlySales[monthYearKey] || { total: 0, count: 0, orders: [] };
        monthlySales[monthYearKey].total += sale.totalAmount;
        monthlySales[monthYearKey].count += sale.transactions || 1;
        monthlySales[monthYearKey].orders.push(sale.totalAmount);
    });

    return Object.entries(monthlySales).map(([monthYear, { total, count, orders }]) => ({
        period: monthYear,
        totalSales: total,
        transactions: count,
        averageOrderValue: total / count
    }));
};

const groupSalesByFifteenDays = (data: SalesData[]): ProcessedSalesData[] => {
    const fifteenDaySales: { [period: string]: { total: number; count: number; orders: number[] } } = {};

    data.forEach((sale) => {
        const date = new Date(sale.date);
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();

        // Determine which 15-day period this sale belongs to
        const period = day <= 15 ? '1-15' : '16-31';
        const periodKey = `${year}-${month + 1}-${period}`;

        fifteenDaySales[periodKey] = fifteenDaySales[periodKey] || { total: 0, count: 0, orders: [] };
        fifteenDaySales[periodKey].total += sale.totalAmount;
        fifteenDaySales[periodKey].count += sale.transactions || 1;
        fifteenDaySales[periodKey].orders.push(sale.totalAmount);
    });

    return Object.entries(fifteenDaySales).map(([periodKey, { total, count, orders }]) => {
        const [year, month, period] = periodKey.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
        return {
            period: `${monthName} ${period}`,
            totalSales: total,
            transactions: count,
            averageOrderValue: total / count
        };
    });
};

function SalesReport() {
    const [reportType, setReportType] = useState<'fifteen-days' | 'monthly'>('monthly');
    const [salesDataState, setSalesDataState] = useState<SalesData[]>([]);
    const [processedData, setProcessedData] = useState<ProcessedSalesData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/purchase-history');
                const fetchedData: SalesData[] = response.data
                    .map((item: any) => ({
                        date: item.created_at,
                        totalAmount: parseFloat(item.total_amount),
                        transactions: 1,
                        purchase_id: item.purchase_id,
                        items: item.items,
                        amount_received: parseFloat(item.amount_received),
                        change: parseFloat(item.change)
                    }))
                    .filter((item: SalesData) => {
                        const saleDate = new Date(item.date);
                        return saleDate >= new Date(dateRange.start) && saleDate <= new Date(dateRange.end);
                    });
                setSalesDataState(fetchedData);
                setLoading(false);
            } catch (err: any) {
                console.error('Error fetching sales data:', err);
                setError(err.response?.data?.message || 'Failed to fetch sales data');
                setLoading(false);
            }
        };
        fetchSalesData();
    }, [dateRange]);

    useEffect(() => {
        const processReport = () => {
            if (reportType === 'fifteen-days') {
                setProcessedData(groupSalesByFifteenDays(salesDataState));
            } else if (reportType === 'monthly') {
                setProcessedData(groupSalesByMonth(salesDataState));
            }
        };
        processReport();
    }, [reportType, salesDataState]);

    const handleReportTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setReportType(event.target.value as 'fifteen-days' | 'monthly');
    };

    const handleDateRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({
            ...prev,
            [event.target.name]: event.target.value
        }));
    };

    const totalSales = processedData.reduce((sum, item) => sum + item.totalSales, 0);
    const totalTransactions = processedData.reduce((sum, item) => sum + item.transactions, 0);
    const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    const handleLogout = () => {
        console.log('Logout clicked from Sales Report page');
        localStorage.removeItem("adminToken");
        navigate("/admin");
    };

    return (
        <div className="sales-report-page">
            <Sidemenu onLogout={handleLogout} />
            <div className="main-content-wrapper">
                <Header onLogout={handleLogout} />
                <div className="main-content app-content p-6 bg-white dark:bg-gray-900 transition-colors duration-300">
                    <div className="container-fluid">
                        <Breadcrumb
                            title="Sales Report"
                            links={[
                                { text: 'Home', link: '/dashboard' },
                                { text: 'Sales Report', link: '/sales-report' },
                            ]}
                        />

                        <div className="report-header">
                            <h2 className="report-title text-gray-800 dark:text-white">Sales Report</h2>
                            <div className="report-controls">
                                <div className="date-range-controls mr-4">
                                    <input
                                        type="date"
                                        name="start"
                                        value={dateRange.start}
                                        onChange={handleDateRangeChange}
                                        className="report-date-input"
                                    />
                                    <span className="mx-2">to</span>
                                    <input
                                        type="date"
                                        name="end"
                                        value={dateRange.end}
                                        onChange={handleDateRangeChange}
                                        className="report-date-input"
                                    />
                                </div>
                                <label htmlFor="reportType" className="report-label text-gray-700 dark:text-gray-300">
                                    View:
                                </label>
                                <select
                                    id="reportType"
                                    value={reportType}
                                    onChange={handleReportTypeChange}
                                    className="report-select bg-white border rounded text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="fifteen-days">15-Day Period</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center">Loading sales data...</div>
                        ) : error ? (
                            <div className="text-center text-red-500">Error: {error}</div>
                        ) : (
                            <>
                                <div className="metrics-container grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="metric-card bg-white p-4 rounded-lg shadow-md dark:bg-gray-800">
                                        <h3 className="metric-title text-gray-600 dark:text-gray-400">Total Sales</h3>
                                        <p className="metric-value text-xl font-bold text-gray-900 dark:text-white">₱{totalSales.toFixed(2)}</p>
                                    </div>
                                    <div className="metric-card bg-white p-4 rounded-lg shadow-md dark:bg-gray-800">
                                        <h3 className="metric-title text-gray-600 dark:text-gray-400">Total Transactions</h3>
                                        <p className="metric-value text-xl font-bold text-gray-900 dark:text-white">{totalTransactions}</p>
                                    </div>
                                    <div className="metric-card bg-white p-4 rounded-lg shadow-md dark:bg-gray-800">
                                        <h3 className="metric-title text-gray-600 dark:text-gray-400">Avg. Purchase Value</h3>
                                        <p className="metric-value text-xl font-bold text-gray-900 dark:text-white">₱{averageOrderValue.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="chart-section bg-white p-6 shadow-lg rounded-lg dark:bg-gray-800">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="chart-title text-gray-800 dark:text-white">Sales Trends</h3>
                                        <div className="report-type-label bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                                            {reportType === 'monthly' ? 'Monthly Sales Report' : '15-Day Period Sales Report'}
                                        </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={processedData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="period"
                                                style={{ fontSize: '0.9rem' }}
                                                stroke="#666"
                                                tick={{ fill: '#666' }}
                                                type="category"
                                            />
                                            <YAxis
                                                tickFormatter={(value) => `₱${value}`}
                                                style={{ fontSize: '0.9rem' }}
                                                stroke="#666"
                                                tick={{ fill: '#666' }}
                                            />
                                            <Tooltip
                                                formatter={(value, name) => {
                                                    if (name === 'Total Sales (₱)') {
                                                        return `₱${(value as number).toFixed(2)}`;
                                                    } else if (name === 'Transactions') {
                                                        return value;
                                                    } else if (name === 'Average Order Value') {
                                                        return `₱${(value as number).toFixed(2)}`;
                                                    }
                                                    return value;
                                                }}
                                                labelFormatter={(label) => `Period: ${label}`}
                                                labelStyle={{ fontSize: '0.8rem', color: '#333' }}
                                                itemStyle={{ fontSize: '0.8rem', color: '#555' }}
                                            />
                                            <Legend
                                                wrapperStyle={{ fontSize: '0.9rem' }}
                                                iconSize={14}
                                            />
                                            <Bar
                                                dataKey="totalSales"
                                                fill="#5488FF"
                                                name="Total Sales (₱)"
                                                barSize={30}
                                            />
                                            <Bar
                                                dataKey="transactions"
                                                fill="#A0BFEF"
                                                name="Transactions"
                                                barSize={30}
                                            />
                                            <Bar
                                                dataKey="averageOrderValue"
                                                fill="#FFB74D"
                                                name="Average Order Value"
                                                barSize={30}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="table-section bg-white p-6 shadow-lg rounded-lg mt-6 dark:bg-gray-800">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="table-title text-gray-800 dark:text-white">Sales Details</h3>
                                        <button
                                            onClick={() => window.print()}
                                            className="print-button"
                                            title="Print Report"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="sales-table w-full">
                                            <thead className="table-header">
                                                <tr>
                                                    <th className="th text-gray-800 dark:text-white">Period</th>
                                                    <th className="th text-gray-800 dark:text-white">Total Sales (₱)</th>
                                                    <th className="th text-gray-800 dark:text-white">Transactions</th>
                                                    <th className="th text-gray-800 dark:text-white">Average Order Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className="table-body">
                                                {processedData.map((item, index) => (
                                                    <tr
                                                        key={index}
                                                        className={`${index % 2 === 0 ? 'even-row' : 'odd-row'} text-gray-700 dark:text-gray-300`}
                                                    >
                                                        <td className="td">{item.period}</td>
                                                        <td className="td">₱{item.totalSales.toFixed(2)}</td>
                                                        <td className="td">{item.transactions}</td>
                                                        <td className="td">₱{item.averageOrderValue.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SalesReport;