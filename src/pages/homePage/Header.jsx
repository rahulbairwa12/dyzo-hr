import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "./images/dyzoLogo.svg";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow-deep px-6 md:px-10 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-[1440px] mx-auto">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img
            src={logo}
            width="96"
            height="32"
            alt="DYZO Logo"
            className="cursor-pointer"
          />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-12">
          <a
            href="/#features"
            className="text-gray-700 text-base font-medium hover:text-blue-600 transition"
          >
            Features
          </a>
          <a
            href="/#insights"
            className="text-gray-700 text-base font-medium hover:text-blue-600 transition"
          >
            Insights
          </a>
          <a
            href="/pricing"
            className="text-gray-700 text-base font-medium hover:text-blue-600 transition"
          >
            Pricing
          </a>
          <a
            href="/#workspace"
            className="text-gray-700 text-base font-medium hover:text-blue-600 transition"
          >
            Workspace
          </a>
          <a
            href="https://blog.dyzo.ai/"
            className="text-gray-700 text-base font-medium hover:text-blue-600 transition"
          >
            Blogs
          </a>
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/login"
            className="text-gray-700 text-base font-medium hover:text-blue-600 transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-xl bg-blue-600 text-white text-base font-medium shadow hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-5 md:hidden">
          <Link
            to="/login"
            className="px-4 py-1 rounded-lg border border-blue-600 text-blue-600 text-base font-medium shadow transition"
          >
            Login
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700"
          >
            <Icon
              icon={isOpen ? "mdi:close" : "mdi:menu"}
              className="text-3xl"
            />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="md:hidden mt-8 flex flex-col space-y-4 "
          >
            <a
              href="/#features"
              className="text-gray-700 text-base font-medium hover:text-blue-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Features
            </a>
            <a
              href="/#insights"
              className="text-gray-700 text-base font-medium hover:text-blue-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Insights
            </a>
            <a
              href="/pricing"
              className="text-gray-700 text-base font-medium hover:text-blue-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </a>
            <a
              href="/#workspace"
              className="text-gray-700 text-base font-medium hover:text-blue-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Workspace
            </a>
            <a
              href="https://blog.dyzo.ai/"
              className="text-gray-700 text-base font-medium hover:text-blue-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Blogs
            </a>
            <Link
              to="/register"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-base font-medium shadow hover:bg-blue-700 transition text-center"
              onClick={() => setIsOpen(false)}
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
