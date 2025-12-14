import React, { useEffect, useRef, useState } from "react";
import { Grid, html } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import axios from "axios";

interface TransactionItem {
    id?: number;
    name: string;
    price?: number;
    quantity: number;
}

interface Transaction {
    id: number;
    transaction_id: string;
    type: 'purchase' | 'damage_return';
    items: TransactionItem[];
    item_name: string | null;
    quantity: number | null;
    total_amount: number;
    amount_received: number;
    change: number;
    reason: string | null;
    processed_by: string | null;
    created_at: string;
}

const Transaction_History: React.FC = () => {
    const gridRef = useRef<HTMLDivElement>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/purchase-history');
                console.log('Fetched transactions:', response.data);
                setTransactions(response.data);
            } catch (error) {
                console.error('Error fetching transaction history:', error);
            }
        };

        fetchTransactions();
    }, []);

    useEffect(() => {
        if (gridRef.current && transactions.length > 0) {
            gridRef.current.innerHTML = "";

            const style = document.createElement('style');
            style.textContent = `
                .gridjs-table td:first-child {
                    padding-right: 8px !important;
                }
                .main-content.app-content {
                    padding-top: 0 !important;
                }
                .type-badge-purchase {
                    background-color: #10b981;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                }
                .type-badge-damage {
                    background-color: #ef4444;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                }
            `
            document.head.appendChild(style);

            new Grid({
                columns: [
                    { name: "#", width: "40px" },
                    {
                        name: "Type",
                        width: "100px",
                        formatter: (cell) => {
                            if (cell === 'purchase') {
                                return html(`<span class="type-badge-purchase">Purchase</span>`);
                            } else {
                                return html(`<span class="type-badge-damage">Damage Return</span>`);
                            }
                        }
                    },
                    { name: "Transaction ID", width: "130px" },
                    {
                        name: "Items",
                        width: "180px",
                        formatter: (_, row) => {
                            const transaction = transactions.find((t) => t.transaction_id === row.cells[2].data);
                            if (transaction && transaction.items && transaction.items.length > 0) {
                                return html(
                                    transaction.items.map((item) =>
                                        `<div class="text-xs">${item.name} (${item.quantity}x)</div>`
                                    ).join("")
                                );
                            }
                            return html("<div>-</div>");
                        },
                    },
                    {
                        name: "Total Amount",
                        width: "120px",
                        formatter: (cell, row) => {
                            const type = row.cells[1].data;
                            if (type === 'damage_return') {
                                return html(`<span class="text-red-500">N/A</span>`);
                            }
                            return `₱${Number(cell).toFixed(2)}`;
                        }
                    },
                    {
                        name: "Amount Received",
                        width: "130px",
                        formatter: (cell, row) => {
                            const type = row.cells[1].data;
                            if (type === 'damage_return') {
                                return html(`<span class="text-red-500">N/A</span>`);
                            }
                            return `₱${Number(cell).toFixed(2)}`;
                        }
                    },
                    {
                        name: "Change",
                        width: "100px",
                        formatter: (cell, row) => {
                            const type = row.cells[1].data;
                            if (type === 'damage_return') {
                                return html(`<span class="text-red-500">N/A</span>`);
                            }
                            return `₱${Number(cell).toFixed(2)}`;
                        }
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
                data: transactions.map((row, index) => [
                    (index + 1) + ".",
                    row.type,
                    row.transaction_id,
                    row.items,
                    row.total_amount,
                    row.amount_received,
                    row.change,
                    row.created_at,
                ]),
            }).render(gridRef.current);

            (window as any).viewTransaction = (id: string) => {
                const transaction = transactions.find((t) => t.transaction_id === id);
                if (transaction) {
                    setSelectedTransaction(transaction);
                    setIsViewModalOpen(true);
                }
            };
        }
    }, [transactions]);

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedTransaction(null);
    };

    return (
        <>
            <Header onLogout={() => { }} />
            <Sidemenu onLogout={() => { }} />
            <div className="main-content app-content">
                <div className="container-fluid">
                    <Breadcrumb
                        title="Transaction History"
                        links={[{ text: "Dashboard", link: "/dashboard" }]}
                        active="Transaction"
                    />
                    <div className="grid grid-cols-12 gap-x-6">
                        <div className="xxl:col-span-12 col-span-12">
                            <div className="box overflow-hidden main-content-card">
                                <div className="box-body p-5">
                                    {transactions.length === 0 ? (
                                        <div className="text-center text-gray-500 py-4">
                                            No transaction history found
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

            {isViewModalOpen && selectedTransaction && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10000
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '12px',
                            width: '500px',
                            maxWidth: '90%',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                                {selectedTransaction.type === 'purchase' ? 'Purchase Details' : 'Damage Return Details'}
                            </h2>
                            <span
                                style={{
                                    backgroundColor: selectedTransaction.type === 'purchase' ? '#10b981' : '#ef4444',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}
                            >
                                {selectedTransaction.type === 'purchase' ? 'Purchase' : 'Damage Return'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <strong>Transaction ID:</strong> {selectedTransaction.transaction_id}
                            </div>
                            <div>
                                <strong>Date:</strong> {new Date(selectedTransaction.created_at).toLocaleString()}
                            </div>

                            {selectedTransaction.type === 'purchase' && (
                                <>
                                    <div>
                                        <strong>Total Amount:</strong> ₱{selectedTransaction.total_amount.toFixed(2)}
                                    </div>
                                    <div>
                                        <strong>Amount Received:</strong> ₱{selectedTransaction.amount_received.toFixed(2)}
                                    </div>
                                    <div>
                                        <strong>Change:</strong> ₱{selectedTransaction.change.toFixed(2)}
                                    </div>
                                </>
                            )}

                            {selectedTransaction.type === 'damage_return' && (
                                <>
                                    <div>
                                        <strong>Reason:</strong> {selectedTransaction.reason}
                                    </div>
                                    <div>
                                        <strong>Processed By:</strong> {selectedTransaction.processed_by}
                                    </div>
                                </>
                            )}

                            <div>
                                <h3 style={{ fontWeight: '600', marginTop: '8px' }}>Items:</h3>
                                <ul style={{ marginTop: '8px' }}>
                                    {selectedTransaction.items.map((item, index) => (
                                        <li key={index} style={{ fontSize: '14px', marginBottom: '4px' }}>
                                            {item.name} - Quantity: {item.quantity}
                                            {item.price && selectedTransaction.type === 'purchase' && ` - Price: ₱${(item.price * item.quantity).toFixed(2)}`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                style={{
                                    backgroundColor: '#9ca3af',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
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

export default Transaction_History;
