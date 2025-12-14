import React, { useState } from 'react';
import axios from 'axios';
import { FaTimes } from 'react-icons/fa';

export interface Category {
    id?: number;
    name: string;
    image_path?: string;
    image?: string;
    description?: string;
}

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCategoryAdded: (category: Category) => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onCategoryAdded }) => {
    const [categoryName, setCategoryName] = useState("");
    const [categoryDescription, setCategoryDescription] = useState("");
    const [categoryImage, setCategoryImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCategoryImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('name', categoryName);
            if (categoryDescription) {
                formData.append('description', categoryDescription);
            }
            if (categoryImage) {
                formData.append('image', categoryImage);
            }

            const response = await axios.post('http://localhost:8000/api/categories', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            onCategoryAdded(response.data);
            // Reset form
            setCategoryName("");
            setCategoryDescription("");
            setCategoryImage(null);
            setImagePreview(null);
            onClose();
        } catch (err: any) {
            console.error('Error adding category:', err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.data?.errors?.name) {
                setError(err.response.data.errors.name[0]);
            } else {
                setError('Failed to add category. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setCategoryName("");
        setCategoryDescription("");
        setCategoryImage(null);
        setImagePreview(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Add New Category</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition-colors focus:outline-none"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoryName">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            id="categoryName"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            placeholder="Enter category name"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoryDescription">
                            Description
                        </label>
                        <textarea
                            id="categoryDescription"
                            value={categoryDescription}
                            onChange={(e) => setCategoryDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            placeholder="Enter category description"
                            rows={3}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoryImage">
                            Category Image
                        </label>
                        <input
                            type="file"
                            id="categoryImage"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        />
                        {imagePreview && (
                            <div className="mt-3 flex justify-center">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-24 h-24 object-cover rounded-lg border"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !categoryName.trim()}
                            className={`flex-1 px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSubmitting || !categoryName.trim()
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCategoryModal;
