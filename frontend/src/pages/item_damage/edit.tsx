import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import axios from "axios";
import { ChevronUp, ChevronDown } from "lucide-react";

interface DamagedItem {
    id: number;
    invoice_no: string;
    item_id: number | null;
    item_name: string;
    item_price: number | null;
    quantity_returned: number;
    return_type: string;
    return_reason: string;
    other_reason: string | null;
    return_date: string;
    processed_by: string;
}

interface PurchaseItem {
    id: number;
    name: string;
    quantity: number;
    price: number;
    image: string | null;
}

interface SelectedCartItem extends PurchaseItem {
    selectedQty: number;
}

// Reasons for Damaged Item condition
const damagedItemReasons = ["Damaged", "Expired", "Wrong Item", "Defective"];
// Reasons for Good Item condition
const goodItemReasons = ["Good Item", "Change Item"];
const conditionOptions = ["Damaged Item", "Good Item"];

const ItemDamage_Edit: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [originalItem, setOriginalItem] = useState<DamagedItem | null>(null);
    const [loading, setLoading] = useState(true);

    // Workflow states
    const [condition, setCondition] = useState("Damaged Item");
    const [receiptNo, setReceiptNo] = useState("");
    const [receiptError, setReceiptError] = useState("");
    const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<SelectedCartItem[]>([]);

    // Form states
    const [formData, setFormData] = useState({
        invoice_no: "",
        item_name: "",
        quantity_returned: 1,
        return_reason: "Damaged",
        other_reason: "",
        return_date: new Date().toISOString().split("T")[0],
        processed_by: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>("");

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
            if (type === "success") {
                navigate("/item-damage");
            }
        }, 2000);
    };

    // Fetch the original item data
    useEffect(() => {
        const fetchItem = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:8000/api/damaged-items/${id}`
                );
                const item = response.data;
                setOriginalItem(item);

                // Set condition based on return_type
                const itemCondition =
                    item.return_type === "good_item" ? "Good Item" : "Damaged Item";
                setCondition(itemCondition);

                // Pre-fill form data
                setFormData({
                    invoice_no: "",
                    item_name: "",
                    quantity_returned: 1,
                    return_reason: item.return_reason,
                    other_reason: item.other_reason || "",
                    return_date: item.return_date.split("T")[0],
                    processed_by: item.processed_by,
                });

                setLoading(false);
            } catch (error) {
                console.error("Error fetching item:", error);
                setError("Failed to load item data");
                setLoading(false);
            }
        };

        if (id) {
            fetchItem();
        }
    }, [id]);

    // Fetch purchase by receipt number
    const handleReceiptLookup = async () => {
        if (!receiptNo.trim()) {
            setReceiptError("Please enter a receipt number");
            return;
        }

        setIsLoadingReceipt(true);
        setReceiptError("");
        setPurchaseItems([]);
        setSelectedItems([]);

        try {
            const response = await axios.get(
                `http://localhost:8000/api/purchase-history/receipt/${receiptNo.trim()}`
            );

            const purchaseItemsData: PurchaseItem[] = response.data.items || [];

            // Fetch all damaged items to check what has already been returned for this receipt
            const damagedResponse = await axios.get(
                "http://localhost:8000/api/damaged-items"
            );
            const allDamagedItems = damagedResponse.data || [];

            // Filter damaged items that match this receipt number (exclude current item being edited)
            const returnedFromThisReceipt = allDamagedItems.filter(
                (item: any) =>
                    item.invoice_no === response.data.receipt_no &&
                    item.id !== parseInt(id || "0")
            );

            // Calculate total returned quantity for each item name
            const returnedQuantities: { [itemName: string]: number } = {};
            returnedFromThisReceipt.forEach((item: any) => {
                const itemName = item.item_name;
                if (!returnedQuantities[itemName]) {
                    returnedQuantities[itemName] = 0;
                }
                returnedQuantities[itemName] += item.quantity_returned;
            });

            // Adjust available quantities based on what has been returned
            const adjustedItems: PurchaseItem[] = purchaseItemsData.map((item) => {
                const alreadyReturned = returnedQuantities[item.name] || 0;
                const remainingQty = Math.max(0, item.quantity - alreadyReturned);
                return {
                    ...item,
                    quantity: remainingQty,
                };
            });

            // Filter out items with 0 remaining quantity
            const availableItems = adjustedItems.filter((item) => item.quantity > 0);

            if (availableItems.length === 0) {
                setReceiptError(
                    "All items from this receipt have already been returned. No items available for return."
                );
                setPurchaseItems([]);
            } else {
                setPurchaseItems(availableItems);
                setFormData((prev) => ({
                    ...prev,
                    invoice_no: response.data.receipt_no,
                }));
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setReceiptError(
                    "Receipt not found. Please enter a valid Purchase receipt number."
                );
            } else {
                setReceiptError("Error looking up receipt. Please try again.");
            }
        } finally {
            setIsLoadingReceipt(false);
        }
    };

    // Handle checkbox selection
    const handleItemSelect = (item: PurchaseItem, isChecked: boolean) => {
        if (isChecked) {
            setSelectedItems((prev) => [...prev, { ...item, selectedQty: 1 }]);
        } else {
            setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
        }
    };

    // Handle quantity change for selected items
    const handleQtyChange = (itemId: number, delta: number) => {
        setSelectedItems((prev) =>
            prev.map((item) => {
                if (item.id === itemId) {
                    const newQty = Math.max(
                        1,
                        Math.min(item.quantity, item.selectedQty + delta)
                    );
                    return { ...item, selectedQty: newQty };
                }
                return item;
            })
        );
    };

    // Calculate totals
    const calculateTotals = () => {
        const itemsTotal = selectedItems.reduce(
            (sum, item) => sum + item.price * item.selectedQty,
            0
        );
        return { itemsTotal };
    };

    const validateForm = (): boolean => {
        setError("");

        if (selectedItems.length === 0) {
            setError("Please select at least one item");
            return false;
        }
        if (!formData.return_reason) {
            setError("Reason for return is required");
            return false;
        }
        if (!formData.return_date) {
            setError("Date is required");
            return false;
        }
        if (!formData.processed_by.trim()) {
            setError("Staff who processed is required");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !originalItem) return;

        setIsSubmitting(true);
        setError("");

        try {
            // Delete the original record first
            await axios.delete(`http://localhost:8000/api/damaged-items/${originalItem.id}`);

            // Create new records for each selected item
            for (const item of selectedItems) {
                await axios.post("http://localhost:8000/api/damaged-items", {
                    invoice_no: formData.invoice_no,
                    item_id: item.id,
                    item_name: item.name,
                    quantity_returned: item.selectedQty,
                    item_price: item.price,
                    return_type:
                        condition === "Good Item" ? "good_item" : "damaged_item",
                    return_reason: formData.return_reason,
                    other_reason: formData.other_reason,
                    return_date: formData.return_date,
                    processed_by: formData.processed_by,
                });
            }

            showNotification("Item return updated successfully!", "success");
        } catch (error: any) {
            console.error("Error updating item return:", error);
            setError(error.response?.data?.message || "Failed to update record");
        } finally {
            setIsSubmitting(false);
        }
    };

    const { itemsTotal } = calculateTotals();

    // Inline styles
    const containerStyle: React.CSSProperties = {
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    };

    const labelStyle: React.CSSProperties = {
        display: "block",
        marginBottom: "4px",
        fontWeight: "500",
        fontSize: "14px",
        color: "#374151",
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "14px",
    };

    if (loading) {
        return (
            <>
                <Header onLogout={() => { }} />
                <Sidemenu onLogout={() => { }} />
                <div className="main-content app-content">
                    <div className="container-fluid">
                        <div style={{ padding: "40px", textAlign: "center" }}>
                            Loading...
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header onLogout={() => { }} />
            <Sidemenu onLogout={() => { }} />
            <div className="main-content app-content">
                {/* Notification */}
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
                        title="Edit Item Return"
                        links={[
                            { text: "Dashboard", link: "/dashboard" },
                            { text: "Item Return", link: "/item-damage" },
                        ]}
                        active="Edit"
                    />

                    <div style={containerStyle}>
                        {/* Original Item Info */}
                        {originalItem && (
                            <div
                                style={{
                                    backgroundColor: "#f0f9ff",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    marginBottom: "16px",
                                    border: "1px solid #bae6fd",
                                }}
                            >
                                <p style={{ fontSize: "14px", color: "#0369a1" }}>
                                    <strong>Original Record:</strong> {originalItem.item_name} -
                                    Invoice: {originalItem.invoice_no} - Qty:{" "}
                                    {originalItem.quantity_returned}
                                </p>
                                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                                    Please enter a new receipt number to select replacement items.
                                </p>
                            </div>
                        )}

                        {error && (
                            <div
                                style={{
                                    backgroundColor: "#fee2e2",
                                    color: "#dc2626",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    marginBottom: "16px",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: "16px",
                                }}
                            >
                                {/* Condition Selection */}
                                <div>
                                    <label style={labelStyle}>Condition *</label>
                                    <select
                                        value={condition}
                                        onChange={(e) => {
                                            setCondition(e.target.value);
                                            setPurchaseItems([]);
                                            setSelectedItems([]);
                                            setReceiptNo("");
                                            setReceiptError("");
                                            if (e.target.value === "Good Item") {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    return_reason: "Good Item",
                                                }));
                                            } else {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    return_reason: "Damaged",
                                                }));
                                            }
                                        }}
                                        style={inputStyle}
                                    >
                                        {conditionOptions.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Receipt Number Lookup */}
                                <div style={{ gridColumn: "span 2" }}>
                                    <label style={labelStyle}>Receipt No. *</label>
                                    <div
                                        style={{ display: "flex", gap: "8px", alignItems: "center" }}
                                    >
                                        <input
                                            type="text"
                                            value={receiptNo}
                                            onChange={(e) => setReceiptNo(e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: "8px 12px",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "6px",
                                                fontSize: "14px",
                                                minWidth: 0,
                                            }}
                                            placeholder="Enter receipt number"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleReceiptLookup}
                                            disabled={isLoadingReceipt}
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#3b82f6",
                                                color: "white",
                                                borderRadius: "6px",
                                                border: "none",
                                                cursor: isLoadingReceipt ? "not-allowed" : "pointer",
                                                whiteSpace: "nowrap",
                                                fontWeight: "500",
                                                fontSize: "14px",
                                                width: "auto",
                                                flex: "none",
                                            }}
                                        >
                                            {isLoadingReceipt ? "Loading..." : "Lookup"}
                                        </button>
                                    </div>
                                    {receiptError && (
                                        <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                                            {receiptError}
                                        </p>
                                    )}
                                </div>

                                {/* Items Checkbox List */}
                                {purchaseItems.length > 0 && (
                                    <div
                                        style={{
                                            gridColumn: "span 3",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                            padding: "12px",
                                            backgroundColor: "#fafafa",
                                        }}
                                    >
                                        <label style={{ ...labelStyle, marginBottom: "8px" }}>
                                            Select Items to Return:
                                        </label>
                                        <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                                            Showing only items available for return (quantities already
                                            returned have been deducted)
                                        </p>
                                        {purchaseItems.map((item) => {
                                            const isSelected = selectedItems.some((s) => s.id === item.id);
                                            return (
                                                <div
                                                    key={item.id}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        padding: "8px",
                                                        borderBottom: "1px solid #f3f4f6",
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={() => handleItemSelect(item, !isSelected)}
                                                >
                                                    {/* Custom Checkbox */}
                                                    <div
                                                        style={{
                                                            width: "22px",
                                                            height: "22px",
                                                            minWidth: "22px",
                                                            marginRight: "12px",
                                                            border: "2px solid #374151",
                                                            borderRadius: "4px",
                                                            backgroundColor: isSelected ? "#3b82f6" : "#ffffff",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            cursor: "pointer",
                                                            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
                                                        }}
                                                    >
                                                        {isSelected && (
                                                            <svg
                                                                style={{ width: "14px", height: "14px", color: "#ffffff" }}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={3}
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    {item.image && (
                                                        <img
                                                            src={`http://localhost:8000${item.image}`}
                                                            alt={item.name}
                                                            style={{
                                                                width: "40px",
                                                                height: "40px",
                                                                objectFit: "cover",
                                                                borderRadius: "4px",
                                                                marginRight: "12px",
                                                            }}
                                                        />
                                                    )}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: "500" }}>{item.name}</div>
                                                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                                            Price: ₱{item.price.toFixed(2)} | Available: {item.quantity}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Selected Items Cards */}
                                {selectedItems.length > 0 && (
                                    <div style={{ gridColumn: "span 3" }}>
                                        <label style={{ ...labelStyle, marginBottom: "8px" }}>
                                            Selected Items:
                                        </label>
                                        {selectedItems.map((item) => (
                                            <div
                                                key={item.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    padding: "12px",
                                                    backgroundColor: "#f9fafb",
                                                    borderRadius: "8px",
                                                    marginBottom: "8px",
                                                }}
                                            >
                                                {item.image && (
                                                    <img
                                                        src={`http://localhost:8000${item.image}`}
                                                        alt={item.name}
                                                        style={{
                                                            width: "50px",
                                                            height: "50px",
                                                            objectFit: "cover",
                                                            borderRadius: "4px",
                                                            marginRight: "12px",
                                                        }}
                                                    />
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: "500" }}>{item.name}</div>
                                                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                                        ₱{item.price.toFixed(2)} x {item.selectedQty} = ₱
                                                        {(item.price * item.selectedQty).toFixed(2)}
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQtyChange(item.id, -1)}
                                                        disabled={item.selectedQty <= 1}
                                                        style={{
                                                            padding: "4px",
                                                            backgroundColor: "#e5e7eb",
                                                            borderRadius: "4px",
                                                            border: "none",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        <ChevronDown size={16} />
                                                    </button>
                                                    <span style={{ padding: "0 8px", fontWeight: "500" }}>
                                                        {item.selectedQty}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQtyChange(item.id, 1)}
                                                        disabled={item.selectedQty >= item.quantity}
                                                        style={{
                                                            padding: "4px",
                                                            backgroundColor: "#e5e7eb",
                                                            borderRadius: "4px",
                                                            border: "none",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        <ChevronUp size={16} />
                                                    </button>
                                                    <span
                                                        style={{
                                                            fontSize: "11px",
                                                            color: "#9ca3af",
                                                            marginLeft: "4px",
                                                        }}
                                                    >
                                                        / {item.quantity}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Totals */}
                                        <div
                                            style={{
                                                backgroundColor:
                                                    condition === "Good Item" ? "#eff6ff" : "#f0fdf4",
                                                padding: "12px",
                                                borderRadius: "8px",
                                                marginTop: "12px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                <span>Items Total:</span>
                                                <span>₱{itemsTotal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Reason for Return */}
                                <div>
                                    <label style={labelStyle}>Reason for Return *</label>
                                    <select
                                        value={formData.return_reason}
                                        onChange={(e) =>
                                            setFormData({ ...formData, return_reason: e.target.value })
                                        }
                                        style={inputStyle}
                                    >
                                        {(condition === "Good Item"
                                            ? goodItemReasons
                                            : damagedItemReasons
                                        ).map((reason) => (
                                            <option key={reason} value={reason}>
                                                {reason}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date */}
                                <div>
                                    <label style={labelStyle}>Date *</label>
                                    <input
                                        type="date"
                                        value={formData.return_date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, return_date: e.target.value })
                                        }
                                        style={inputStyle}
                                    />
                                </div>

                                {/* Staff */}
                                <div>
                                    <label style={labelStyle}>Staff Processed By *</label>
                                    <input
                                        type="text"
                                        value={formData.processed_by}
                                        onChange={(e) =>
                                            setFormData({ ...formData, processed_by: e.target.value })
                                        }
                                        style={inputStyle}
                                        placeholder="Enter staff name"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "12px",
                                    marginTop: "24px",
                                    paddingTop: "16px",
                                    borderTop: "1px solid #e5e7eb",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => navigate("/item-damage")}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: "#6b7280",
                                        color: "white",
                                        borderRadius: "6px",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: "500",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        padding: "10px 20px",
                                        backgroundColor: "#eab308",
                                        color: "white",
                                        borderRadius: "6px",
                                        border: "none",
                                        cursor: isSubmitting ? "not-allowed" : "pointer",
                                        opacity: isSubmitting ? 0.5 : 1,
                                        fontWeight: "500",
                                    }}
                                >
                                    {isSubmitting ? "Processing..." : "Update Record"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ItemDamage_Edit;
