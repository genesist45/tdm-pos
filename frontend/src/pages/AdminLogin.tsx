import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

interface AdminLoginForm {
    email: string;
    password: string;
}

const AdminLogin = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginForm>();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
    const navigate = useNavigate();

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

                    <div className="input-group">
                        <input
                            type="password"
                            id="password"
                            placeholder=" "
                            {...register("password", { required: "Password is required" })}
                        />
                        <label htmlFor="password">
                            <FontAwesomeIcon icon={faLock} className="input-icon" /> Password
                        </label>
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