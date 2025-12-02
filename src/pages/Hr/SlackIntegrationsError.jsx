import React from "react";
import { Link } from "react-router-dom";
import DyzoLogo from "@/assets/images/logo/dyzoLogo.svg";
import SlackLogo from "@/assets/images/common/Slack-logo.png";
import { Icon } from "@iconify/react";

function SlackIntegrationError() {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center text-center py-20 dark:bg-slate-900">
            <div className="flex items-center space-x-4">
                <img src={DyzoLogo} alt="Dyzo Logo" className="w-32 h-32" />
                <Icon icon="mdi:lan-disconnect" width="48" height="48" className="text-red-600" />
                <img src={SlackLogo} alt="Slack Logo" className="w-32 h-20" />
            </div>
            <div className="max-w-md mx-auto w-full mt-12 p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <h4 className="text-3xl font-bold text-red-600 mb-4">Connection Failed!</h4>
                <p className="text-lg font-light dark:text-gray-300 mb-8">
                    We could not connect Dyzo to Slack. Please try again or contact support if the issue persists.
                </p>
                <div className="flex justify-center space-x-4">
                    <Link
                        to="/"
                        className="btn btn-dark dark:bg-slate-800 block text-center px-6 py-3 rounded-lg text-white hover:bg-slate-700 transition"
                    >
                        Go to Homepage
                    </Link>
                    <a
                        href="https://slack.com/help"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-dark dark:bg-slate-800 block text-center px-6 py-3 rounded-lg text-white hover:bg-slate-700 transition"
                    >
                        Get Help
                    </a>
                </div>
            </div>
        </div>
    );
}

export default SlackIntegrationError;
