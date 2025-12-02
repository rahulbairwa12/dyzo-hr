import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import useDarkMode from "@/hooks/useDarkMode";
import LoginImage from "@/assets/images/common/sign-in.webp";
import IconWhite from "@/assets/images/common/app-icon-white.png";
import Icon from "@/assets/images/common/app-icon.webp";
import Footer from "./Footer";
import Button from "@/components/ui/Button";
import ContactModal from "./ContactModal";
import Header from "./Header";

const ContactUs = () => {
    const [isDark] = useDarkMode();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    return (

        <>
            <Helmet>
                <title>Contact Us | Dyzo</title>
                <meta name="description" content="Talk to Dyzo: product questions, demos, and support. Reach us via email, phone, or schedule a demo." />
                <meta name="keywords" content="contact Dyzo, book a demo, Dyzo support, sales contact, time tracking demo, task management demo, pricing questions" />
                <meta property="og:title" content="Contact Us | Dyzo" />
                <meta property="og:url" content="https://dyzo.ai/contactus" />
            </Helmet>
            <Header />
            <div className="flex flex-col lg:flex-row">

                <div className="flex-1">
                    <div className="cursor-pointer h-full" onClick={() => navigate('/')}>
                        <img
                            src={LoginImage}
                            alt="Contact Background"
                            className="w-full h-full object-cover hidden md:block"
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col  px-8 py-12 bg-white dark:bg-white">

                    <div className="mobile-logo text-center mb-6 lg:hidden block">
                        <Link to="/" className="flex justify-center items-center">
                            <img
                                src={isDark ? IconWhite : Icon}
                                alt="Dyzo"
                                className="w-10"
                            />
                            <h4 className="pt-2">Dyzo</h4>
                        </Link>
                    </div>


                    <div className="max-w-lg dark:bg-white">
                        <h3 className="text-3xl font-semibold text-black-500 dark:text-black-500 mb-4">Talk to us</h3>
                        <p className="text-base text-black-500 dark:text-black-500 mb-8 text-justify">
                        Feel free to reach out to us via email if you have any questions about Dyzo or need help with deleting your account
                            <Link to='mailto:team@prpwebs.com' className="underline font-semibold text-blue-600"> team@prpwebs.com </Link>
                        </p>


                        <div className="mb-8">
                            <Link to="https://calendly.com/tushar-46/dyzo-ai-demo-call" target="_blank" text='Book a demo' className="btn btn-dark text-center">Book A Demo</Link>
                        </div> 


                        <div className="text-left text-slate-600 dark:text-slate-300">
                            <h4 className="font-semibold text-xl text-black-500 dark:text-black-500">Phone:</h4>
                            <Link to='tel:+91-9214930277' className="underline text-blue-600">+91-9214930277</Link>

                            <h4 className="font-semibold text-xl mt-2 text-black-500 dark:text-black-500">Email:</h4>
                            <p className="mb-4">
                                <Link to='mailto:support@dyzo.ai' className="underline text-blue-600">support@dyzo.ai
                                </Link>
                            </p>

                            <h4 className="font-semibold text-xl mb-2 text-black-500 dark:text-black-500">Current Address:</h4>
                            <p className="mb-4 text-black-500 dark:text-black-500">
                                PRP Webs <br />
                                3rd Floor, S-16, Gulab Vihar, Mansarovar, <br />
                                Sheer Sagar Patarkar Colony, Patrakar Colony, <br />
                                Dholai, Jaipur, Rajasthan 302020 
                            </p>

                            <h4 className="font-semibold text-xl mb-2 text-black-500 dark:text-black-500">Permanent Address:</h4> 
                            <p className="text-black-500 dark:text-black-500">
                                PRP Webs <br />
                                New Munim Colony <br /> 
                                Bijainagar
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />

            <ContactModal showContactModal={showModal} setShowContactModal={setShowModal} />
        </>

    );
};

export default ContactUs;
