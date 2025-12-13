import React from "react";
import { Link } from "react-router-dom";

interface BreadcrumbProps {
    title?: string;
    links?: { text: string; link: string }[];
    active?: string;
    buttons?: React.ReactNode;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ title = "Dashboard", links = [], active = "", buttons }) => {
    const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    return (
        <div className="flex items-center justify-between page-header-breadcrumb flex-wrap gap-2">
            <div>
                <h1
                    className={`page-title font-medium text-lg mb-0 ${isDarkMode ? 'text-black !important' : 'text-gray-800'}`}
                >
                    {title}
                </h1>
                <nav>
                    <ol className="flex items-center whitespace-nowrap min-w-0 pb-2 mt-4">
                        <li className="text-sm">
                            <Link className={`flex items-center text-gray-700 hover:text-primary ${isDarkMode ? 'text-black' : ''}`} to="/dashboard">
                                <span className="bi bi-house-door"></span>
                                <span className="px-3">Home</span>
                                <span className="bi bi-chevron-right px-3 pl-0"></span>
                            </Link>
                        </li>
                        {links.map((link, index) => (
                            <li key={index} className="text-sm">
                                <Link className={`flex items-center text-gray-700 hover:text-primary ${isDarkMode ? 'text-black' : ''}`} to={link.link}>
                                    {link.text}
                                    <span className="bi bi-chevron-right px-3"></span>
                                </Link>
                            </li>
                        ))}
                        {active && (
                            <li className="text-sm">
                                <span
                                    className={`flex items-center text-gray-700 ${isDarkMode ? 'text-black' : ''}`}
                                >
                                    {active}
                                </span>
                            </li>
                        )}
                    </ol>
                </nav>
            </div>
            {buttons && <div className="btn-list">{buttons}</div>}
        </div>
    );
};

export default Breadcrumb;