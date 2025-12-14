import React, { useEffect, useRef, useState } from "react";
import { Grid, html } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import { Link } from "react-router-dom";
import axios from "axios";
import { Trash2, X } from "lucide-react";

interface InventoryItem {
    id: number;
    product_name: string;
    category: string;
    quantity: number;
    price: number;
    supplier: any;
    supplier_id: number;
    stock_status: string;
    description: string;
    image_path: string;
}

interface Category {
    id: number;
    name: string;
    description: string | null;
    image_path: string | null;
}

const InventoryList: React.FC = () => {
    const gridRef = useRef<HTMLDivElement>(null);
    const gridInstance = useRef<Grid | null>(null);
    const observerRef = useRef<MutationObserver | null>(null);
    const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [editForm, setEditForm] = useState({
        quantity: 0,
        price: 0,
        category: ''
    });
    const [errors, setErrors] = useState({
        quantity: '',
        price: ''
    });
    const [notification, setNotification] = useState({
        show: false,
        message: '',
        type: 'success' // 'success' or 'error'
    });

    // Function to show notification
    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({
            show: true,
            message,
            type
        });
        // Hide notification after 2 seconds
        setTimeout(() => {
            setNotification({
                show: false,
                message: '',
                type: 'success'
            });
        }, 2000);
    };

    const validateForm = () => {
        const newErrors = {
            quantity: '',
            price: ''
        };
        let isValid = true;

        // Quantity validation
        if (editForm.quantity < 0) {
            newErrors.quantity = 'Quantity cannot be negative';
            isValid = false;
        }

        // Price validation
        if (editForm.price <= 0) {
            newErrors.price = 'Price must be greater than 0';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleUpdate = async () => {
        if (!selectedItem) return;

        if (!validateForm()) {
            return;
        }

        try {
            const updateData = {
                ...selectedItem,
                quantity: editForm.quantity,
                price: editForm.price,
                category: editForm.category
            };

            const response = await axios.patch(
                `http://localhost:8000/api/inventory/${selectedItem.id}`,
                updateData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                // Refresh the inventory list
                const inventoryResponse = await axios.get('http://localhost:8000/api/inventory');
                const inventoryData = inventoryResponse.data.map((item: InventoryItem) => [
                    item.id,
                    item.product_name,
                    item.category,
                    item.quantity,
                    item.price,
                    item.image_path ? `http://localhost:8000${item.image_path}` : null
                ]);

                if (gridInstance.current) {
                    gridInstance.current.updateConfig({
                        data: inventoryData.map((item: any[], index: number) => [item[0], ...item.slice(1)]),
                    }).forceRender();
                }

                setIsModalOpen(false);
                setErrors({ quantity: '', price: '' });
                showNotification('Inventory item updated successfully', 'success');
            }
        } catch (error: any) {
            console.error('Error updating inventory item:', error);
            if (error.response?.status === 422) {
                const serverErrors = error.response.data.errors || {};
                setErrors({
                    quantity: serverErrors.quantity?.[0] || '',
                    price: serverErrors.price?.[0] || ''
                });
                showNotification('Please check the form for errors', 'error');
            } else {
                showNotification('Failed to update inventory item', 'error');
            }
        }
    };

    const openEditModal = (item: InventoryItem) => {
        setSelectedItem(item);
        setEditForm({
            quantity: item.quantity,
            price: item.price,
            category: item.category
        });
        setErrors({ quantity: '', price: '' });
        setIsModalOpen(true);
    };

    const openViewModal = async (id: number) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/inventory/${id}`);
            setSelectedItem(response.data);
            setIsViewModalOpen(true);
        } catch (error) {
            console.error('Error fetching inventory item:', error);
            showNotification('Failed to fetch inventory details', 'error');
        }
    };

    const openDeleteModal = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedItem) return;

        setDeleteLoading(true);
        try {
            await axios.delete(`http://localhost:8000/api/inventory/${selectedItem.id}`);

            // Update local state
            const updatedData = inventoryData.filter(item => item.id !== selectedItem.id);
            setInventoryData(updatedData);

            // Refresh grid
            refreshGrid(updatedData);

            setIsDeleteModalOpen(false);
            setSelectedItem(null);
            showNotification('Inventory item deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            showNotification('Failed to delete inventory item', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    const refreshGrid = (data: InventoryItem[]) => {
        const gridData = data.map((item: InventoryItem) => [
            item.id,
            item.product_name,
            item.category,
            item.quantity,
            item.price,
            item.image_path ? `http://localhost:8000${item.image_path}` : null
        ]);

        if (gridInstance.current) {
            gridInstance.current.updateConfig({
                data: gridData,
            }).forceRender();
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/categories');
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/inventory');
                const gridFormattedData = response.data.map((item: InventoryItem) => [
                    item.id,
                    item.product_name,
                    item.category,
                    item.quantity,
                    item.price,
                    item.image_path ? `http://localhost:8000${item.image_path}` : null
                ]);

                if (gridRef.current) {
                    gridRef.current.innerHTML = "";

                    gridInstance.current = new Grid({
                        columns: [
                            { name: "#", width: "10px" },
                            { name: "Part Name", width: "100px" },
                            { name: "Category", width: "100px" },
                            {
                                name: "Quantity",
                                width: "60px",
                                formatter: (cell: any) => {
                                    const quantity = Number(cell);
                                    return html(`
                                        <div style="color: ${quantity === 0 ? '#dc2626' : 'inherit'}; font-weight: ${quantity === 0 ? 'bold' : 'normal'}">
                                            ${quantity}
                                        </div>
                                    `);
                                }
                            },
                            { name: "Price", width: "70px" },
                            {
                                name: "Image",
                                width: "100px",
                                formatter: (cell) =>
                                    cell ? html(
                                        `<img src="${cell}" alt="Motor Part" style="width: 150px; height: 150px; object-fit: cover; border-radius: 5px;" />`
                                    ) : html('<div class="w-20 h-20 bg-gray-200"></div>'),
                            },
                            {
                                name: "Actions",
                                width: "120px",
                                formatter: (_, row) =>
                                    html(`
                                        <div class="flex justify-center gap-2">
                                            <button 
                                                class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-all duration-200 flex items-center justify-center"
                                                onclick="window.openViewModal(${row.cells[0].data})"
                                                title="View Details"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            </button>
                                            <button 
                                                class="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded transition-all duration-200 flex items-center justify-center"
                                                onclick="window.openEditModal(${row.cells[0].data})"
                                                title="Edit Item"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                                    <path d="m15 5 4 4"></path>
                                                </svg>
                                            </button>
                                            <button 
                                                class="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-all duration-200 flex items-center justify-center"
                                                onclick="window.openDeleteModal(${row.cells[0].data})"
                                                title="Delete Item"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M3 6h18"></path>
                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                    <line x1="10" x2="10" y1="11" y2="17"></line>
                                                    <line x1="14" x2="14" y1="11" y2="17"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    `),
                            },
                        ],
                        pagination: { limit: 10 },
                        search: true,
                        sort: true,
                        data: gridFormattedData,
                    }).render(gridRef.current);

                    // Store inventory data for modal operations
                    setInventoryData(response.data);

                    // Add global functions for the grid to use
                    (window as any).openEditModal = (id: number) => {
                        const item = response.data.find((i: InventoryItem) => i.id === id);
                        if (item) {
                            openEditModal(item);
                        }
                    };

                    (window as any).openViewModal = (id: number) => {
                        openViewModal(id);
                    };

                    (window as any).openDeleteModal = (id: number) => {
                        const item = response.data.find((i: InventoryItem) => i.id === id);
                        if (item) {
                            openDeleteModal(item);
                        }
                    };

                    // Set up MutationObserver
                    const tableBody = gridRef.current.querySelector("tbody");
                    if (tableBody) {
                        observerRef.current = new MutationObserver(() => {
                            scrollToTop();
                        });
                        observerRef.current.observe(tableBody, { childList: true, subtree: true });
                    }
                }
                setLoading(false);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to fetch inventory data");
                setLoading(false);
            }
        };

        fetchInventory();

        return () => {
            if (gridInstance.current) gridInstance.current.destroy();
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, []);

    return (
        <>
            <Header onLogout={() => { }} />
            <Sidemenu onLogout={() => { }} />
            <div className="main-content app-content">
                {/* Success/Error Popup Modal */}
                {notification.show && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
                        <div className={`bg-white rounded-lg p-6 shadow-xl transform transition-all duration-300 ${notification.type === 'success' ? 'border-2 border-green-500' : 'border-2 border-red-500'
                            }`}>
                            <div className="flex items-center justify-center mb-4">
                                {notification.type === 'success' ? (
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <p className={`text-center text-lg font-medium ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {notification.message}
                            </p>
                        </div>
                    </div>
                )}

                <div className="container-fluid">
                    <Breadcrumb
                        title="Inventory List"
                        links={[{ text: "Dashboard", link: "/dashboard" }]}
                        active="Inventory List"
                        buttons={
                            <Link
                                to="/inventory/create"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                            >
                                <i className="ri-add-line"></i> Add Inventory Item
                            </Link>
                        }
                    />
                    <div className="grid grid-cols-12 gap-x-6">
                        <div className="xxl:col-span-12 col-span-12">
                            <div className="box overflow-hidden main-content-card">
                                {loading ? (
                                    <div className="p-5 text-center">Loading...</div>
                                ) : error ? (
                                    <div className="p-5 text-center text-red-500">{error}</div>
                                ) : (
                                    <div ref={gridRef} className="box-body p-5" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && selectedItem && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        padding: '32px',
                        width: '500px',
                        maxWidth: '90vw',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>Edit Inventory Item</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Product Name</label>
                                <input
                                    type="text"
                                    value={selectedItem.product_name}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        backgroundColor: '#f3f4f6',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Quantity</label>
                                <input
                                    type="number"
                                    value={editForm.quantity}
                                    onChange={(e) => {
                                        setEditForm({ ...editForm, quantity: parseInt(e.target.value) });
                                        setErrors({ ...errors, quantity: '' });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: errors.quantity ? '1px solid #ef4444' : '1px solid #d1d5db',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                {errors.quantity && (
                                    <p style={{ marginTop: '4px', fontSize: '14px', color: '#dc2626' }}>{errors.quantity}</p>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Price</label>
                                <input
                                    type="number"
                                    value={editForm.price}
                                    onChange={(e) => {
                                        setEditForm({ ...editForm, price: parseFloat(e.target.value) });
                                        setErrors({ ...errors, price: '' });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: errors.price ? '1px solid #ef4444' : '1px solid #d1d5db',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                {errors.price && (
                                    <p style={{ marginTop: '4px', fontSize: '14px', color: '#dc2626' }}>{errors.price}</p>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Category</label>
                                <select
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px',
                                        boxSizing: 'border-box' as const,
                                        backgroundColor: '#ffffff'
                                    }}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                            <button
                                onClick={handleUpdate}
                                style={{
                                    backgroundColor: '#3b82f6',
                                    color: '#ffffff',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    border: 'none',
                                    cursor: 'pointer',
                                    width: '100px'
                                }}
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setErrors({ quantity: '', price: '' });
                                }}
                                style={{
                                    backgroundColor: '#6b7280',
                                    color: '#ffffff',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    border: 'none',
                                    cursor: 'pointer',
                                    width: '100px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {isViewModalOpen && selectedItem && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        padding: '32px',
                        width: '800px',
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        {/* Modal Header with Close Button */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '24px'
                        }}>
                            <div style={{ width: '32px' }}></div> {/* Spacer for centering */}

                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                                Inventory Item Details
                            </h2>

                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: '#9ca3af',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s',
                                    width: '32px',
                                    height: '32px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = '#4b5563'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Product Image */}
                        {selectedItem.image_path && (
                            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                                <img
                                    src={`http://localhost:8000${selectedItem.image_path}`}
                                    alt={selectedItem.product_name}
                                    style={{
                                        width: '200px',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        border: '1px solid #e5e7eb'
                                    }}
                                />
                            </div>
                        )}

                        {/* Details Grid */}
                        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '24px' }}>
                            {/* Row 1: Product Name & Category */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Product Name</label>
                                    <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{selectedItem.product_name}</p>
                                </div>
                                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Category</label>
                                    <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{selectedItem.category}</p>
                                </div>
                            </div>

                            {/* Row 2: Quantity & Price */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Quantity</label>
                                    <p style={{
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        margin: 0,
                                        color: selectedItem.quantity === 0 ? '#dc2626' : selectedItem.quantity < 5 ? '#d97706' : '#16a34a'
                                    }}>
                                        {selectedItem.quantity} units
                                    </p>
                                </div>
                                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Price</label>
                                    <p style={{ fontSize: '18px', fontWeight: '600', color: '#2563eb', margin: 0 }}>₱{Number(selectedItem.price).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Row 3: Stock Status & Supplier */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: selectedItem.description ? '20px' : '0' }}>
                                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>Stock Status</label>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        backgroundColor: selectedItem.stock_status === 'In Stock' ? '#dcfce7' :
                                            selectedItem.stock_status === 'Low Stock' ? '#fef3c7' : '#fee2e2',
                                        color: selectedItem.stock_status === 'In Stock' ? '#166534' :
                                            selectedItem.stock_status === 'Low Stock' ? '#92400e' : '#991b1b'
                                    }}>
                                        {selectedItem.stock_status}
                                    </span>
                                </div>
                                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Supplier</label>
                                    <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                                        {selectedItem.supplier?.company_name || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedItem.description && (
                                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Description</label>
                                    <p style={{ fontSize: '16px', color: '#374151', margin: 0 }}>{selectedItem.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Close Button */}
                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                style={{
                                    backgroundColor: '#3b82f6',
                                    color: '#ffffff',
                                    padding: '12px 40px',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedItem && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        padding: '32px',
                        width: '450px',
                        maxWidth: '90vw',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                backgroundColor: '#fee2e2',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Trash2 style={{ width: '32px', height: '32px', color: '#dc2626' }} />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', color: '#1f2937', marginBottom: '8px' }}>
                            Delete Inventory Item
                        </h2>
                        <p style={{ color: '#4b5563', textAlign: 'center', marginBottom: '24px' }}>
                            Are you sure you want to delete <span style={{ fontWeight: '600' }}>"{selectedItem.product_name}"</span>? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                            <button
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                style={{
                                    backgroundColor: deleteLoading ? '#fca5a5' : '#ef4444',
                                    color: '#ffffff',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    border: 'none',
                                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setSelectedItem(null);
                                }}
                                disabled={deleteLoading}
                                style={{
                                    backgroundColor: deleteLoading ? '#d1d5db' : '#6b7280',
                                    color: '#ffffff',
                                    padding: '10px 24px',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    border: 'none',
                                    cursor: deleteLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InventoryList;
