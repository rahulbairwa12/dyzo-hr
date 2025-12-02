import React from "react";
import dyzoLogo  from "@/assets/images/svg/logo.svg";
import { useNavigate } from "react-router-dom";
const Header = () => {
    const navigate = useNavigate();
    return (
        <header className="w-full border-b border-gray-300 py-2 px-4">
            <div className="max-w-[1320px] mx-auto flex lg:flex-row items-center justify-between">
                <div className="flex items-center mb-4 lg:mb-0 cursor-pointer" onClick={() => navigate('/')}>
                    <img src={dyzoLogo} width="96px" height="auto" alt="DYZO" />
                </div>
            </div>
        </header>
    );
};

export default Header;