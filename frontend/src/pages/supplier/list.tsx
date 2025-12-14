import React, { useEffect, useRef, useState } from "react";
import { Grid, html } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import { Link } from "react-router-dom";
import axios from "axios";
import { Trash2, X } from "lucide-react";

const Supplier_List: React.FC = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    phone: ''
  });
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' // 'success' or 'error'
  });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      email: '',
      phone: ''
    };
    let isValid = true;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editForm.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(editForm.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!editForm.phone) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!phoneRegex.test(editForm.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/suppliers/${selectedSupplier.id}`);
      // Refresh the suppliers list
      const response = await axios.get('http://localhost:8000/api/suppliers');
      setSuppliers(response.data);
      setIsDeleteModalOpen(false);
      setSelectedSupplier(null);
      showNotification('Supplier deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showNotification('Failed to delete supplier', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openViewModal = async (id: number) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/suppliers/${id}`);
      setSelectedSupplier(response.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching supplier:', error);
      showNotification('Failed to fetch supplier details', 'error');
    }
  };

  const openDeleteModal = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsDeleteModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSupplier) return;

    if (!validateForm()) {
      return;
    }

    try {
      const updateData = {
        supplier_name: selectedSupplier.supplier_name,
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        company_name: selectedSupplier.company_name,
        region: selectedSupplier.region,
        province: selectedSupplier.province,
        city: selectedSupplier.city,
        barangay: selectedSupplier.barangay,
        postal_code: selectedSupplier.postal_code
      };

      // Log the exact data being sent
      console.log('Sending update with data:', JSON.stringify(updateData, null, 2));

      const response = await axios.patch(
        `http://localhost:8000/api/suppliers/${selectedSupplier.id}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Server response:', JSON.stringify(response.data, null, 2));

      if (response.status === 200) {
        // Refresh the suppliers list
        const suppliersResponse = await axios.get('http://localhost:8000/api/suppliers');
        setSuppliers(suppliersResponse.data);
        setIsModalOpen(false);
        setErrors({ email: '', phone: '' });
        showNotification('Supplier updated successfully', 'success');
      }
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      if (error.response?.status === 422) {
        // Log the exact validation errors from the server
        console.log('Server validation errors:', JSON.stringify(error.response.data, null, 2));
        const serverErrors = error.response.data.errors || {};
        setErrors({
          email: serverErrors.email?.[0] || '',
          phone: serverErrors.phone?.[0] || ''
        });
        showNotification('Please check the form for errors', 'error');
      } else {
        showNotification('Failed to update supplier', 'error');
      }
    }
  };

  const openEditModal = (supplier: any) => {
    console.log('Opening modal for supplier:', JSON.stringify(supplier, null, 2));
    setSelectedSupplier(supplier);
    setEditForm({
      email: supplier.email || '',
      phone: supplier.phone || ''
    });
    setErrors({ email: '', phone: '' });
    setIsModalOpen(true);
  };

  useEffect(() => {
    // Fetch suppliers from API
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/suppliers');
        console.log('Fetched suppliers:', JSON.stringify(response.data, null, 2));
        setSuppliers(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (gridRef.current && !loading) {
      // Clear the container before rendering
      gridRef.current.innerHTML = '';

      new Grid({
        columns: [
          { name: "#", width: "10px" },
          {
            name: "Supplier Name",
            width: "200px",
            formatter: (_, row) =>
              html(`
                <div class="flex items-center gap-3">
                  <span>${row.cells[1].data}</span>
                </div>
              `),
          },
          { name: "Email", width: "200px" },
          { name: "Phone", width: "150px" },
          { name: "Company", width: "150px" },
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
                    title="Edit Supplier"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                      <path d="m15 5 4 4"></path>
                    </svg>
                  </button>
                  <button 
                    class="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-all duration-200 flex items-center justify-center"
                    onclick="window.openDeleteModal(${row.cells[0].data})"
                    title="Delete Supplier"
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
        data: suppliers.map((supplier: any, index) => [
          supplier.id,
          supplier.supplier_name,
          supplier.email,
          supplier.phone,
          supplier.company_name
        ]),
      }).render(gridRef.current);

      // Add global functions for the grid to use
      (window as any).openEditModal = (id: number) => {
        const supplier = suppliers.find((s: any) => s.id === id);
        if (supplier) {
          openEditModal(supplier);
        }
      };

      (window as any).openViewModal = (id: number) => {
        openViewModal(id);
      };

      (window as any).openDeleteModal = (id: number) => {
        const supplier = suppliers.find((s: any) => s.id === id);
        if (supplier) {
          openDeleteModal(supplier);
        }
      };
    }
  }, [suppliers, loading]);

  return (
    <>
      <Header onLogout={() => { }} />
      <Sidemenu onLogout={() => { }} />
      <div className="main-content app-content">
        {/* Success/Error Popup Modal */}
        {notification.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
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
            title="Manage Suppliers"
            links={[{ text: "Dashboard", link: "/dashboard" }]}
            active="Suppliers"
            buttons={
              <Link to="/supplier/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
                <i className="ri-add-line"></i> Add New Supplier
              </Link>
            }
          />
          <div className="grid grid-cols-12 gap-x-6">
            <div className="xxl:col-span-12 col-span-12">
              <div className="box overflow-hidden main-content-card">
                <div className="box-body p-5">
                  {loading ? (
                    <div className="text-center">Loading...</div>
                  ) : (
                    <div ref={gridRef}></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Edit Supplier</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                <input
                  type="text"
                  value={selectedSupplier.supplier_name}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => {
                    setEditForm({ ...editForm, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${errors.email ? 'border-red-500' : ''
                    }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => {
                    setEditForm({ ...editForm, phone: e.target.value });
                    setErrors({ ...errors, phone: '' });
                  }}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${errors.phone ? 'border-red-500' : ''
                    }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  value={selectedSupplier.company_name}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={handleUpdate}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium w-24"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setErrors({ email: '', phone: '' });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded text-sm font-medium w-24"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && selectedSupplier && (
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
              <div style={{ width: '32px' }}></div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Supplier Details
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

            {/* Details Grid */}
            <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '24px' }}>
              {/* Row 1: Supplier Name & Company */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Supplier Name</label>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{selectedSupplier.supplier_name}</p>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Company Name</label>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{selectedSupplier.company_name}</p>
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Email</label>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#2563eb', margin: 0 }}>{selectedSupplier.email}</p>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Phone</label>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{selectedSupplier.phone}</p>
                </div>
              </div>

              {/* Row 3: Region & Province */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Region</label>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{selectedSupplier.region || 'N/A'}</p>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Province</label>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{selectedSupplier.province || 'N/A'}</p>
                </div>
              </div>

              {/* Row 4: City & Barangay */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>City</label>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{selectedSupplier.city || 'N/A'}</p>
                </div>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Barangay</label>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{selectedSupplier.barangay || 'N/A'}</p>
                </div>
              </div>

              {/* Row 5: Postal Code */}
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>Postal Code</label>
                <p style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{selectedSupplier.postal_code || 'N/A'}</p>
              </div>
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
      {isDeleteModalOpen && selectedSupplier && (
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
              Delete Supplier
            </h2>
            <p style={{ color: '#4b5563', textAlign: 'center', marginBottom: '24px' }}>
              Are you sure you want to delete <span style={{ fontWeight: '600' }}>"{selectedSupplier.supplier_name}"</span>? This action cannot be undone.
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
                  setSelectedSupplier(null);
                }}
                style={{
                  backgroundColor: '#6b7280',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer'
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

export default Supplier_List;
