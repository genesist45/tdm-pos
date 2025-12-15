import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, html } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import axios from "axios";
import { Plus } from "lucide-react";

interface DamagedItem {
  id: number;
  invoice_no: string;
  item_id: number | null;
  item_name: string;
  item_price: number | string | null;
  quantity_returned: number;
  return_type: string;
  return_reason: string;
  other_reason: string | null;
  return_date: string;
  processed_by: string;
  created_at: string;
  updated_at: string;
}

const ItemDamage_List: React.FC = () => {
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstance = useRef<Grid | null>(null);
  const [damagedItems, setDamagedItems] = useState<DamagedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DamagedItem | null>(null);

  // Modal states (View and Delete only - Add and Edit are now separate pages)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error",
  });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const fetchDamagedItems = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/damaged-items"
      );
      setDamagedItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching damaged items:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDamagedItems();
  }, []);

  useEffect(() => {
    if (gridRef.current && !loading && damagedItems.length > 0) {
      gridRef.current.innerHTML = "";

      gridInstance.current = new Grid({
        columns: [
          { name: "#", width: "50px" },
          { name: "Invoice No.", width: "120px" },
          { name: "Item Name", width: "150px" },
          { name: "Qty", width: "60px" },
          { name: "Reason", width: "100px" },
          { name: "Date", width: "100px" },
          { name: "Processed By", width: "120px" },
          {
            name: "Actions",
            width: "150px",
            formatter: (cell) => {
              const id = cell;
              return html(`
                    <div class="flex justify-center gap-2">
                        <button
                            class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-all duration-200"
                            onclick="window.viewDamagedItem(${id})"
                            title="View"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button
                            class="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded transition-all duration-200"
                            onclick="window.editDamagedItem(${id})"
                            title="Edit"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button
                            class="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-all duration-200"
                            onclick="window.deleteDamagedItem(${id})"
                            title="Delete"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                    </div>
                `);
            },
          },
        ],
        data: damagedItems.map((item, index) => [
          index + 1,
          item.invoice_no,
          item.item_name,
          item.quantity_returned,
          item.return_type === "good_item" ? "Good Item" : item.return_reason,
          new Date(item.return_date).toLocaleDateString(),
          item.processed_by,
          item.id,
        ]),
        search: true,
        pagination: { limit: 10 },
        sort: true,
        style: {
          table: { width: "100%" },
          th: { textAlign: "center" },
          td: { textAlign: "center" },
        },
      });

      gridInstance.current.render(gridRef.current);

      // Global functions for grid actions
      (window as any).viewDamagedItem = (id: number) => {
        const item = damagedItems.find((i) => i.id === id);
        if (item) {
          setSelectedItem(item);
          setIsViewModalOpen(true);
        }
      };

      (window as any).editDamagedItem = (id: number) => {
        navigate(`/item-damage/edit/${id}`);
      };

      (window as any).deleteDamagedItem = (id: number) => {
        const item = damagedItems.find((i) => i.id === id);
        if (item) {
          setSelectedItem(item);
          setIsDeleteModalOpen(true);
        }
      };
    }
  }, [damagedItems, loading, navigate]);

  const handleDeleteDamagedItem = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      await axios.delete(
        `http://localhost:8000/api/damaged-items/${selectedItem.id}`
      );
      showNotification("Item return deleted successfully!", "success");
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      fetchDamagedItems();
    } catch (error: any) {
      console.error("Error deleting item return:", error);
      showNotification(
        error.response?.data?.message || "Failed to delete record",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal styles
  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  };

  const modalContentStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "24px",
    width: "500px",
    maxWidth: "95%",
    maxHeight: "90vh",
    overflow: "auto",
  };

  return (
    <>
      <Header onLogout={() => { }} />
      <Sidemenu onLogout={() => { }} />
      <div className="main-content app-content">
        {/* Notification Toast */}
        {notification.show && (
          <div className="fixed top-4 right-4 z-[10001] animate-fade-in-down">
            <div
              className={`bg-white rounded-lg p-4 shadow-xl border-l-4 ${notification.type === "success" ? "border-green-500" : "border-red-500"} flex items-center gap-3`}
            >
              <div
                className={`p-2 rounded-full ${notification.type === "success" ? "bg-green-100" : "bg-red-100"}`}
              >
                {notification.type === "success" ? (
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                )}
              </div>
              <p
                className={`font-medium ${notification.type === "success" ? "text-green-800" : "text-red-800"}`}
              >
                {notification.message}
              </p>
            </div>
          </div>
        )}

        <div className="container-fluid">
          <Breadcrumb
            title="Item Return"
            links={[{ text: "Dashboard", link: "/dashboard" }]}
            active="Item Return"
            buttons={
              <button
                onClick={() => navigate("/item-damage/add")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Plus size={16} /> Add Item Return
              </button>
            }
          />
          <div className="grid grid-cols-12 gap-x-6">
            <div className="xxl:col-span-12 col-span-12">
              <div className="box overflow-hidden main-content-card">
                {loading ? (
                  <div className="p-5 text-center">Loading...</div>
                ) : damagedItems.length === 0 ? (
                  <div className="p-5 text-center text-gray-500">
                    No damaged item records found
                  </div>
                ) : (
                  <div ref={gridRef} className="box-body p-5" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedItem && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#1f2937",
                }}
              >
                Item Return Details
              </h2>

            </div>
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <strong>Invoice No:</strong> {selectedItem.invoice_no}
              </div>
              <div>
                <strong>Item Name:</strong> {selectedItem.item_name}
              </div>
              <div>
                <strong>Quantity Returned:</strong>{" "}
                {selectedItem.quantity_returned}
              </div>
              {selectedItem.item_price !== null && (
                <div>
                  <strong>Item Price:</strong> ₱
                  {Number(selectedItem.item_price).toFixed(2)}
                </div>
              )}
              {selectedItem.item_price !== null && (
                <div>
                  <strong>Total Value:</strong> ₱
                  {(
                    Number(selectedItem.item_price) * selectedItem.quantity_returned
                  ).toFixed(2)}
                </div>
              )}
              <div>
                <strong>Return Type:</strong>{" "}
                {selectedItem.return_type === "good_item"
                  ? "Good Item"
                  : "Damaged Item"}
              </div>
              <div>
                <strong>Reason:</strong> {selectedItem.return_reason}
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {new Date(selectedItem.return_date).toLocaleDateString()}
              </div>
              <div>
                <strong>Processed By:</strong> {selectedItem.processed_by}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedItem(null);
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6b7280",
                  color: "white",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, width: "400px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
                marginBottom: "16px",
              }}
            >
              Confirm Delete
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "20px" }}>
              Are you sure you want to delete the return record for "
              {selectedItem.item_name}"?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedItem(null);
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#d1d5db",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDamagedItem}
                disabled={isSubmitting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  borderRadius: "6px",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemDamage_List;
