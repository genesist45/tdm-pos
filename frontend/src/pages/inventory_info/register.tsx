import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import axios from "axios";

interface Supplier {
  id: number;
  company_name: string;
  supplier_name: string;
}

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
  supplier_id: number;
  stock_status: string;
  description: string;
  image?: File | null;
}

type FormField = {
  label: string;
  name: keyof InventoryData;
  type: "text" | "number" | "select";
  options?: { value: string | number; label: string }[];
};

// Form fields configuration - will be populated dynamically
const getFormFields = (categories: Category[], suppliers: Supplier[]): FormField[] => [
  { label: "Product Name", name: "product_name", type: "text" },
  {
    label: "Category",
    name: "category",
    type: "select",
    options: categories.map(cat => ({ value: cat.name, label: cat.name }))
  },
  { label: "Quantity", name: "quantity", type: "number" },
  { label: "Price", name: "price", type: "number" },
  {
    label: "Supplier",
    name: "supplier_id",
    type: "select",
    options: suppliers.map(supplier => ({
      value: supplier.id,
      label: `${supplier.company_name} (${supplier.supplier_name})`
    }))
  },
  {
    label: "Stock Status",
    name: "stock_status",
    type: "select",
    options: ["In Stock", "Out of Stock"].map(status => ({ value: status, label: status }))
  }
];

const initialInventoryData: InventoryData = {
  product_name: "",
  category: "",
  quantity: 0,
  price: 0,
  supplier_id: 0,
  stock_status: "",
  description: "",
  image: null,
};

function Inventory_Registration() {
  const [inventoryData, setInventoryData] = useState<InventoryData>(initialInventoryData);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch suppliers and categories in parallel
        const [suppliersRes, categoriesRes] = await Promise.all([
          axios.get('http://localhost:8000/api/suppliers'),
          axios.get('http://localhost:8000/api/categories')
        ]);
        setSuppliers(suppliersRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  // Get form fields with current categories and suppliers
  const formFields = getFormFields(categories, suppliers);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInventoryData((prevState) => ({ ...prevState, [name]: value }));
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
    setInventoryData((prevState) => ({ ...prevState, image: null }));
  };

  const closeModal = () => {
    console.log("Closing success/error modal");
    setIsModalOpen(false);
    setModalTitle("");
    setModalMessage("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Clear previous modal state
    closeModal(); // Close success/error modal if open

    try {
      const formData = new FormData();
      Object.entries(inventoryData).forEach(([key, value]) => {
        if (value !== null) {
          formData.append(key, value as string | Blob);
        }
      });

      const response = await axios.post('http://localhost:8000/api/inventory', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        setIsSuccessModal(true);
        setModalTitle("Success!");
        setModalMessage("✅ Inventory record added successfully!");
        setInventoryData(initialInventoryData); // Reset form
        setImagePreview("");
      }
    } catch (err: any) {
      setIsSuccessModal(false);
      setModalTitle("Error!");
      setModalMessage(err.response?.data?.message || "An error occurred while adding the inventory record");
      console.error('Submission error:', err);
    } finally {
      console.log('Setting success/error modal open state to true', { title: modalTitle, message: modalMessage });
      setIsModalOpen(true); // Open success/error modal
    }
  };

  return (
    <>
      <Header onLogout={() => {}} />
      <Sidemenu onLogout={() => {}} />
      <div className="main-content app-content">
        <div className="container-fluid">
          <Breadcrumb
            title="Inventory Registration"
            links={[{ text: "Inventory", link: "/inventory" }]}
            active="Register New Product"
          />

          {/* Original Registration Form Content (restored) */}
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
                        <label className="block font-medium mb-2">Product Image</label>
                        <div className="flex gap-2">
                          <label className="bg-gray-300 text-dark px-4 py-2 rounded cursor-pointer">
                            <i className="bi bi-upload"></i>
                            <span className="px-2">Upload</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                          </label>
                          {imagePreview && (
                            <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={handleRemoveImage}>
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formFields.map(({ label, name, type, options }) => (
                        <div key={name}>
                          <label className="block font-medium mb-1" htmlFor={name}>
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
                      <label className="block font-medium mb-1" htmlFor="description">
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

                    <div className="mt-4 flex justify-end gap-4">
                      <button
                        type="button"
                        className="bg-gray-300 px-4 py-2 rounded"
                        onClick={() => {
                          setInventoryData(initialInventoryData);
                          setImagePreview("");
                        }}
                      >
                        Reset
                      </button>
                      <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                        <i className="bi bi-save"></i>
                        <span className="px-3">Submit Record</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Modal (kept from previous iteration) */}
          {isModalOpen && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[9999] flex justify-center items-center">
                  <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                      <h3 className={`text-lg leading-6 font-medium ${isSuccessModal ? 'text-green-600' : 'text-red-600'}`}>
                          {modalTitle}
                      </h3>
                      <div className="mt-2">
                          <p className="text-sm text-gray-500">
                              {modalMessage}
                          </p>
                      </div>
                      <div className="mt-4 flex justify-end">
                          <button
                              onClick={closeModal}
                              className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                              Close
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

export default Inventory_Registration;
