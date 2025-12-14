import React, { useEffect, useRef, useState } from "react";
import { Grid, html } from "gridjs";
import "gridjs/dist/theme/mermaid.css";
import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import axios from "axios";
import { Trash2, X, Plus, Eye, Edit, Upload } from "lucide-react";

interface Category {
    id: number;
    name: string;
    description: string | null;
    image_path: string | null;
    created_at: string;
    updated_at: string;
}

const Categories_List: React.FC = () => {
    const gridRef = useRef<HTMLDivElement>(null);
    const gridInstance = useRef<Grid | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
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

    const fetchCategories = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/categories');
            setCategories(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (gridRef.current && !loading) {
            gridRef.current.innerHTML = '';

            gridInstance.current = new Grid({
                columns: [
                    { name: "#", width: "60px" },
                    {
                        name: "Image",
                        width: "100px",
                        formatter: (cell) => {
                            const imagePath = cell as string;
                            if (imagePath) {
                                const imageUrl = imagePath.startsWith('http') 
                                    ? imagePath 
                                    : `http://localhost:8000${imagePath}`;
                                return html(`<img src="${imageUrl}" alt="Category" class="w-12 h-12 object-cover rounded" />`);
                            }
                            return html(`<div class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">No Image</div>`);
                        }
                    },
                    { name: "Name", width: "200px" },
                    { name: "Description", width: "250px" },
                    {
                        name: "Actions",
                        width: "150px",
                        formatter: (_, row) =>
                            html(`
                                <div class="flex justify-center gap-2">
                                    <button 
                                        class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-all duration-200"
                                        onclick="window.viewCategory(${row.cells[0].data})"
                                        title="View"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    </button>
                                    <button 
                                        class="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded transition-all duration-200"
                                        onclick="window.editCategory(${row.cells[0].data})"
                                        title="Edit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                                    </button>
                                    <button 
                                        class="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-all duration-200"
                                        onclick="window.deleteCategory(${row.cells[0].data})"
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
                data: categories.map((category) => [
                    category.id,
                    category.image_path,
                    category.name,
                    category.description || 'No description'
                ]),
            });
            
            gridInstance.current.render(gridRef.current);

            // Global functions for grid actions
            (window as any).viewCategory = (id: number) => {
                const category = categories.find((c) => c.id === id);
                if (category) {
                    setSelectedCategory(category);
                    setIsViewModalOpen(true);
                }
            };

            (window as any).editCategory = (id: number) => {
                const category = categories.find((c) => c.id === id);
                if (category) {
                    setSelectedCategory(category);
                    setFormData({
                        name: category.name,
                        description: category.description || ''
                    });
                    if (category.image_path) {
                        setImagePreview(category.image_path.startsWith('http') 
                            ? category.image_path 
                            : `http://localhost:8000${category.image_path}`);
                    } else {
                        setImagePreview('');
                    }
                    setIsEditModalOpen(true);
                }
            };

            (window as any).deleteCategory = (id: number) => {
                const category = categories.find((c) => c.id === id);
                if (category) {
                    setSelectedCategory(category);
                    setIsDeleteModalOpen(true);
                }
            };
        }

        return () => {
            if (gridInstance.current) {
                gridInstance.current.destroy();
            }
        };
    }, [categories, loading]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '' });
        setImageFile(null);
        setImagePreview('');
        setError('');
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Category name is required');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name.trim());
            if (formData.description.trim()) {
                formDataToSend.append('description', formData.description.trim());
            }
            if (imageFile) {
                formDataToSend.append('image', imageFile);
            }

            await axios.post('http://localhost:8000/api/categories', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showNotification('Category added successfully!', 'success');
            setIsAddModalOpen(false);
            resetForm();
            fetchCategories();
        } catch (error: any) {
            console.error('Error adding category:', error);
            setError(error.response?.data?.message || 'Failed to add category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategory || !formData.name.trim()) {
            setError('Category name is required');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name.trim());
            formDataToSend.append('description', formData.description.trim());
            formDataToSend.append('_method', 'PUT');
            if (imageFile) {
                formDataToSend.append('image', imageFile);
            }

            await axios.post(`http://localhost:8000/api/categories/${selectedCategory.id}`, formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showNotification('Category updated successfully!', 'success');
            setIsEditModalOpen(false);
            resetForm();
            setSelectedCategory(null);
            fetchCategories();
        } catch (error: any) {
            console.error('Error updating category:', error);
            setError(error.response?.data?.message || 'Failed to update category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategory) return;

        setIsSubmitting(true);
        try {
            await axios.delete(`http://localhost:8000/api/categories/${selectedCategory.id}`);
            showNotification('Category deleted successfully!', 'success');
            setIsDeleteModalOpen(false);
            setSelectedCategory(null);
            fetchCategories();
        } catch (error: any) {
            console.error('Error deleting category:', error);
            showNotification(error.response?.data?.message || 'Failed to delete category', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getImageUrl = (path: string | null) => {
        if (!path) return '';
        return path.startsWith('http') ? path : `http://localhost:8000${path}`;
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
                        title="Categories"
                        links={[{ text: "Dashboard", link: "/dashboard" }]}
                        active="Categories"
                        buttons={
                            <button
                                onClick={() => {
                                    resetForm();
                                    setIsAddModalOpen(true);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                            >
                                <Plus size={16} /> Add Category
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

            {/* Add Category Modal */}
            {isAddModalOpen && (
                <div style={modalOverlayStyle} onClick={() => setIsAddModalOpen(false)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Add New Category</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddCategory}>
                            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter category name"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Enter description (optional)"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                <div className="flex items-center gap-4">
                                    {imagePreview && (
                                        <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded" />
                                    )}
                                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded flex items-center gap-2">
                                        <Upload size={16} /> Choose Image
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                                    {isSubmitting ? 'Adding...' : 'Add Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Category Modal */}
            {isViewModalOpen && selectedCategory && (
                <div style={modalOverlayStyle} onClick={() => setIsViewModalOpen(false)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Category Details</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {selectedCategory.image_path && (
                                <div className="flex justify-center">
                                    <img 
                                        src={getImageUrl(selectedCategory.image_path)} 
                                        alt={selectedCategory.name} 
                                        className="max-w-full h-48 object-cover rounded-lg"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Name</label>
                                <p className="text-lg font-semibold text-gray-800">{selectedCategory.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Description</label>
                                <p className="text-gray-700">{selectedCategory.description || 'No description'}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {isEditModalOpen && selectedCategory && (
                <div style={modalOverlayStyle} onClick={() => setIsEditModalOpen(false)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Edit Category</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCategory}>
                            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter category name"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Enter description (optional)"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                <div className="flex items-center gap-4">
                                    {imagePreview && (
                                        <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded" />
                                    )}
                                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded flex items-center gap-2">
                                        <Upload size={16} /> Change Image
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedCategory && (
                <div style={modalOverlayStyle} onClick={() => setIsDeleteModalOpen(false)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                <Trash2 className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Category</h3>
                            <p className="text-gray-500 mb-6">
                                Are you sure you want to delete "<strong>{selectedCategory.name}</strong>"? This action cannot be undone.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteCategory}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
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

export default Categories_List;
