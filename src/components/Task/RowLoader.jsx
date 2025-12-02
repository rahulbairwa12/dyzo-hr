import React from "react";

const RowLoader = ({ loading }) => {
    return (
        loading && (
            <div className="flex justify-center items-center">
                <div className="w-full mt-[-1px] bg-gray-200 overflow-x-auto relative rounded-lg shadow-lg horizontal_rule">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-700 animate-scroll rounded-lg"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-semibold">
                    </div>
                </div>
            </div>
        )
    );
};

export default RowLoader;
