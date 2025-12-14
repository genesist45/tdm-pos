import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { Eye, EyeOff } from 'lucide-react';

interface AdminLoginForm {
    email: string;
    password: string;
}

const AdminLogin = () => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm<AdminLoginForm>();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const navigate = useNavigate();
    const passwordValue = watch("password", "");

    // Mock Admin Credentials
    const mockEmail = "admin@example.com";
    const mockPassword = "password123";

    // Handle navigation after successful login
    useEffect(() => {
        if (loginSuccess) {
            navigate("/dashboard");
        }
    }, [loginSuccess, navigate]);

    const onSubmit = async (data: AdminLoginForm) => {
        setLoading(true);
        setErrorMessage(null);

        // Simulating Backend Authentication
        setTimeout(() => {
            if (data.email === mockEmail && data.password === mockPassword) {
                // Store Fake Token
                localStorage.setItem("adminToken", "mocked_token");
                console.log("Token set in AdminLogin: ", localStorage.getItem("adminToken"));
                setLoginSuccess(true); // Trigger navigation via useEffect
            } else {
                setErrorMessage("Invalid email or password");
            }

            setLoading(false);
        }, 1000); // Simulate a network delay
    };

    return (
        <div className="admin-login-container">
            <div className="form">
                <h2>Admin Login</h2>

                {errorMessage && <p className="error">{errorMessage}</p>}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="input-group">
                        <input
                            type="email"
                            id="email"
                            placeholder=" "
                            {...register("email", { required: "Email is required" })}
                        />
                        <label htmlFor="email">
                            <FontAwesomeIcon icon={faEnvelope} className="input-icon" /> Email / Username
                        </label>
                        {errors.email && <p className="error">{errors.email.message}</p>}
                    </div>

                    <div className="input-group" style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            placeholder=" "
                            {...register("password", { required: "Password is required" })}
                            style={{ paddingRight: '40px' }}
                        />
                        <label htmlFor="password">
                            <FontAwesomeIcon icon={faLock} className="input-icon" /> Password
                        </label>
                        {passwordValue && passwordValue.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#666',
                                    padding: '4px',
                                    zIndex: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 'auto',
                                    height: 'auto',
                                    margin: 0,
                                    boxShadow: 'none',
                                    outline: 'none'
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        )}
                        {errors.password && <p className="error">{errors.password.message}</p>}
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Log in"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;