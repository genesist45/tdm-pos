import Breadcrumb from "../../components/breadcrums";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface FormData {
  company_name: string;
  supplier_name: string;
  email: string;
  phone: string;
  region: string;
  province: string;
  city: string;
  barangay: string;
  postal_code: string;
  company_description: string;
}

const initialFormData: FormData = {
  company_name: "",
  supplier_name: "",
  email: "",
  phone: "",
  region: "",
  province: "",
  city: "",
  barangay: "",
  postal_code: "",
  company_description: "",
};

type FormField = [string, keyof FormData, string];

function Supplier_Registration() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Validation for supplier name, province, and city (only letters and spaces)
    if (['supplier_name', 'province', 'city'].includes(name)) {
      // Only allow letters and spaces
      if (!/^[A-Za-z\s]*$/.test(value)) {
        return;
      }
    }

    // Validation for phone number (max 11 digits)
    if (name === 'phone') {
      // Only allow numbers and limit to 11 digits
      if (!/^\d*$/.test(value) || value.length > 11) {
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Additional validation before submission
    if (formData.phone.length !== 11) {
      setError('Phone number must be exactly 11 digits');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/suppliers', formData);

      if (response.status === 201) {
        navigate('/supplier');
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        setError(errorMessages.join('\n'));
      } else {
        setError(error.response?.data?.message || 'An error occurred while creating the supplier');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Implement logout logic here
    console.log('Logout clicked');
  };

  const formFields: FormField[] = [
    ["Company Name", "company_name", "bi bi-building"],
    ["Supplier Name", "supplier_name", "bi bi-person"],
    ["Email", "email", "bi bi-envelope"],
    ["Phone", "phone", "bi bi-telephone"],
    ["Region", "region", "bi bi-geo-alt"],
    ["Province", "province", "bi bi-geo-alt"],
    ["City", "city", "bi bi-geo-alt"],
    ["Barangay", "barangay", "bi bi-geo-alt"],
    ["Postal Code", "postal_code", "bi bi-mailbox"],
  ];

  return (
    <>
      <Header onLogout={handleLogout} />
      <Sidemenu onLogout={handleLogout} />
      <div className="main-content app-content">
        <div className="container-fluid">
          <Breadcrumb
            title="Supplier Registration"
            links={[{ text: "Suppliers", link: "/suppliers" }]}
            active="Register New Supplier"
          />
          <div className="grid grid-cols-12 gap-x-6">
            <div className="xxl:col-span-12 col-span-12">
              <div className="box overflow-hidden main-content-card">
                <div className="box-body p-5">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 whitespace-pre-line">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formFields.map(([label, name, icon]) => (
                        <div key={name} className="relative">
                          <label className="block font-medium mb-1" htmlFor={name}>
                            {label}
                            {name === 'phone' && <span className="text-sm text-gray-500 ml-1"></span>}
                          </label>
                          <div className="relative">
                            <input
                              type={name === "email" ? "email" : "text"}
                              id={name}
                              name={name}
                              value={formData[name]}
                              onChange={handleChange}
                              className="ti-form-input rounded-sm ps-11 focus:z-10"
                              placeholder={`Enter ${label}`}
                              required
                              maxLength={name === 'phone' ? 11 : undefined}
                            />
                            <i className={`absolute inset-y-0 start-0 flex items-center pointer-events-none z-20 ps-4 ${icon}`}></i>
                          </div>
                          {name === 'phone' && formData.phone.length > 0 && formData.phone.length !== 11 && (
                            <p className="text-red-500 text-sm mt-1">Phone number must be 11 digits</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="block font-medium mb-1" htmlFor="company_description">Company Description</label>
                      <textarea
                        id="company_description"
                        name="company_description"
                        value={formData.company_description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border rounded focus:outline-none"
                        placeholder="Write a short company description..."
                      />
                    </div>
                    <div className="mt-4 flex justify-end gap-4">
                      <button
                        type="reset"
                        className="bg-gray-300 px-4 py-2 rounded"
                        onClick={() => setFormData(initialFormData)}
                        disabled={loading}
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <i className="ri-loader-4-line animate-spin mr-2"></i>
                            Submitting...
                          </span>
                        ) : (
                          <>
                            <i className="bi bi-save"></i>
                            <span className="px-3">Submit Record</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Supplier_Registration; 