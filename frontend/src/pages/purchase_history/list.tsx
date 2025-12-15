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
  type: "purchase" | "damage_return" | "good_item_return";
  items: TransactionItem[];
  item_name: string | null;
  quantity: number | null;
  total_amount: number;
  amount_received: number;
  change: number;
  reason: string | null;
  processed_by: string | null;
  refund_amount?: number;
  created_at: string;
}

interface DamagedItem {
  id: number;
  invoice_no: string;
  item_id: number | null;
  item_name: string;
  quantity_returned: number;
  item_price: number;
  refund_amount: number;
  return_type: string;
  return_reason: string;
  other_reason: string | null;
  return_date: string;
  processed_by: string;
  created_at: string;
}

type TabType = "purchases" | "item_returns";

const Transaction_History: React.FC = () => {
  const purchasesGridRef = useRef<HTMLDivElement>(null);
  const returnsGridRef = useRef<HTMLDivElement>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [damagedItems, setDamagedItems] = useState<DamagedItem[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [selectedDamagedItem, setSelectedDamagedItem] =
    useState<DamagedItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("purchases");
  const [loading, setLoading] = useState(true);

  // Add custom styles once on mount
  useEffect(() => {
    const existingStyle = document.getElementById("transaction-grid-styles");
    if (!existingStyle) {
      const style = document.createElement("style");
      style.id = "transaction-grid-styles";
      style.textContent = `
        .gridjs-table td:first-child {
          padding-right: 8px !important;
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
        .type-badge-good-item {
          background-color: #3b82f6;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [transactionsResponse, damagedItemsResponse] = await Promise.all([
          axios.get("http://localhost:8000/api/purchase-history"),
          axios.get("http://localhost:8000/api/damaged-items"),
        ]);
        setTransactions(transactionsResponse.data || []);
        setDamagedItems(damagedItemsResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter transactions for purchases only
  const purchaseTransactions = transactions.filter(
    (t) => t.type === "purchase",
  );

  // Render Purchases Grid
  useEffect(() => {
    if (
      activeTab === "purchases" &&
      purchasesGridRef.current &&
      purchaseTransactions.length > 0 &&
      !loading
    ) {
      purchasesGridRef.current.innerHTML = "";

      const grid = new Grid({
        columns: [
          { name: "#", width: "50px" },
          {
            name: "Type",
            width: "100px",
            formatter: () => {
              return html(`<span class="type-badge-purchase">Purchase</span>`);
            },
          },
          {
            name: "Receipt No.",
            width: "130px",
          },
          {
            name: "Items",
            width: "180px",
            formatter: (cell) => {
              return html(String(cell || "-"));
            },
          },
          {
            name: "Total Amount",
            width: "120px",
            formatter: (cell) => `₱${Number(cell || 0).toFixed(2)}`,
          },
          {
            name: "Amount Received",
            width: "130px",
            formatter: (cell) => `₱${Number(cell || 0).toFixed(2)}`,
          },
          {
            name: "Change",
            width: "100px",
            formatter: (cell) => `₱${Number(cell || 0).toFixed(2)}`,
          },
          {
            name: "Date",
            width: "160px",
          },
        ],
        pagination: { limit: 10 },
        search: true,
        sort: true,
        data: purchaseTransactions.map((row, index) => {
          const itemsDisplay =
            row.items && row.items.length > 0
              ? row.items
                  .map(
                    (item) =>
                      `${item.name || "Unknown"} (${item.quantity || 0}x)`,
                  )
                  .join("<br/>")
              : "-";

          const dateStr = row.created_at
            ? new Date(row.created_at).toLocaleString()
            : "-";

          return [
            `${index + 1}.`,
            row.type || "purchase",
            (row.transaction_id || "").replace(/^(PUR-|DMG-|GD-)/, ""),
            itemsDisplay,
            row.total_amount || 0,
            row.amount_received || 0,
            row.change || 0,
            dateStr,
          ];
        }),
      });

      grid.render(purchasesGridRef.current);
    }
  }, [purchaseTransactions, activeTab, loading]);

  // Render Item Returns Grid
  useEffect(() => {
    if (
      activeTab === "item_returns" &&
      returnsGridRef.current &&
      damagedItems.length > 0 &&
      !loading
    ) {
      returnsGridRef.current.innerHTML = "";

      const grid = new Grid({
        columns: [
          { name: "#", width: "50px" },
          {
            name: "Type",
            width: "120px",
            formatter: (cell) => {
              if (String(cell) === "good_item") {
                return html(
                  `<span class="type-badge-good-item">Good Item</span>`,
                );
              }
              return html(
                `<span class="type-badge-damage">Damage Return</span>`,
              );
            },
          },
          {
            name: "Receipt No.",
            width: "120px",
          },
          {
            name: "Item",
            width: "150px",
          },
          {
            name: "Qty",
            width: "60px",
          },
          {
            name: "Reason",
            width: "110px",
          },
          {
            name: "Amount Returned",
            width: "140px",
            formatter: (cell) => {
              const amount = Number(cell || 0);
              if (amount > 0) {
                return html(
                  `<span style="color: #16a34a; font-weight: 600;">₱${amount.toFixed(2)}</span>`,
                );
              }
              return html(`<span style="color: #9ca3af;">₱0.00</span>`);
            },
          },
          {
            name: "Processed By",
            width: "120px",
          },
          {
            name: "Date",
            width: "160px",
          },
        ],
        pagination: { limit: 10 },
        search: true,
        sort: true,
        data: damagedItems.map((row, index) => {
          const dateStr = row.created_at
            ? new Date(row.created_at).toLocaleString()
            : "-";

          return [
            `${index + 1}.`,
            String(row.return_type || "damaged_item"),
            String(row.invoice_no || "-"),
            String(row.item_name || "-"),
            Number(row.quantity_returned || 0),
            String(row.return_reason || "-"),
            Number(row.refund_amount || 0),
            String(row.processed_by || "-"),
            dateStr,
          ];
        }),
      });

      grid.render(returnsGridRef.current);
    }
  }, [damagedItems, activeTab, loading]);

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedTransaction(null);
    setSelectedDamagedItem(null);
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "12px 24px",
    cursor: "pointer",
    backgroundColor: isActive ? "#eff6ff" : "transparent",
    color: isActive ? "#3b82f6" : "#6b7280",
    fontWeight: isActive ? 600 : 500,
    fontSize: "14px",
    transition: "all 0.2s ease",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
    borderTop: isActive ? "none" : "none",
    borderLeft: isActive ? "none" : "none",
    borderRight: isActive ? "none" : "none",
    borderBottom: isActive ? "3px solid #3b82f6" : "3px solid transparent",
    marginRight: "4px",
    outline: "none",
    background: isActive ? "#eff6ff" : "transparent",
  });

  return (
    <>
      <Header onLogout={() => {}} />
      <Sidemenu onLogout={() => {}} />
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
                {/* Tabs */}
                <div
                  style={{
                    display: "flex",
                    borderBottomWidth: "1px",
                    borderBottomStyle: "solid",
                    borderBottomColor: "#e5e7eb",
                    paddingLeft: "20px",
                    paddingRight: "20px",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <button
                    type="button"
                    style={getTabStyle(activeTab === "purchases")}
                    onClick={() => setActiveTab("purchases")}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="8" cy="21" r="1"></circle>
                        <circle cx="19" cy="21" r="1"></circle>
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                      </svg>
                      Purchases
                      <span
                        style={{
                          backgroundColor:
                            activeTab === "purchases" ? "#3b82f6" : "#9ca3af",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {purchaseTransactions.length}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    style={getTabStyle(activeTab === "item_returns")}
                    onClick={() => setActiveTab("item_returns")}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                      </svg>
                      Item Returns
                      <span
                        style={{
                          backgroundColor:
                            activeTab === "item_returns"
                              ? "#3b82f6"
                              : "#9ca3af",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {damagedItems.length}
                      </span>
                    </span>
                  </button>
                </div>

                <div className="box-body p-5">
                  {loading ? (
                    <div className="text-center text-gray-500 py-8">
                      Loading...
                    </div>
                  ) : (
                    <>
                      {/* Purchases Tab Content */}
                      {activeTab === "purchases" && (
                        <div>
                          {purchaseTransactions.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                  margin: "0 auto 12px",
                                  color: "#d1d5db",
                                }}
                              >
                                <circle cx="8" cy="21" r="1"></circle>
                                <circle cx="19" cy="21" r="1"></circle>
                                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                              </svg>
                              <p>No purchase transactions found</p>
                            </div>
                          ) : (
                            <div ref={purchasesGridRef}></div>
                          )}
                        </div>
                      )}

                      {/* Item Returns Tab Content */}
                      {activeTab === "item_returns" && (
                        <div>
                          {damagedItems.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                  margin: "0 auto 12px",
                                  color: "#d1d5db",
                                }}
                              >
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                              </svg>
                              <p>No item returns found</p>
                            </div>
                          ) : (
                            <div ref={returnsGridRef}></div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal for Purchase Transaction */}
      {isViewModalOpen && selectedTransaction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "500px",
              maxWidth: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#1f2937",
                }}
              >
                Purchase Details
              </h2>
              <span
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Purchase
              </span>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <strong>Transaction ID:</strong>{" "}
                {selectedTransaction.transaction_id}
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {new Date(selectedTransaction.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Total Amount:</strong> ₱
                {selectedTransaction.total_amount.toFixed(2)}
              </div>
              <div>
                <strong>Amount Received:</strong> ₱
                {selectedTransaction.amount_received.toFixed(2)}
              </div>
              <div>
                <strong>Change:</strong> ₱
                {selectedTransaction.change.toFixed(2)}
              </div>
              <div>
                <h3 style={{ fontWeight: 600, marginTop: "8px" }}>Items:</h3>
                <ul style={{ marginTop: "8px" }}>
                  {selectedTransaction.items.map((item, index) => (
                    <li
                      key={index}
                      style={{ fontSize: "14px", marginBottom: "4px" }}
                    >
                      {item.name} - Quantity: {item.quantity}
                      {item.price &&
                        ` - Price: ₱${(item.price * item.quantity).toFixed(2)}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                style={{
                  backgroundColor: "#9ca3af",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={closeViewModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal for Item Return */}
      {isViewModalOpen && selectedDamagedItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "500px",
              maxWidth: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#1f2937",
                }}
              >
                Item Return Details
              </h2>
              <span
                style={{
                  backgroundColor:
                    selectedDamagedItem.return_type === "good_item"
                      ? "#3b82f6"
                      : "#ef4444",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {selectedDamagedItem.return_type === "good_item"
                  ? "Good Item"
                  : "Damage Return"}
              </span>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <strong>Receipt No.:</strong> {selectedDamagedItem.invoice_no}
              </div>
              <div>
                <strong>Item Name:</strong> {selectedDamagedItem.item_name}
              </div>
              <div>
                <strong>Quantity Returned:</strong>{" "}
                {selectedDamagedItem.quantity_returned}
              </div>
              <div>
                <strong>Item Price:</strong> ₱
                {Number(selectedDamagedItem.item_price || 0).toFixed(2)}
              </div>
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                }}
              >
                <strong style={{ color: "#16a34a" }}>Amount Returned:</strong>{" "}
                <span
                  style={{
                    color: "#16a34a",
                    fontWeight: 700,
                    fontSize: "18px",
                  }}
                >
                  ₱{Number(selectedDamagedItem.refund_amount || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <strong>Reason:</strong> {selectedDamagedItem.return_reason}
                {selectedDamagedItem.other_reason &&
                  ` - ${selectedDamagedItem.other_reason}`}
              </div>
              <div>
                <strong>Processed By:</strong>{" "}
                {selectedDamagedItem.processed_by}
              </div>
              <div>
                <strong>Return Date:</strong>{" "}
                {new Date(selectedDamagedItem.return_date).toLocaleDateString()}
              </div>
              <div>
                <strong>Created At:</strong>{" "}
                {new Date(selectedDamagedItem.created_at).toLocaleString()}
              </div>
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                style={{
                  backgroundColor: "#9ca3af",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
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
