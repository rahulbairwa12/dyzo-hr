import React from "react";

function DesktopLoginSuccess() {
    const handleGoToDesktop = () => {
        window.location.href = `dyzo-fiddle://`;
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center text-center py-20 dark:bg-slate-900">
            <div className="max-w-md mx-auto w-full mt-12 p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <h4 className="text-3xl font-bold mb-4">Successfully Connected to Desktop!</h4>
                <p className="text-lg font-light mb-8">Your integration with desktop is now active. You can start using Slack features seamlessly.</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={handleGoToDesktop}
                        className="btn btn-dark dark:bg-slate-800 block text-center px-6 py-3 rounded-lg text-white hover:bg-slate-700 transition"
                    >
                        Go to Desktop
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DesktopLoginSuccess;
