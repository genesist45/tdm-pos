import React, { useEffect, useRef, useState } from "react";
import { Grid, html } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import axios from "axios";
import { Trash2, X, Plus } from "lucide-react";

interface DamagedItem {
    id: number;
    invoice_no: string;
    item_name: string;
    quantity_returned: number;
    return_reason: string;
    other_reason: string | null;
    return_date: string;
    processed_by: string;
    created_at: string;
    updated_at: string;
}

const returnReasons = ['Damaged', 'Expired', 'Wrong Item', 'Defective', 'Other'];

const ItemDamage_List: React.FC = () => {
    const gridRef = useRef<HTMLDivElement>(null);
    const gridInstance = useRef<Grid | null>(null);
    const [damagedItems, setDamagedItems] = useState<DamagedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<DamagedItem | null>(null);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        invoice_no: '',
        item_name: '',
        quantity_returned: 1,
        return_reason: 'Damaged',
        other_reason: '',
        return_date: new Date().toISOString().split('T')[0],
        processed_by: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');

    // Notification state
    const [notification, setNotification] = useState({
        show: false,
        message: '',
        type: 'success' as 'success' | 'error'
    });

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    const fetchDamagedItems = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/damaged-items');
            setDamagedItems(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching damaged items:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDamagedItems();
    }, []);

    useEffect(() => {
        if (gridRef.current && !loading) {
            gridRef.current.innerHTML = '';

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
                        formatter: (_, row) =>
                            html(`
                                <div class="flex justify-center gap-2">
                                    <button 
                                        class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-all duration-200"
                                        onclick="window.viewDamagedItem(${row.cells[0].data})"
                                        title="View"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    </button>
                                    <button 
                                        class="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded transition-all duration-200"
                                        onclick="window.editDamagedItem(${row.cells[0].data})"
                                        title="Edit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                                    </button>
                                    <button 
                                        class="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-all duration-200"
                                        onclick="window.deleteDamagedItem(${row.cells[0].data})"
                                        title="Delete"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            `),
                    },
                ],
                pagination: { limit: 10 },
                search: true,
                sort: true,
                data: damagedItems.map((item) => [
                    item.id,
                    item.invoice_no,
                    item.item_name,
                    item.quantity_returned,
                    item.return_reason,
                    new Date(item.return_date).toLocaleDateString(),
                    item.processed_by
                ]),
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
                const item = damagedItems.find((i) => i.id === id);
                if (item) {
                    setSelectedItem(item);
                    setFormData({
                        invoice_no: item.invoice_no,
                        item_name: item.item_name,
                        quantity_returned: item.quantity_returned,
                        return_reason: item.return_reason,
                        other_reason: item.other_reason || '',
                        return_date: item.return_date.split('T')[0],
                        processed_by: item.processed_by
                    });
                    setIsEditModalOpen(true);
                }
            };

            (window as any).deleteDamagedItem = (id: number) => {
                const item = damagedItems.find((i) => i.id === id);
                if (item) {
                    setSelectedItem(item);
                    setIsDeleteModalOpen(true);
                }
            };
        }

        return () => {
            if (gridInstance.current) {
                gridInstance.current.destroy();
            }
        };
    }, [damagedItems, loading]);

    const resetForm = () => {
        setFormData({
            invoice_no: '',
            item_name: '',
            quantity_returned: 1,
            return_reason: 'Damaged',
            other_reason: '',
            return_date: new Date().toISOString().split('T')[0],
            processed_by: ''
        });
        setError('');
    };

    const validateForm = (): boolean => {
        if (!formData.invoice_no.trim()) {
            setError('Invoice/Receipt No. is required');
            return false;
        }
        if (!formData.item_name.trim()) {
            setError('Item Name is required');
            return false;
        }
        if (formData.quantity_returned < 1) {
            setError('Quantity must be at least 1');
            return false;
        }
        if (!formData.return_date) {
            setError('Date is required');
            return false;
        }
        if (!formData.processed_by.trim()) {
            setError('Staff who processed is required');
            return false;
        }
        if (formData.return_reason === 'Other' && !formData.other_reason.trim()) {
            setError('Please specify the other reason');
            return false;
        }
        return true;
    };

    const handleAddDamagedItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError('');

        try {
            await axios.post('http://localhost:8000/api/damaged-items', formData);
            showNotification('Damaged item record added successfully!', 'success');
            setIsAddModalOpen(false);
            resetForm();
            fetchDamagedItems();
        } catch (error: any) {
            console.error('Error adding damaged item:', error);
            setError(error.response?.data?.message || 'Failed to add record');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateDamagedItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || !validateForm()) return;

        setIsSubmitting(true);
        setError('');

        try {
            await axios.put(`http://localhost:8000/api/damaged-items/${selectedItem.id}`, formData);
            showNotification('Damaged item record updated successfully!', 'success');
            setIsEditModalOpen(false);
            resetForm();
            setSelectedItem(null);
            fetchDamagedItems();
        } catch (error: any) {
            console.error('Error updating damaged item:', error);
            setError(error.response?.data?.message || 'Failed to update record');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDamagedItem = async () => {
        if (!selectedItem) return;

        setIsSubmitting(true);
        try {
            await axios.delete(`http://localhost:8000/api/damaged-items/${selectedItem.id}`);
            showNotification('Damaged item record deleted successfully!', 'success');
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
            fetchDamagedItems();
        } catch (error: any) {
            console.error('Error deleting damaged item:', error);
            showNotification(error.response?.data?.message || 'Failed to delete record', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Modal styles
    const modalOverlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
    };

    const modalContentStyle: React.CSSProperties = {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        color: '#000'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '4px'
    };

    // Form component to reuse in Add and Edit modals
    const renderForm = (onSubmit: (e: React.FormEvent) => void, submitButtonText: string) => (
        <form onSubmit={onSubmit}>
            {error && <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px' }}>{error}</div>}

            <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Original Sales Invoice / Receipt No. *</label>
                <input
                    type="text"
                    value={formData.invoice_no}
                    onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                    style={inputStyle}
                    placeholder="Enter invoice/receipt number"
                />
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Item Code / Name *</label>
                <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    style={inputStyle}
                    placeholder="Enter item code or name"
                />
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Quantity Returned *</label>
                <input
                    type="number"
                    min="1"
                    value={formData.quantity_returned}
                    onChange={(e) => setFormData({ ...formData, quantity_returned: parseInt(e.target.value) || 1 })}
                    style={inputStyle}
                />
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Reason for Return *</label>
                <select
                    value={formData.return_reason}
                    onChange={(e) => setFormData({ ...formData, return_reason: e.target.value })}
                    style={inputStyle}
                >
                    {returnReasons.map((reason) => (
                        <option key={reason} value={reason}>{reason}</option>
                    ))}
                </select>
            </div>

            {formData.return_reason === 'Other' && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Please specify other reason *</label>
                    <textarea
                        value={formData.other_reason}
                        onChange={(e) => setFormData({ ...formData, other_reason: e.target.value })}
                        style={{ ...inputStyle, minHeight: '80px' }}
                        placeholder="Enter the specific reason"
                    />
                </div>
            )}

            <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Date *</label>
                <input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    style={inputStyle}
                />
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Staff Who Processed It *</label>
                <input
                    type="text"
                    value={formData.processed_by}
                    onChange={(e) => setFormData({ ...formData, processed_by: e.target.value })}
                    style={inputStyle}
                    placeholder="Enter staff name"
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); }}
                    style={{ padding: '8px 16px', backgroundColor: '#d1d5db', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: isAddModalOpen ? '#16a34a' : '#2563eb',
                        color: 'white',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.5 : 1
                    }}
                >
                    {isSubmitting ? 'Processing...' : submitButtonText}
                </button>
            </div>
        </form>
    );

    return (
        <>
            <Header onLogout={() => { }} />
            <Sidemenu onLogout={() => { }} />
            <div className="main-content app-content">
                {/* Notification */}
                {notification.show && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
                        <div className={`bg-white rounded-lg p-6 shadow-xl ${notification.type === 'success' ? 'border-2 border-green-500' : 'border-2 border-red-500'}`}>
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
                            <p className={`text-center text-lg font-medium ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {notification.message}
                            </p>
                        </div>
                    </div>
                )}

                <div className="container-fluid">
                    <Breadcrumb
                        title="Item Damage"
                        links={[{ text: "Dashboard", link: "/dashboard" }]}
                        active="Item Damage"
                        buttons={
                            <button
                                onClick={() => {
                                    resetForm();
                                    setIsAddModalOpen(true);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Return Damage
                            </button>
                        }
                    />
                    <div className="grid grid-cols-12 gap-x-6">
                        <div className="xxl:col-span-12 col-span-12">
                            <div className="box overflow-hidden main-content-card">
                                {loading ? (
                                    <div className="p-5 text-center">Loading...</div>
                                ) : (
                                    <div ref={gridRef} className="box-body p-5" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Damaged Item Modal */}
            {isAddModalOpen && (
                <div style={modalOverlayStyle} onClick={() => setIsAddModalOpen(false)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Add Return Damage</h2>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        {renderForm(handleAddDamagedItem, 'Add Record')}
                    </div>
                </div>
            )}

            {/* View Damaged Item Modal */}
            {isViewModalOpen && selectedItem && (
                <div style={modalOverlayStyle} onClick={() => setIsViewModalOpen(false)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Damaged Item Details</h2>
                            <button onClick={() => setIsViewModalOpen(false)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '12px', color: '#6b7280' }}>Invoice/Receipt No.</label>
                                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{selectedItem.invoice_no}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#6b7280' }}>Item Name</label>
                                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{selectedItem.item_name}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#6b7280' }}>Quantity Returned</label>
                                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{selectedItem.quantity_returned}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#6b7280' }}>Reason for Return</label>
                                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                                    {selectedItem.return_reason}
                                    {selectedItem.return_reason === 'Other' && selectedItem.other_reason && (
                                        <span style={{ fontWeight: 'normal', color: '#6b7280' }}> - {selectedItem.other_reason}</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#6b7280' }}>Date</label>
                                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{new Date(selectedItem.return_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#6b7280' }}>Processed By</label>
                                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{selectedItem.processed_by}</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                style={{ padding: '8px 16px', backgroundColor: '#d1d5db', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Damaged Item Modal */}
            {isEditModalOpen && selectedItem && (
                <div style={modalOverlayStyle} onClick={() => setIsEditModalOpen(false)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Edit Damaged Item</h2>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        {renderForm(handleUpdateDamagedItem, 'Save Changes')}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedItem && (
                <div style={modalOverlayStyle} onClick={() => setIsDeleteModalOpen(false)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px', width: '64px', borderRadius: '50%', backgroundColor: '#fee2e2', marginBottom: '16px' }}>
                                <Trash2 style={{ height: '32px', width: '32px', color: '#dc2626' }} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#1f2937', marginBottom: '8px' }}>Delete Record</h3>
                            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                                Are you sure you want to delete the record for "<strong>{selectedItem.item_name}</strong>"? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    style={{ padding: '8px 16px', backgroundColor: '#d1d5db', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteDamagedItem}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#dc2626',
                                        color: 'white',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        opacity: isSubmitting ? 0.5 : 1
                                    }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ItemDamage_List;
