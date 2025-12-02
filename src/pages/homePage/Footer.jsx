import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import logo from "./images/dyzoLogo.svg";

const Footer = () => {
  return (
    <footer className="bg-gray-100 px-0 pt-8 md:pt-16 pb-8">
      {/* Top Logo */}
      <div className="md:bg-white md:border-b">
        <div className="flex max-w-[1440px] mx-auto flex-wrap items-center justify-center md:justify-between px-6 py-4 ">
            <Link to="/" className="flex items-center">
            <img
                src={logo}
                width="72"
                height="24"
                alt="DYZO Logo"
                className="cursor-pointer"
            />
            </Link>
            <span className="text-[#A1A1A1] hidden md:inline text-xl">|</span>
            <div className="items-center gap-2 hidden md:flex">
            <Icon icon="streamline-plump:customer-support-3-remix" className="text-2xl" />
            <span className="text-sm font-semibold">24/7 Support</span>
            </div>
            <span className="text-[#A1A1A1] hidden md:inline text-xl">|</span>
            <div className="items-center gap-2 hidden md:flex">
            <Icon icon="ix:app-update" className="text-2xl" />
            <span className="text-sm font-semibold">Weekly Update</span>
            </div>
            <span className="text-[#A1A1A1] hidden md:inline text-xl">|</span>
            <div className="items-center gap-2 hidden md:flex">
            <Icon icon="gala:secure" className="text-2xl" />
            <span className="text-sm font-semibold">Secure & Compliant</span>
            </div>
            <span className="text-[#A1A1A1] hidden md:inline text-xl">|</span>
            <div className="items-center gap-2 hidden md:flex">
            <Icon icon="lucide:clock-arrow-up" className="text-2xl" />
            <span className="text-sm font-semibold">99.9% Uptime</span>
            </div>
        </div>
      </div>

      {/* Middle  */}
      <div className="flex max-w-[1440px] mx-auto px-6 justify-between my-4 md:my-8 flex-wrap gap-5">
        <div>
            <div className="font-semibold mb-2 text-sm text-gray-900 text-start">Quick Links</div>
            <ul className="space-y-2 text-sm text-start">
                {/* <li className="hover:text-gray-900"><Link to="/">About Us</Link></li> */}
                <li className="hover:text-gray-900"><Link to="/pricing">Pricing</Link></li>
                <li className="hover:text-gray-900"><a href="/#features">Features</a></li>
                <li className="hover:text-gray-900">
                    <Link
                        to="/changelog"
                        onClick={() => window.scrollTo(0, 0)}   // ← scroll to top on navigation
                    >
                        What's New!
                    </Link>
                </li>
            </ul>
            <Link to="/register" className="px-5 md:px-6 py-2.5 inline-block rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition text-sm md:text-base mt-5 mb-1">
                Get Started For Free
            </Link>
            <p className="text-xs text-gray-500 font-semibold text-start">No credit card required.</p>
        </div>

        <div>
            <div className="font-semibold mb-2 text-sm text-gray-900 text-start">Resources</div>
            <ul className="space-y-2 text-sm text-start">
                <li className="hover:text-gray-900"><a href="https://blog.dyzo.ai/">Blog</a></li>
            </ul>
        </div>

        <div>
            <div className="font-semibold mb-2 text-sm text-gray-900 text-start">Support</div>
            <ul className="space-y-2 text-sm text-start">
                {/* <li className="hover:text-gray-900"><Link to="/">Help Center</Link></li> */}
                <li className="hover:text-gray-900"><Link to="/contactus">Contact Us</Link></li>
                <li className="hover:text-gray-900"><a href="/#FAQs">FAQs</a></li>
            </ul>
        </div>

        <div>
            <div className="font-semibold mb-2 text-sm text-gray-900 text-start">Follow Us</div>
            <ul className="space-y-2 flex items-end gap-4">
                {/* <li className="group">
                <a href="/" title="Linkedin" target="_blank">
                    <Icon
                    icon="ri:linkedin-fill"
                    className="text-2xl p-[1px] rounded group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:via-blue-500 group-hover:to-blue-700 group-hover:text-white"
                    />
                </a>
                </li> */}
                <li className="group">
                <a href="https://www.instagram.com/dyzoai/" title="Instagram" target="_blank">
                    <Icon
                    icon="ri:instagram-line"
                    className="text-2xl p-[1px] rounded group-hover:bg-gradient-to-tr group-hover:from-yellow-400 
                    group-hover:via-pink-500 group-hover:to-purple-700 group-hover:text-white"
                    />
                </a>
                </li>
                <li className="hover:text-[#FF0000]"><a href="https://www.youtube.com/@dyzotool" title="Youtube" target="_blank"><Icon icon="ri:youtube-fill" className="text-2xl" /></a></li>
            </ul>
        </div>

        <div>
            <div className="font-semibold mb-2 text-sm text-gray-900 text-start">Contact</div>
            <ul className="space-y-2 text-sm text-start">
                <li className="hover:text-gray-900 text-sm">
                    <a href="https://maps.app.goo.gl/2tv972UMNkPKLMRu9" className="flex items-start gap-2 " target="_blank">
                        <Icon icon="heroicons:map-pin-16-solid" className="text-xl min-w-fit" /> 
                        PRP Webs, 3rd Floor, S-16, <br className="hidden md:block" />  Gulab Vihar Patrakar Colony <br className="hidden md:block" /> Main Road, Dholai, Mansarovar, <br className="hidden md:block" /> Jaipur, Rajasthan 302020
                    </a>
                </li>
                <li className="hover:text-gray-900 text-sm">
                    <a href="tel:+9188528 85766" aria-label="Call us at +91 88528 85766" title="Call us at +91 88528 85766" className="flex items-start gap-2 ">
                    <Icon icon="heroicons:phone-solid" className="text-xl min-w-fit" />
                    +91-88528 85766</a>
                </li>
                <li className="hover:text-gray-900 text-sm">
                    <a href="mailto:support@dyzo.ai" aria-label="Email us at support@dyzo.ai" title="Email us at support@dyzo.ai" className="flex items-start gap-2 ">
                    <Icon icon="heroicons:envelope-16-solid" className="text-xl min-w-fit" />
                    support@dyzo.ai</a>
                </li>
            </ul>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="max-w-[1440px] mx-auto pt-6 flex flex-col lg:flex-row justify-between items-center text-sm text-gray-600 px-6 2xl:px-0">
        {/* Left */}
        <p className="mb-4 lg:mb-0">© 2025 Dyzo, All rights reserved.</p>

        {/* Right Links */}
        <div className="flex flex-wrap justify-center items-center gap-5 md:gap-10 mb-4 md:mb-0">
          <Link to="/privacy-policy" className="hover:text-gray-900">
            Privacy Policy
          </Link>
          <Link to="/terms-and-conditions" className="hover:text-gray-900">
            Terms of Service
          </Link>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
