import React from "react";
import { Link } from "react-router-dom";
import DyzoLogo from "@/assets/images/logo/dyzoLogo.svg";
import SlackLogo from "@/assets/images/common/Slack-logo.png";
import { Icon } from "@iconify/react";

function SlackIntegrationSuccess() {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center text-center py-20 dark:bg-slate-900">
            <div className="flex items-center space-x-4">
                <img src={DyzoLogo} alt="Dyzo Logo" className="w-32 h-32" />
                <Icon icon="hugeicons:connect" width="48" height="48" />
                <img src={SlackLogo} alt="Slack Logo" className="w-32 h-20" />
            </div>
            <div className="max-w-md mx-auto w-full mt-12 p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <h4 className="text-3xl font-bold mb-4">Successfully Connected to Slack!</h4>
                <p className="text-lg font-light mb-8">Your integration with Slack is now active. You can start using Slack features seamlessly.</p>
                <div className="flex justify-center space-x-4">
                    <Link
                        to="/"
                        className="btn btn-dark dark:bg-slate-800 block text-center px-6 py-3 rounded-lg text-white hover:bg-slate-700 transition"
                    >
                        Homepage
                    </Link>
                    <a
                        href="https://slack.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-dark dark:bg-slate-800 block text-center px-6 py-3 rounded-lg text-white hover:bg-slate-700 transition"
                    >
                        Go to Slack
                    </a>
                </div>
            </div>
        </div>
    );
}

export default SlackIntegrationSuccess;
