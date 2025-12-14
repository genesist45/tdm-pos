import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface Category {
  id: number;
  name: string;
  description: string | null;
  image_path: string | null;
}

interface InventoryData {
  product_name: string;
  category: string;
  quantity: number;
  price: number;
  stock_status: string;
  description: string;
  is_active: boolean;
  image?: File | null;
}

type FormField = {
  label: string;
  name: keyof InventoryData;
  type: "text" | "number" | "select";
  options?: { value: string | number; label: string }[];
};

// Form fields configuration - will be populated dynamically
const getFormFields = (categories: Category[]): FormField[] => [
  { label: "Product Name", name: "product_name", type: "text" },
  {
    label: "Category",
    name: "category",
    type: "select",
    options: categories.map((cat) => ({ value: cat.name, label: cat.name })),
  },
  { label: "Quantity", name: "quantity", type: "number" },
  { label: "Price", name: "price", type: "number" },
  {
    label: "Stock Status",
    name: "stock_status",
    type: "select",
    options: ["In Stock", "Out of Stock"].map((status) => ({
      value: status,
      label: status,
    })),
  },
];

const initialInventoryData: InventoryData = {
  product_name: "",
  category: "",
  quantity: 0,
  price: 0,
  stock_status: "",
  description: "",
  is_active: true,
  image: null,
};

function Inventory_Edit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inventoryData, setInventoryData] =
    useState<InventoryData>(initialInventoryData);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingImagePath, setExistingImagePath] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories and inventory item in parallel
        const [categoriesRes, inventoryRes] = await Promise.all([
          axios.get("http://localhost:8000/api/categories"),
          axios.get(`http://localhost:8000/api/inventory/${id}`),
        ]);

        setCategories(categoriesRes.data);

        // Pre-populate form with existing data
        const item = inventoryRes.data;
        setInventoryData({
          product_name: item.product_name || "",
          category: item.category || "",
          quantity: item.quantity || 0,
          price: item.price || 0,
          stock_status: item.stock_status || "",
          description: item.description || "",
          is_active: item.is_active !== false,
          image: null,
        });

        // Set existing image preview if available
        if (item.image_path) {
          setExistingImagePath(item.image_path);
          setImagePreview(`http://localhost:8000${item.image_path}`);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
        setIsSuccessModal(false);
        setModalTitle("Error!");
        setModalMessage("Failed to load inventory item data");
        setIsModalOpen(true);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Get form fields with current categories
  const formFields = getFormFields(categories);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setInventoryData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleToggleChange = () => {
    setInventoryData((prevState) => ({
      ...prevState,
      is_active: !prevState.is_active,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setInventoryData((prevState) => ({ ...prevState, image: file }));
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setExistingImagePath("");
    setInventoryData((prevState) => ({ ...prevState, image: null }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalTitle("");
    setModalMessage("");

    // If it was a success, navigate back to inventory list
    if (isSuccessModal) {
      navigate("/inventory");
    }
  };

  const handleReset = () => {
    // Re-fetch the original data
    const fetchOriginalData = async () => {
      try {
        const inventoryRes = await axios.get(
          `http://localhost:8000/api/inventory/${id}`,
        );
        const item = inventoryRes.data;
        setInventoryData({
          product_name: item.product_name || "",
          category: item.category || "",
          quantity: item.quantity || 0,
          price: item.price || 0,
          stock_status: item.stock_status || "",
          description: item.description || "",
          is_active: item.is_active !== false,
          image: null,
        });

        if (item.image_path) {
          setExistingImagePath(item.image_path);
          setImagePreview(`http://localhost:8000${item.image_path}`);
        } else {
          setExistingImagePath("");
          setImagePreview("");
        }
      } catch (err) {
        console.error("Error resetting data:", err);
      }
    };

    fetchOriginalData();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Add _method field for Laravel to handle as PATCH/PUT
      formData.append("_method", "PUT");

      Object.entries(inventoryData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === "is_active") {
            formData.append(key, value ? "true" : "false");
          } else if (key === "image") {
            // Only append image if a new one was selected
            if (value instanceof File) {
              formData.append(key, value);
            }
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });

      const response = await axios.post(
        `http://localhost:8000/api/inventory/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.status === 200) {
        setIsSuccessModal(true);
        setModalTitle("Success!");
        setModalMessage("✅ Inventory record updated successfully!");
        setIsModalOpen(true);
      }
    } catch (err: any) {
      setIsSuccessModal(false);
      setModalTitle("Error!");
      setModalMessage(
        err.response?.data?.message ||
        "An error occurred while updating the inventory record",
      );
      setIsModalOpen(true);
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header onLogout={() => { }} />
        <Sidemenu onLogout={() => { }} />
        <div className="main-content app-content">
          <div className="container-fluid">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading inventory item...</p>
              </div>
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
        <div className="container-fluid">
          <Breadcrumb
            title="Edit Inventory Item"
            links={[{ text: "Inventory", link: "/inventory" }]}
            active="Edit Product"
          />

          {/* Edit Form Content */}
          <div className="grid grid-cols-12 gap-x-6">
            <div className="xxl:col-span-12 col-span-12">
              <div className="box overflow-hidden main-content-card">
                <div className="box-body p-5">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4 flex items-start gap-4">
                      <span className="avatar avatar-xxl">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Product" />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200" />
                        )}
                      </span>
                      <div>
                        <label className="block font-medium mb-2">
                          Product Image
                        </label>
                        <div className="flex gap-2">
                          <label className="bg-gray-300 text-dark px-4 py-2 rounded cursor-pointer">
                            <i className="bi bi-upload"></i>
                            <span className="px-2">Upload</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                          {imagePreview && (
                            <button
                              type="button"
                              className="bg-gray-300 px-4 py-2 rounded"
                              onClick={handleRemoveImage}
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formFields.map(({ label, name, type, options }) => (
                        <div key={name}>
                          <label
                            className="block font-medium mb-1"
                            htmlFor={name}
                          >
                            {label}
                          </label>
                          {type === "select" ? (
                            <select
                              id={name}
                              name={name}
                              value={inventoryData[name] as string | number}
                              onChange={handleChange}
                              className="ti-form-input rounded-sm"
                            >
                              <option value="">Select {label}</option>
                              {options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={type}
                              id={name}
                              name={name}
                              value={inventoryData[name] as string | number}
                              onChange={handleChange}
                              className="ti-form-input rounded-sm"
                              placeholder={`Enter ${label}`}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <label
                        className="block font-medium mb-1"
                        htmlFor="description"
                      >
                        Product Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        className="w-full px-3 py-2 border rounded focus:outline-none"
                        placeholder="Write a short product description..."
                        value={inventoryData.description}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Enable in POS Toggle Switch */}
                    <div className="mt-4">
                      <label className="block font-medium mb-2">
                        Enable in POS
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleToggleChange}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${inventoryData.is_active
                              ? "bg-green-500"
                              : "bg-gray-300"
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${inventoryData.is_active
                                ? "translate-x-6"
                                : "translate-x-1"
                              }`}
                          />
                        </button>
                        <span
                          className={`text-sm font-medium ${inventoryData.is_active ? "text-green-600" : "text-gray-500"}`}
                        >
                          {inventoryData.is_active ? "Enabled" : "Disabled"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {inventoryData.is_active
                            ? "(Item will be visible in Buy/Purchase page)"
                            : "(Item will be hidden from Buy/Purchase page)"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-4">
                      <button
                        type="button"
                        className="bg-gray-300 px-4 py-2 rounded"
                        onClick={handleReset}
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`bg-green-500 text-white px-4 py-2 rounded ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600"}`}
                      >
                        <i className="bi bi-save"></i>
                        <span className="px-3">
                          {isSubmitting ? "Updating..." : "Update Record"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[9999] flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h3
                  className={`text-lg leading-6 font-medium ${isSuccessModal ? "text-green-600" : "text-red-600"}`}
                >
                  {modalTitle}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{modalMessage}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {isSuccessModal ? "Go to Inventory List" : "Close"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Inventory_Edit;
