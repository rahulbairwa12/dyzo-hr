import React from "react";
import SimpleBar from "simplebar-react";
import useWidth from "@/hooks/useWidth";
// Import your components
import Semidark from "../partials/settings/Tools/Semidark";
import RtlSwicth from "../partials/settings/Tools/Rtl";
import Skin from "../partials/settings/Tools/Skin";
import Theme from "../partials/settings/Tools/Theme";
import ContentWidth from "../partials/settings/Tools/ContentWidth";
import Menulayout from "../partials/settings/Tools/Menulayout";
import MenuClose from "../partials/settings/Tools/MenuClose";
import MenuHidden from "../partials/settings/Tools/MenuHidden";
import NavbarType from "../partials/settings/Tools/NavbarType";
import FooType from "../partials/settings/Tools/FooterType";
const DyzoCustomizer = () => {
  const { width, breakpoints } = useWidth();
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="translate-x-0 opacity-100 visible">
        <SimpleBar className="h-[calc(100vh-120px)]">
          <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-900">
            <div>
              <span className="block text-2xl font-bold text-slate-800 dark:text-white">
                Dyzo Customizer
              </span>
              <span className="block text-sm text-slate-600 dark:text-slate-300 mt-1">
                Customize your dashboard in real-time
              </span>
            </div>
            <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-500 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </header>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                  Theme Settings
                </h3>
                <div className="space-y-4">
                  <Skin />
                  <Theme />
                  <Semidark />
                </div>
              </div>
            </div>
          </div>
        </SimpleBar>
      </div>
    </div>
  );
};
export default DyzoCustomizer;
