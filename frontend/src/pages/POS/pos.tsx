import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../layouts/header";
import Sidemenu from "../../layouts/sidemenu";
import Breadcrumb from "../../components/breadcrums";
import { FaShoppingCart, FaTimes } from "react-icons/fa";
import axios from "axios";
import html2canvas from "html2canvas";

// Define your interfaces here (Product, CartItem, Purchase)
interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    image: string;
    category?: string; // Optional category for products
}

interface CartItem extends Product {
    quantity: number;
}

interface PurchaseItem {
    id: number;
    name: string;
    quantity: number;
    price: number;
}

interface Purchase {
    id: string;
    date: string;
    total: number;
    items: CartItem[];
}

interface Category {
    id: number;
    name: string;
    description: string | null;
    image_path: string | null;
}

// Enhanced ProductCard Component
interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps & { cartQuantity?: number }> = ({ product, onAddToCart, cartQuantity }) => (
    <div
        className={`border rounded-lg shadow-md p-4 text-center transition-transform transform hover:scale-105 ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
    >
        <div className="relative">
            {product.image ? (
                <img src={product.image} alt={product.name} className="w-32 h-32 mx-auto object-cover rounded-md" />
            ) : (
                <div className="w-32 h-32 mx-auto bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                </div>
            )}
            {cartQuantity && cartQuantity > 0 && (
                <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {cartQuantity}
                </span>
            )}
            {product.stock === 0 && (
                <div className="absolute top-0 left-0 w-full h-full bg-gray-200 bg-opacity-75 flex justify-center items-center rounded-md">
                    <span className="text-red-600 font-bold text-lg">Out of Stock</span>
                </div>
            )}
        </div>
        <h3 className="mt-2 font-semibold text-md text-black">{product.name}</h3>
        <p className="text-gray-600 text-sm text-black">Price: ₱{product.price.toFixed(2)}</p>
        <p className="text-gray-500 text-xs text-black">Stock: {product.stock}</p>
        <button
            className={`bg-blue-500 text-white py-2 px-4 rounded-md mt-2 w-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${product.stock === 0 ? 'bg-gray-400 cursor-not-allowed' : ''
                }`}
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
        >
            Add to Product
        </button>
    </div>
);

// Enhanced CartItem Component (for the sidebar/modal)
interface SidebarCartItemProps {
    item: CartItem;
    onQuantityChange: (productId: number, quantity: number) => void;
    onRemoveFromCart: (productId: number) => void;
}

const SidebarCartItem: React.FC<SidebarCartItemProps> = ({ item, onQuantityChange, onRemoveFromCart }) => (
    <div key={item.id} className="flex items-center py-2 border-b last:border-b-0">
        <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', marginRight: '8px' }} />
        <div className="flex-grow">
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#000', marginBottom: '2px' }}>{item.name}</h4>
            <div className="flex items-center justify-between">
                <div className="flex items-center border rounded" style={{ fontSize: '10px' }}>
                    <button
                        style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: '#e0f2fe', borderRadius: '3px' }}
                        onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                    >
                        -
                    </button>
                    <span style={{ width: '24px', textAlign: 'center', fontSize: '11px', color: '#000' }}>{item.quantity}</span>
                    <button
                        style={{ padding: '2px 6px', fontSize: '10px', backgroundColor: '#e0f2fe', borderRadius: '3px' }}
                        onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                    >
                        +
                    </button>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#000' }}>₱{(item.price * item.quantity).toFixed(2)}</span>
            </div>
        </div>
        <button
            style={{ backgroundColor: '#0ea5e9', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', marginLeft: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => onRemoveFromCart(item.id)}
        >
            <FaTimes style={{ width: '10px', height: '10px' }} />
        </button>
    </div>
);

// Function to detect if dark mode is active (example using body class)
const isDarkModeActive = () => document.body.classList.contains('dark-mode');

function PointOfSale() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [total, setTotal] = useState<number>(0);
    const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [amountReceived, setAmountReceived] = useState<string>("");
    const [change, setChange] = useState<number>(0);
    const productListRef = useRef<HTMLDivElement>(null);
    const [outOfStockNotification, setOutOfStockNotification] = useState<string[]>([]);
    const [discountPercent, setDiscountPercent] = useState<string>("");
    const [taxPercent, setTaxPercent] = useState<string>("");

    // Receipt modal states
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<{
        receiptNumber: string;
        date: string;
        items: { id: number; name: string; quantity: number; price: number }[];
        subTotal: number;
        discountPercent: string;
        discountAmount: number;
        taxPercent: string;
        taxAmount: number;
        totalAmount: number;
        amountReceived: number;
        change: number;
    } | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Authentication check
        if (!localStorage.getItem("adminToken")) {
            navigate("/admin");
        }

        // Load purchase history from local storage
        const storedPurchases = localStorage.getItem("purchaseHistory");
        if (storedPurchases) {
            const parsedPurchases: Purchase[] = JSON.parse(storedPurchases);
            const updatedPurchases = parsedPurchases.map(purchase => ({
                ...purchase,
                total: typeof purchase.total === 'string' ? parseFloat(purchase.total) : purchase.total
            }));
            setPurchaseHistory(updatedPurchases);
        }

        // Fetch products from API
        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/inventory');
                const products = response.data.map((item: any) => ({
                    id: item.id,
                    name: item.product_name,
                    price: parseFloat(item.price),
                    stock: item.quantity,
                    image: item.image_path ? `http://localhost:8000${item.image_path}` : null,
                    category: item.category
                }));
                setProducts(products);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();

        // Fetch categories from API
        const fetchCategories = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/categories');
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, [navigate]);

    useEffect(() => {
        // Update total and save cart to local storage
        setTotal(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    const handleAddToCart = (product: Product) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        setIsCartOpen(true); // Open the cart when an item is added
    };

    const handleQuantityChange = (productId: number, quantity: number) => {
        setCart(cart.map(item =>
            item.id === productId && quantity >= 1 && quantity <= item.stock ? { ...item, quantity } : item
        ));
    };

    const handleRemoveFromCart = (productId: number) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const handleCheckout = async () => {
        if (cart.length > 0) {
            try {
                // Store purchase history
                const purchaseData = {
                    items: cart.map(item => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    total_amount: totalAmount,
                    amount_received: parseFloat(amountReceived),
                    change: change
                };

                console.log('Sending purchase data:', purchaseData);

                const response = await axios.post('http://localhost:8000/api/purchase-history', purchaseData);
                console.log('Purchase response:', response.data);

                if (response.status === 201) {
                    // Save receipt data for modal
                    setReceiptData({
                        receiptNumber: response.data.purchase_id,
                        date: new Date().toLocaleString(),
                        items: cart.map(item => ({
                            id: item.id,
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price
                        })),
                        subTotal: subTotal,
                        discountPercent: discountPercent,
                        discountAmount: discountAmount,
                        taxPercent: taxPercent,
                        taxAmount: taxAmount,
                        totalAmount: totalAmount,
                        amountReceived: parseFloat(amountReceived),
                        change: changeAmount
                    });
                    setIsReceiptModalOpen(true);

                    // Check for low stock items
                    const lowStockItems = cart.filter(item => {
                        const product = products.find(p => p.id === item.id);
                        return product && (product.stock - item.quantity) < 5;
                    });

                    console.log('Low stock items:', lowStockItems);

                    // Update product stock and show notifications
                    const updatedProducts = products.map(product => {
                        const cartItem = cart.find(item => item.id === product.id);
                        if (cartItem) {
                            const newStock = Math.max(0, product.stock - cartItem.quantity);
                            if (newStock < 5) {
                                console.log('Setting notification for low stock:', product.name);
                                setOutOfStockNotification(prev => {
                                    // Prevent duplicate notifications for the same item in a single transaction
                                    if (!prev.some(msg => msg.includes(`${product.name} is now low in stock!`))) {
                                        return [...prev, `${product.name} is now low in stock! (Stock: ${newStock})`];
                                    }
                                    return prev;
                                });
                            }
                            return { ...product, stock: newStock };
                        }
                        return product;
                    });
                    setProducts(updatedProducts);
                    setCart([]);
                    setIsCartOpen(false);
                    setAmountReceived("");
                    setDiscountPercent("");
                    setTaxPercent("");

                    // Clear notifications after 5 seconds
                    setTimeout(() => {
                        console.log('Clearing notifications');
                        setOutOfStockNotification([]);
                    }, 5000);
                }
            } catch (error: any) {
                console.error('Error processing checkout:', error);
                if (error.response) {
                    console.error('Error response:', error.response.data);
                    alert(`Error processing checkout: ${error.response.data.message || 'Unknown error'}`);
                } else {
                    alert('Error processing checkout. Please try again.');
                }
            }
        }
    };

    const handleCategoryClick = (categoryName: string | null) => {
        setSelectedCategory(categoryName);
        setTimeout(() => {
            productListRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const toggleCart = () => {
        setIsCartOpen(!isCartOpen);
    };

    const filteredProducts = products.filter((product) => {
        if (selectedCategory === null) {
            return true;
        }
        return product.category === selectedCategory;
    }).filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Checkout Summary Calculations ---
    const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountRate = discountPercent !== '' ? parseFloat(discountPercent) / 100 : 0;
    const discountAmount = subTotal * discountRate;
    const afterDiscount = subTotal - discountAmount;
    const taxRate = taxPercent !== '' ? parseFloat(taxPercent) / 100 : 0;
    const taxAmount = afterDiscount * taxRate;
    const totalAmount = afterDiscount + taxAmount;
    const changeAmount = amountReceived !== '' ? Number(amountReceived) - totalAmount : 0;
    const isValidChange = amountReceived !== '' && Number(amountReceived) >= totalAmount;
    // --- End Checkout Summary Calculations ---

    const handleAmountReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmountReceived(e.target.value);
    };

    // Print receipt function
    const handlePrintReceipt = () => {
        const printContent = receiptRef.current;
        if (printContent) {
            const printWindow = window.open('', '', 'height=600,width=400');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Receipt - Troy-Dean MotorParts</title>');
                printWindow.document.write('<style>');
                printWindow.document.write(`
                    body { font-family: 'Courier New', monospace; padding: 20px; margin: 0; }
                    .receipt-container { max-width: 400px; margin: 0 auto; }
                    .store-name { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 5px; }
                    .store-address { text-align: center; font-size: 12px; margin-bottom: 15px; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .receipt-info { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
                    .items-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px; }
                    .item-row { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; }
                    .item-row .name { flex: 2; }
                    .item-row .qty { flex: 0.5; text-align: center; }
                    .item-row .price { flex: 1; text-align: right; }
                    .item-row .subtotal { flex: 1; text-align: right; }
                    .totals { margin-top: 10px; }
                    .total-row { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; }
                    .total-row.final { font-weight: bold; font-size: 14px; }
                    .success-message { text-align: center; font-weight: bold; color: green; margin-top: 15px; font-size: 14px; }
                    .thank-you { text-align: center; margin-top: 15px; font-size: 12px; }
                `);
                printWindow.document.write('</style></head><body>');
                printWindow.document.write(printContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }
        }
    };

    // Download receipt as PNG function
    const handleDownloadReceipt = async () => {
        if (receiptRef.current) {
            try {
                const canvas = await html2canvas(receiptRef.current, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                });
                const link = document.createElement('a');
                link.download = `receipt-${receiptData?.receiptNumber || 'unknown'}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (error) {
                console.error('Error generating receipt image:', error);
                alert('Failed to download receipt. Please try again.');
            }
        }
    };

    // Close receipt modal
    const handleCloseReceipt = () => {
        setIsReceiptModalOpen(false);
        setReceiptData(null);
    };

    // Function to detect if dark mode is active (example using body class)
    const isDarkModeActive = () => document.body.classList.contains('dark-mode');

    return (
        <>
            <Header onLogout={() => {
                localStorage.removeItem("adminToken");
                navigate("/admin");
            }} />
            <Sidemenu onLogout={() => {
                localStorage.removeItem("adminToken");
                navigate("/admin");
            }} />
            {/* Out of Stock Notifications */}
            {outOfStockNotification.length > 0 && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col items-center">
                    {outOfStockNotification.map((message, index) => (
                        <div
                            key={index}
                            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-2 rounded shadow-lg animate-fade-in"
                            role="alert"
                            style={{
                                minWidth: '250px',
                                maxWidth: '90%',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                animation: 'slideIn 0.5s ease-out'
                            }}
                        >
                            <p className="font-bold text-base">⚠️ Warning!</p>
                            <p className="text-sm">{message}</p>
                        </div>
                    ))}
                </div>
            )}
            <style>
                {`
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    .animate-fade-in {
                        animation: slideIn 0.5s ease-out;
                    }
                `}
            </style>
            <div
                className={`main-content app-content p-2 sm:p-6 transition-all duration-300`}
                style={{ marginRight: isCartOpen && window.innerWidth >= 640 ? '24rem' : '0' }}
            >
                <div className="container-fluid">
                    <Breadcrumb
                        title="Buy/Purchase"
                        links={[
                            { text: "Dashboard", link: "/dashboard" },
                            { text: "POS", link: "/pos" },
                        ]}
                    />
                    <div className="mt-4 sm:mt-8">
                        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4 text-left text-black">Categories</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-4 mb-4 sm:mb-6">
                            {categories.map((category) => {
                                const imageUrl = category.image_path
                                    ? (category.image_path.startsWith('http')
                                        ? category.image_path
                                        : `http://localhost:8000${category.image_path}`)
                                    : '/images/pos-system/default_category.png';
                                return (
                                    <button
                                        key={category.id}
                                        className={`bg-white border rounded-lg shadow-lg p-2 sm:p-4 text-center cursor-pointer ${selectedCategory === category.name ? 'bg-sky-500 text-white' : 'text-black'
                                            } ${isDarkModeActive() && category.name === "Brake Parts" ? 'text-black' : ''}
                                           ${isDarkModeActive() && category.name === "Accessories Parts" ? 'text-black' : ''}
                                        `}
                                        onClick={() => handleCategoryClick(category.name)}
                                    >
                                        <img src={imageUrl} alt={category.name} className="w-8 h-8 sm:w-12 sm:h-12 mx-auto object-cover rounded-md" />
                                        <h3 className={`mt-1 sm:mt-2 text-xs sm:text-sm font-semibold ${selectedCategory === category.name ? 'text-white' : 'text-black'
                                            } ${isDarkModeActive() && category.name === "Brake Parts" ? 'text-black' : ''}
                                           ${isDarkModeActive() && category.name === "Accessories Parts" ? 'text-black' : ''}
                                        `}>{category.name}</h3>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mb-2 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h2 className="text-lg sm:text-xl font-semibold text-black">Items List</h2>
                            <button
                                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 w-40"
                                onClick={toggleCart}
                            >
                                View Cart →
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full p-2 sm:p-3 border rounded-md mb-2 sm:mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-black"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div ref={productListRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                            {filteredProducts.map((product) => {
                                const cartItem = cart.find(item => item.id === product.id);
                                return (
                                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} cartQuantity={cartItem?.quantity || 0} />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {/* Cart Modal/Sidebar (responsive) */}
            <div
                className={`fixed top-0 right-0 h-screen bg-white shadow-lg p-2 sm:p-6 z-50 transition-transform duration-300 transform flex flex-col`}
                style={{
                    top: '56px',
                    width: window.innerWidth < 640 ? '100vw' : '24rem',
                    maxWidth: '100vw',
                    transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)',
                }}
            >
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <h2 className="font-semibold flex items-center text-blue-500 text-black" style={{ fontSize: '1.3rem' }}>
                        <FaShoppingCart className="mr-2" /> Cart
                    </h2>
                    <button onClick={toggleCart} className="bg-sky-500 text-white hover:bg-sky-700 focus:outline-none p-1 rounded-full w-6 h-6 flex items-center justify-center">
                        <FaTimes className="w-3 h-3" />
                    </button>
                </div>
                {cart.length === 0 ? (
                    <p className="text-gray-500 text-black">Cart is empty.</p>
                ) : (
                    <div className="space-y-2 sm:space-y-3 mb-2 sm:mb-4 overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                        {cart.map((item) => (
                            <SidebarCartItem
                                key={item.id}
                                item={item}
                                onQuantityChange={handleQuantityChange}
                                onRemoveFromCart={handleRemoveFromCart}
                            />
                        ))}
                    </div>
                )}
                {cart.length > 0 && (
                    <div style={{ position: 'sticky', bottom: 0, backgroundColor: '#fff', padding: '8px 12px', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '11px', fontWeight: '500', color: '#000' }}>
                            {/* Subtotal */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span>Subtotal:</span>
                                <span style={{ fontWeight: '700' }}>₱{subTotal.toFixed(2)}</span>
                            </div>

                            {/* Discount */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span>Discount:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#6b7280', fontSize: '10px' }}>%</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={discountPercent}
                                        onChange={(e) => setDiscountPercent(e.target.value)}
                                        style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', width: '50px', textAlign: 'right', fontSize: '11px', color: '#000' }}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Discount Amount */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span>Discount Amount:</span>
                                <span style={{ color: '#dc2626', fontWeight: '600' }}>-₱{discountAmount.toFixed(2)}</span>
                            </div>

                            {/* Tax */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span>Tax (%):</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={taxPercent}
                                    onChange={(e) => setTaxPercent(e.target.value)}
                                    style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', width: '50px', textAlign: 'right', fontSize: '11px', color: '#000' }}
                                    placeholder="0"
                                />
                            </div>

                            {/* Tax Amount */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontStyle: 'italic' }}>Tax Amount:</span>
                                <span style={{ color: '#2563eb', fontWeight: '600', fontStyle: 'italic' }}>+₱{taxAmount.toFixed(2)}</span>
                            </div>

                            {/* Total - highlighted */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #d1d5db' }}>
                                <span>Total:</span>
                                <span>₱{totalAmount.toFixed(2)}</span>
                            </div>

                            {/* Amount Received */}
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-black">Amount Received:</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={amountReceived}
                                    onChange={handleAmountReceivedChange}
                                    className="border rounded px-2 py-1 w-24 text-right text-black"
                                    placeholder="₱0"
                                />
                            </div>

                            {/* Change */}
                            {amountReceived !== '' && (
                                <div className="flex justify-between items-center">
                                    <span className="text-black font-semibold">Change:</span>
                                    <span className={`font-bold ${changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₱{changeAmount.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 mt-3">
                            <button
                                className={`bg-blue-200 text-blue-700 py-1 sm:py-2 rounded-md w-1/2 font-semibold ${(cart.length === 0 || (amountReceived !== '' && Number(amountReceived) < totalAmount)) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || (amountReceived !== '' && Number(amountReceived) < totalAmount)}
                            >
                                Buy
                            </button>
                            <button
                                className="bg-blue-200 text-blue-700 py-1 sm:py-2 rounded-md w-1/2 font-semibold"
                                onClick={toggleCart}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* Purchase History (Initially Hidden or on a separate tab) */}
            {/* ... Purchase History Section ... */}

            {/* Receipt Success Modal */}
            {isReceiptModalOpen && receiptData && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10001,
                        padding: '20px'
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            maxWidth: '450px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '16px 20px',
                            borderRadius: '12px 12px 0 0',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '4px' }}>✓</div>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Transaction Successful!</h2>
                        </div>

                        {/* Receipt Content */}
                        <div ref={receiptRef} style={{ padding: '20px', backgroundColor: 'white' }}>
                            <div className="receipt-container">
                                {/* Store Header */}
                                <div className="store-name" style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: '#1f2937' }}>
                                    Troy-Dean MotorParts
                                </div>
                                <div className="store-address" style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', marginBottom: '12px' }}>
                                    Your Trusted Auto Parts Store
                                </div>

                                <div className="divider" style={{ borderTop: '1px dashed #d1d5db', margin: '12px 0' }}></div>

                                {/* Receipt Info */}
                                <div className="receipt-info" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#374151' }}>
                                    <span>Receipt No:</span>
                                    <span style={{ fontWeight: '600' }}>{receiptData.receiptNumber}</span>
                                </div>
                                <div className="receipt-info" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#374151' }}>
                                    <span>Date:</span>
                                    <span>{receiptData.date}</span>
                                </div>

                                <div className="divider" style={{ borderTop: '1px dashed #d1d5db', margin: '12px 0' }}></div>

                                {/* Items Header */}
                                <div className="items-header" style={{ display: 'flex', fontSize: '11px', fontWeight: '600', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb', marginBottom: '8px', color: '#374151' }}>
                                    <span style={{ flex: 2 }}>Item</span>
                                    <span style={{ flex: 0.5, textAlign: 'center' }}>Qty</span>
                                    <span style={{ flex: 1, textAlign: 'right' }}>Price</span>
                                    <span style={{ flex: 1, textAlign: 'right' }}>Subtotal</span>
                                </div>

                                {/* Items List */}
                                {receiptData.items.map((item, index) => (
                                    <div key={index} className="item-row" style={{ display: 'flex', fontSize: '11px', marginBottom: '4px', color: '#4b5563' }}>
                                        <span style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                        <span style={{ flex: 0.5, textAlign: 'center' }}>{item.quantity}</span>
                                        <span style={{ flex: 1, textAlign: 'right' }}>₱{item.price.toFixed(2)}</span>
                                        <span style={{ flex: 1, textAlign: 'right' }}>₱{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}

                                <div className="divider" style={{ borderTop: '1px dashed #d1d5db', margin: '12px 0' }}></div>

                                {/* Totals */}
                                <div className="totals">
                                    <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#374151' }}>
                                        <span>Subtotal:</span>
                                        <span>₱{receiptData.subTotal.toFixed(2)}</span>
                                    </div>
                                    {receiptData.discountPercent && parseFloat(receiptData.discountPercent) > 0 && (
                                        <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#ef4444' }}>
                                            <span>Discount ({receiptData.discountPercent}%):</span>
                                            <span>-₱{receiptData.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {receiptData.taxPercent && parseFloat(receiptData.taxPercent) > 0 && (
                                        <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#374151' }}>
                                            <span>Tax ({receiptData.taxPercent}%):</span>
                                            <span>+₱{receiptData.taxAmount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="divider" style={{ borderTop: '1px solid #374151', margin: '8px 0' }}></div>

                                    <div className="total-row final" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#1f2937' }}>
                                        <span>TOTAL:</span>
                                        <span>₱{receiptData.totalAmount.toFixed(2)}</span>
                                    </div>

                                    <div className="divider" style={{ borderTop: '1px solid #374151', margin: '8px 0' }}></div>

                                    <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#374151' }}>
                                        <span>Amount Received:</span>
                                        <span>₱{receiptData.amountReceived.toFixed(2)}</span>
                                    </div>
                                    <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#10b981' }}>
                                        <span>Change:</span>
                                        <span>₱{receiptData.change.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="divider" style={{ borderTop: '1px dashed #d1d5db', margin: '12px 0' }}></div>

                                {/* Thank You Message */}
                                <div className="thank-you" style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                                    Thank you for your purchase!
                                    <br />
                                    Please come again.
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                onClick={handlePrintReceipt}
                                style={{
                                    flex: 1,
                                    minWidth: '100px',
                                    padding: '10px 16px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                🖨️ Print
                            </button>
                            <button
                                onClick={handleDownloadReceipt}
                                style={{
                                    flex: 1,
                                    minWidth: '100px',
                                    padding: '10px 16px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                📥 Download PNG
                            </button>
                        </div>
                        <div style={{ padding: '0 20px 16px 20px' }}>
                            <button
                                onClick={handleCloseReceipt}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default PointOfSale;