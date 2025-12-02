import React, { useState, useEffect } from 'react';
import logo from "../../assets/images/landing_page/logo.svg";
import dyzonamelogo from "../../assets/images/landing_page/dyzonamelogo.png";
import { Icon } from "@iconify/react";
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Scroll to the section if "scrollTo" is present in the state
        if (location.state?.scrollTo) {
            const element = document.getElementById(location.state.scrollTo);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
            // Clear the scroll state after scrolling
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Function to handle scrolling or navigation based on the current page
    const scrollToSection = (sectionId) => {
        if (location.pathname === '/') {
            // If on the landing page, scroll to the section
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // If on a different page, navigate to the landing page and scroll after loading
            navigate('/', { state: { scrollTo: sectionId } });
        }
        closeSidebar(); // Close the sidebar when a link is clicked
    };

    return (
        <div className="flex flex-col items-center px-4 sm:px-8 bg-cover lg:bg-contain lg:bg-no-repeat bg-black-500">
            <nav className="w-full flex justify-between items-center py-4 px-2 sm:px-8 bg-transparent max-w-[1300px]">
                <div className="flex items-center space-x-2 cursor-pointer">
                    <img src={logo} alt="logo" className="w-20 md:w-24" onClick={() => navigate('/')} />
                </div>

                <div className="sm:hidden">
                    <button
                        onClick={toggleSidebar}
                        className="focus:outline-none"
                    >
                        <Icon
                            icon="fluent:line-horizontal-3-20-filled"
                            className="w-6 h-6 cursor-pointer text-white dark:text-white"
                        />
                    </button>
                </div>

                <ul className="hidden sm:flex flex-col sm:flex-row sm:space-x-8 text-black">
                    <li>
                        <a
                            onClick={() => scrollToSection('features')}
                            className="hover:underline text-white dark:text-white cursor-pointer"
                        >
                            Features
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={() => scrollToSection('insights')}
                            className="hover:underline text-white dark:text-white cursor-pointer"
                        >
                            Insights
                        </a>
                    </li>
                    <li>
                        <a href="/contactus" className="hover:underline text-white dark:text-white">Contact Us</a>
                    </li>
                </ul>

                <div className="hidden sm:flex items-center space-x-6">
                    <Link
                        className="hover:underline cursor-pointer text-white dark:text-white"
                        to="https://calendly.com/tushar-46/dyzo-ai-demo-call"
                        target="_blank"
                    >
                        Request a demo
                    </Link>
                    <Link
                        to="/login"
                        className="hover:underline cursor-pointer text-white dark:text-white"
                    >
                        Log In
                    </Link>
                    <button
                        className="font-medium bg-[#0F6FFF] text-white px-4 py-2 rounded"
                        onClick={() => navigate("/register")}
                    >
                        Start free trial
                    </button>
                </div>
            </nav>

            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden ${isSidebarOpen ? "block" : "hidden"}`}
                onClick={closeSidebar}
            ></div>

            <div
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md z-50 transform sm:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300`}
            >
                <div className="flex justify-between items-center p-4 border-b">
                    <img src={dyzonamelogo} alt="logo" className="md:w-24" />
                    <button
                        onClick={closeSidebar}
                        className="focus:outline-none dark:text-black-500"
                    >
                        <Icon
                            icon="oui:cross"
                            className="w-6 h-6 cursor-pointer dark:text-black"
                        />
                    </button>
                </div>
                <ul className="flex flex-col space-y-4 p-4 text-black">
                    <li>
                        <a
                            onClick={() => scrollToSection('features')}
                            className="hover:underline dark:text-black-500 cursor-pointer"
                        >
                            Features
                        </a>
                    </li>
                    <li>
                        <a
                            onClick={() => scrollToSection('insights')}
                            className="hover:underline dark:text-black-500 cursor-pointer"
                        >
                            Insights
                        </a>
                    </li>
                    <li>
                        <a href="/contactus" className="hover:underline dark:text-black-500">Contact Us</a>
                    </li>
                </ul>

                <div className="flex flex-col space-y-4 p-4">
                    <button
                        className="bg-[#0F6FFF] py-2 text-center rounded-md cursor-pointer text-white"
                        onClick={() => {
                            navigate("/login");
                            closeSidebar();
                        }}
                    >
                        Login
                    </button>
                    <button
                        className="bg-[#0F6FFF] py-2 text-center rounded-md cursor-pointer text-white"
                        onClick={() => {
                            navigate("/register");
                            closeSidebar();
                        }}
                    >
                        Create Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
