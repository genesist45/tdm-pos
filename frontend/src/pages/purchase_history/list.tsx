import React, { useEffect, useRef, useState } from "react";
import { Grid, html } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import axios from "axios";

interface Purchase {
    id: number;
    purchase_id: string;
    total_amount: number;
    items: {
        id: number;
        name: string;
        price: number;
        quantity: number;
    }[];
    amount_received: number;
    change: number;
    created_at: string;
}

const Purchase_History: React.FC = () => {
    const gridRef = useRef<HTMLDivElement>(null);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        const fetchPurchases = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/purchase-history');
                console.log('Fetched purchases:', response.data); // Debug log
                setPurchases(response.data);
            } catch (error) {
                console.error('Error fetching purchase history:', error);
            }
        };

        fetchPurchases();
    }, []);

    useEffect(() => {
        if (gridRef.current && purchases.length > 0) {
            console.log('Rendering grid with purchases:', purchases); // Debug log
            gridRef.current.innerHTML = "";

            const style = document.createElement('style');
            style.textContent = `
                .gridjs-table td:first-child {
                    padding-right: 8px !important;
                }
                .main-content.app-content {
                    padding-top: 0 !important;
                }
            `
            document.head.appendChild(style);

            new Grid({
                columns: [
                    { name: "#", width: "50px" },
                    { name: "Purchase ID", width: "100px" },
                    {
                        name: "Items",
                        width: "150px",
                        formatter: (_, row) => {
                            const purchase = purchases.find((p) => p.purchase_id === row.cells[1].data);
                            if (purchase && purchase.items) {
                                return html(
                                    purchase.items.map((item) => 
                                        `<div class="text-xs">${item.name} (${item.quantity}x)</div>`
                                    ).join("")
                                );
                            }
                            return html("<div>-</div>");
                        },
                    },
                    { 
                        name: "Total Amount", 
                        width: "150px", 
                        formatter: (cell) => `₱${Number(cell).toFixed(2)}` 
                    },
                    { 
                        name: "Amount Received", 
                        width: "180px", 
                        formatter: (cell) => `₱${Number(cell).toFixed(2)}` 
                    },
                    { 
                        name: "Change", 
                        width: "120px", 
                        formatter: (cell) => `₱${Number(cell).toFixed(2)}` 
                    },
                    { 
                        name: "Date", 
                        width: "150px", 
                        formatter: (cell) => {
                            try {
                                return new Date(cell as string).toLocaleString();
                            } catch (e) {
                                return cell;
                            }
                        }
                    },
                    
                        
                    
                ],
                pagination: { limit: 10 },
                search: true,
                sort: true,
                data: purchases.map((row, index) => [
                    (index + 1) + ".",
                    row.purchase_id,
                    row.items,
                    row.total_amount,
                    row.amount_received,
                    row.change,
                    row.created_at,
                ]),
            }).render(gridRef.current);

            window.viewPurchase = (id: string) => {
                const purchase = purchases.find((p) => p.purchase_id === id);
                if (purchase) {
                    setSelectedPurchase(purchase);
                    setIsViewModalOpen(true);
                }
            };

            window.deletePurchase = async (id: string) => {
                if (window.confirm("Are you sure you want to delete this purchase?")) {
                    try {
                        await axios.delete(`http://localhost:8000/api/purchase-history/${id}`);
                        setPurchases(purchases.filter((p) => p.purchase_id !== id));
                    } catch (error) {
                        console.error('Error deleting purchase:', error);
                        alert('Error deleting purchase. Please try again.');
                    }
                }
            };
        }
    }, [purchases]);

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedPurchase(null);
    };

    return (
        <>
            <Header onLogout={() => {}} />
            <Sidemenu onLogout={() => {}} />
            <div className="main-content app-content">
                <div className="container-fluid">
                    <Breadcrumb
                        title="Purchase History"
                        links={[{ text: "Dashboard", link: "/dashboard" }]}
                        active="Purchase"
                    />
                    <div className="grid grid-cols-12 gap-x-6">
                        <div className="xxl:col-span-12 col-span-12">
                            <div className="box overflow-hidden main-content-card">
                                <div className="box-body p-5">
                                    {purchases.length === 0 ? (
                                        <div className="text-center text-gray-500 py-4">
                                            No purchase history found
                                        </div>
                                    ) : (
                                        <div ref={gridRef}></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isViewModalOpen && selectedPurchase && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg w-1/2">
                        <h2 className="text-lg font-semibold mb-4">Purchase Details</h2>
                        <p>
                            <strong>Purchase ID:</strong> {selectedPurchase.purchase_id}
                        </p>
                        <p>
                            <strong>Date:</strong> {new Date(selectedPurchase.created_at).toLocaleString()}
                        </p>
                        <p>
                            <strong>Total Amount:</strong> ₱{selectedPurchase.total_amount.toFixed(2)}
                        </p>
                        <p>
                            <strong>Amount Received:</strong> ₱{selectedPurchase.amount_received.toFixed(2)}
                        </p>
                        <p>
                            <strong>Change:</strong> ₱{selectedPurchase.change.toFixed(2)}
                        </p>
                        <h3 className="font-semibold mt-4">Items:</h3>
                        <ul className="mt-2">
                            {selectedPurchase.items.map((item) => (
                                <li key={item.id} className="text-sm mb-1">
                                    {item.name} - Quantity: {item.quantity} - Price: ₱{(item.price * item.quantity).toFixed(2)}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 flex justify-end">
                            <button 
                                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500" 
                                onClick={closeViewModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Purchase_History;

declare global {
    interface Window {
        viewPurchase: (id: string) => void;
        deletePurchase: (id: string) => void;
    }
}
