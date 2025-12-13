import React, { useEffect, useRef, useState } from "react";
import { Grid, html } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import { Link } from "react-router-dom";
import axios from "axios";

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

  const handleDelete = async (supplierId: number) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await axios.delete(`http://localhost:8000/api/suppliers/${supplierId}`);
        // Refresh the suppliers list
        const response = await axios.get('http://localhost:8000/api/suppliers');
        setSuppliers(response.data);
        setIsModalOpen(false);
        showNotification('Supplier deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        showNotification('Failed to delete supplier', 'error');
      }
    }
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
            width: "70px",
            formatter: (_, row) =>
              html(`
                <div class="flex justify-center gap-2">
                  <button 
                    class="bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center"
                    onclick="window.openEditModal(${JSON.stringify(row.cells[0].data)})"
                  >
                    <i class="ri-pencil-line mr-1"></i>
                    <span class="px-1">Edit</span>
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

      // Add global function for the grid to use
      (window as any).openEditModal = (id: number) => {
        const supplier = suppliers.find((s: any) => s.id === id);
        if (supplier) {
          openEditModal(supplier);
        }
      };
    }
  }, [suppliers, loading]);

  return (
    <>
      <Header onLogout={() => {}} />
      <Sidemenu onLogout={() => {}} />
      <div className="main-content app-content">
        {/* Success/Error Popup Modal */}
        {notification.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className={`bg-white rounded-lg p-6 shadow-xl transform transition-all duration-300 ${
              notification.type === 'success' ? 'border-2 border-green-500' : 'border-2 border-red-500'
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
              <p className={`text-center text-lg font-medium ${
                notification.type === 'success' ? 'text-green-600' : 'text-red-600'
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
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${
                    errors.email ? 'border-red-500' : ''
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
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${
                    errors.phone ? 'border-red-500' : ''
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
                onClick={() => handleDelete(selectedSupplier.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded text-sm font-medium w-24"
              >
                Delete
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
    </>
  );
};

export default Supplier_List;
