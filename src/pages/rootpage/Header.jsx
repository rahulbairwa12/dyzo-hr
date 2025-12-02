import React, { useState } from 'react';
import { Icon } from "@iconify/react";
import dyzoLogo from './images/dyzoLogo.svg';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './style.css'
import Tooltip from '@/components/ui/Tooltip';

const Header = () => {

    const [isMobileNavOpen, setMobileNavOpen] = useState(false);

    const toggleMobileNav = () => {
        setMobileNavOpen(!isMobileNavOpen);
    };

    const closeMobileNav = () => {
        setMobileNavOpen(false);
    };

    const navigate = useNavigate();

    return (
        <header className="headerBox w-full sticky top-0 z-50">
            <div className="max-w-[1320px] mx-auto flex lg:flex-row items-center justify-between">

                <div className="flex items-center mb-4 lg:mb-0 cursor-pointer" onClick={() => navigate('/')}>
                    <img src={dyzoLogo} width="96px" height="32px" alt="DYZO" onClick={() => window.location.reload()} />
                </div>

                <div className="hidden lg:flex justify-center space-x-8 flex-1">
                    <a href="#features" className="text-black font-semibold hover:underline dark:text-black-500">Features</a>
                    <a href="#insights" className="text-black font-semibold hover:underline dark:text-black-500">Insights</a>
                    <Link to="/plans" className="text-black font-semibold hover:underline dark:text-black-500">Pricing</Link>
                </div>


                <div className="hidden lg:flex justify-end items-center space-x-5">
                    <Link to="/login" className="text-black font-semibold hover:underline dark:text-black-500">Log In</Link>
                    <Link to="/register" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500 transition">Get Started</Link>
                    <Tooltip
              key="BookDemoIcon"
              title="Book a Demo"
              content="Schedule a demo with us"
              placement="top"
              className="btn btn-outline-dark"
              arrow
              animation="shift-away"
            >
              <div className="relative">
                <a
                  href="https://calendly.com/tushar-46/dyzo-ai-demo-call"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 p-2 rounded-md cursor-pointer add-project-btn btn-dark dark:bg-slate-800 text-sm font-normal"
                >
                  <Icon icon="heroicons-outline:calendar" className="w-5 h-5 text-white" />
                  <span className="hidden md:inline">Book Demo</span>
                </a>
              </div>
            </Tooltip>
                </div>


                <button className="lg:hidden" onClick={toggleMobileNav} aria-label="Open Menu">
                    <Icon icon="radix-icons:hamburger-menu" className='w-6 h-6 cursor-pointer text-black' />
                </button>
            </div>


            <nav className={`fixed top-0 left-0 w-[250px] h-full bg-white shadow-xl z-50 transition-transform transform ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden`}>
                <div className="flex justify-between items-center p-5 border-b border-gray-300">
                    <img src={dyzoLogo} width="96px" height="32px" alt="DYZO" />
                    <button onClick={closeMobileNav}>
                        <Icon icon="bitcoin-icons:cross-outline" className='w-6 h-6 cursor-pointer text-gray-500' />
                    </button>
                </div>

                <div className="flex flex-col p-5 space-y-5">
                    <a href="#features" className="text-gray-700 font-bold dark:text-black-500" onClick={closeMobileNav}>Features</a>
                    <a href="#insights" className="text-gray-700 font-bold dark:text-black-500" onClick={closeMobileNav}>Insights</a>
                    <a href="/contactus" className="text-gray-700 font-bold dark:text-black-500" onClick={closeMobileNav}>Contact Us</a>
                    <Link to="/plans" className="text-black font-semibold hover:underline dark:text-black-500">Pricing</Link>

                    <a href="/login" className="bg-gray-200 text-gray-800 py-2 px-4 rounded text-center" onClick={closeMobileNav}>Login</a>
                    <a href="/register" className="bg-blue-600 text-white py-2 px-4 rounded text-center hover:bg-blue-500 transition" onClick={closeMobileNav}>Create Account</a>
                </div>
            </nav>
        </header>
    );
}

export default Header;
