import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { djangoBaseURL } from "@/helper";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { fetchAuthGET, fetchAuthPost } from "@/store/api/apiSlice";
import { login, token } from "@/store/api/auth/authSlice";
import CompanyAskStep from "@/pages/rootpage/CompanyAskStep";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "./Header";
import MadeIndiaIcon from "./images/made-india.png"
import EasyUseIcon from "./images/easy_to_use.png"
import AutomatedReportsIcon from "./images/automated_reports.png"
import HeroBG from "./images/heroBG.webp"
import prpwebslogo from '../../assets/images/logo/prp-logo.png'
import vsflogo from '../../assets/images/logo/VSF-Logo.webp'
import seogrowthlogo from '../rootpage/images/seogrowthlogo.webp'
import alchemyleadslogo from '../rootpage/images/alchemyleadslogo.webp'
import trustbadge from '../rootpage/images/trustbadge4.webp'
import manishsharma from '../rootpage/images/manish-sharma.webp'
import sean from '../rootpage/images/sean-img.webp'
import grish from '../rootpage/images/grish-img.webp'
import aaron from '../rootpage/images/aaron-img.webp'
import Footer from "./Footer";
import { Link } from "react-router-dom";
import createTaskIcon from "./images/create-task.png"
import automatedReportIcon from "./images/automated-report.png"
import timeLogIcon from "./images/time-log.png"
import instantAccessIcon from "./images/instant-access.png"
import noCommitmentsIcon from "./images/no-commitments.png"
import dadicatedSupportIcon from "./images/dadicated-support.png"
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper"; // ⬅️ not from "swiper/modules"
import "swiper/css";
import inboxSection from "./images/inboxSection.webp";
import dyzoAi from "./images/dyzoAi.webp";
import liveReport from "./images/liveReport.webp";
import pricingPage from "./images/pricingPage.webp";
import howItWork1 from "./images/howItWorks1.webp";
import howItWork2 from "./images/featureImg1.webp";
import howItWork3 from "./images/howItWorks3.webp";
import howItWork4 from "./images/howItWorks4.webp";
import hero1 from "./images/heroImg1.webp";
import hero2 from "./images/heroImg2.webp";
import hero3 from "./images/heroImg3.webp";
import hero4 from "./images/heroImg4.webp";
import hero5 from "./images/heroImg5.webp";
import hero6 from "./images/heroImg6.webp";
import featureImg1 from "./images/featureImg1.webp";
import featureImg2 from "./images/featureImg2.webp";
import { Helmet } from "react-helmet-async";


const Index = () => {
    const [activeTab, setActiveTab] = useState("setUp");
    const [openIndex, setOpenIndex] = useState(0);
    const [showButton, setShowButton] = useState(true)
    const [googleLoading, setGoogleLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [accounts, setAccounts] = useState([]);
    const [loginCredentials, setLoginCredentials] = useState(null);
    const [loginType, setLoginType] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { hash } = useLocation();

    // Set Hero Images
    const [activeHeroImage, setActiveHeroImage] = useState(1)
    const [isAutoChangeActive, setIsAutoChangeActive] = useState(true);

    // Typing effect
    const [displayedText, setDisplayedText] = useState('');
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [charIndex, setCharIndex] = useState(0);

    const [fullscreenSrc, setFullscreenSrc] = useState(null);

    // Scroll into view for navigate particular section
    useEffect(() => {
        if (hash) {
            const el = document.querySelector(hash);
            if (el) {
                el.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "start"
                });
            }
        }
    }, [hash]);

    // Hero Section Heading
    const phrases = [
        'Tasks, Track Time',
        'Projects, Deliver Faster',
        'Deadlines, Stay Ahead',
        'Resources, Maximize Results',
        'Productivity, Eliminate Chaos',
        'Goals, Track Progress',
    ];

    // Hero Section Heading Typing Effect
    useEffect(() => {
        let timeout;

        if (!isDeleting && charIndex <= phrases[phraseIndex].length) {
            // Typing forward
            timeout = setTimeout(() => {
                setDisplayedText(phrases[phraseIndex].slice(0, charIndex));
                setCharIndex(charIndex + 1);
            }, 100);
        } else if (isDeleting && charIndex >= 0) {
            // Deleting
            timeout = setTimeout(() => {
                setDisplayedText(phrases[phraseIndex].slice(0, charIndex));
                setCharIndex(charIndex - 1);
            }, 50);
        } else if (charIndex === phrases[phraseIndex].length + 1) {
            // Pause before deleting
            timeout = setTimeout(() => setIsDeleting(true), 1500);
        } else if (charIndex === -1) {
            // Move to next phrase
            setIsDeleting(false);
            setPhraseIndex((phraseIndex + 1) % phrases.length);
            setCharIndex(0);
        }

        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, phraseIndex]);

    // Card Ref's for How it Works mobile view
    const cardRefs = {
        setUp: useRef(null),
        timeTrack: useRef(null),
        screenshot: useRef(null),
        reports: useRef(null),
    };

    // Set Active Tab for How it Works mobile view
    const handleSetActive = (tab) => {
        setActiveTab(tab);
        if (cardRefs[tab]?.current) {
            cardRefs[tab].current.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            });
        }
    };

    // Trusted Company's Logo
    const logos = [prpwebslogo, seogrowthlogo, alchemyleadslogo, trustbadge, vsflogo];

    // Feature 
    const featureImages = {
        setUp: howItWork1,
        timeTrack: howItWork2,
        screenshot: howItWork3,
        reports: howItWork4,
    };

    // FAQs
    const faqs = [
        {
            question: "What is Dyzo?",
            answer:
                "Dyzo is an Task Management Platform that helps businesses define workflows, generate insights, and make smarter decisions. It also enables you to ask anything within Dyzo with Dyzo's AI Assistant.",
        },
        {
            question: "Who can use Dyzo?",
            answer:
                "Dyzo is built for businesses of all sizes and industries, including marketing, e-commerce, healthcare, finance, and technology.",
        },
        {
            question: "Do I need coding or technical expertise?",
            answer:
                "No, Dyzo is designed to be user-friendly, so anyone can use it without deep technical knowledge",
        },
        {
            question: "What can Dyzo do?",
            answer:
                "Dyzo supports Task Management, Project Management, Report Generation and Monitoring of remote employees.",
        },
        {
            question: "Who owns the data I upload?",
            answer:
                "You retain full ownership of your data. Dyzo only processes the information needed to deliver its services securely.",
        },
        {
            question: "How much does Dyzo cost?",
            answer:
                "Unbelieveable Pricing makes Dyzo completely pocket-friendly. It just costs you Rs 75/user per month.",
        },
        {
            question: "Is there a free trial?",
            answer:
                "Yes. You can try Dyzo with a free trial before choosing a paid plan.",
        },
        {
            question: "What kind of support is available?",
            answer:
                "We provide on call assistance & email support.",
        },
        {
            question: "How do I sign up for Dyzo?",
            answer:
                "Simply create an account on our website, and follow the guided setup to get started.",
        },
        {
            question: "Can I schedule a demo?",
            answer:
                "Yes, you can book a live demo with our experts to explore Dyzo's features in action.",
        },
        {
            question: "Can I cancel my subscription anytime?",
            answer:
                "Yes, you can! We have a no-questions-asked cancellation policy.",
        },
        {
            question: "Do I need to download the app to track time?",
            answer:
                "No, you don’t have to. But downloading the app helps you take screenshots and see live tracking of your team.",
        },
        {
            question: "Will I be charged if one of my staff leaves?",
            answer:
                "No, you won’t be charged for that staff member starting from the next billing month. However, if they leave in the middle of the month, there won't be a refund for that month. You'll only stop being charged for them the following month.",
        },
        {
            question: "Will I get my money back if I don’t like Dyzo after I’ve already paid?",
            answer:
                "No, we don’t offer refunds. However, we provide a generous feature set and a 30-day free trial so you can try Dyzo before committing.",
        },
        {
            question: "Will my data be saved if I don't upgrade on time after my free trial?",
            answer:
                "We will do our best to keep your data safe, but we can’t guarantee it. To ensure your data remains intact, we recommend upgrading before the trial ends.",
        },
    ];

    // Reviews Data
    const reviews = [
        {
            name: "Manish Sharma",
            company: "SEO Growth",
            profile: manishsharma,
            words: `"With Dyzo, our team’s efficiency has skyrocketed. We’re able to focus on what matters without getting bogged down by administrative tasks."`
        },
        {
            name: "Sean Choudhary",
            company: "Alchemyleads",
            profile: sean,
            words: `"Dyzo, with its Task Templates, Chrome extension, and AI, makes it easy for my team to create and update tasks."`
        },
        {
            name: "Girish",
            company: "Markathon",
            profile: grish,
            words: `"The integration capabilities of Dyzo have streamlined our operations, allowing us to work smarter, not harder."`
        },
        {
            name: "Aaron Hulbort",
            company: "VSF Marketing",
            profile: aaron,
            words: `"Dyzo’s screenshot feature has been a game-changer for our remote team. We can now monitor work in real-time without interrupting workflows."`
        },
    ]

    // Compare Section Data
    const compareData = [
        {
            key: "Collaborate with up-to 10 teammates",
            dyzo: 1,
            monday: 0,
            asana: 1
        },
        {
            key: "Unlimited tasks",
            dyzo: 1,
            monday: 0,
            asana: 1
        },
        {
            key: "Unlimited projects",
            dyzo: 1,
            monday: 1,
            asana: 1
        },
        {
            key: "Status updates",
            dyzo: 1,
            monday: 1,
            asana: 1
        },
        {
            key: "Desktop and android app",
            dyzo: 1,
            monday: 0,
            asana: 0
        },
        {
            key: "Time tracking",
            dyzo: 1,
            monday: 0,
            asana: 1
        },
        {
            key: "Activity Logs",
            dyzo: 1,
            monday: 0,
            asana: 1
        },
        {
            key: "Scalable hierarchy",
            dyzo: 1,
            monday: 0,
            asana: 0
        },
        {
            key: "Custom task statuses",
            dyzo: 1,
            monday: 1,
            asana: 0
        },
        {
            key: "Sprints",
            dyzo: 1,
            monday: 1,
            asana: 0
        },
        {
            key: "Smart notifications",
            dyzo: 1,
            monday: 0,
            asana: 0
        },
        {
            key: "Multiple assignee",
            dyzo: 1,
            monday: 1,
            asana: 0
        },
        {
            key: "Dashboard reports",
            dyzo: 1,
            monday: 2,
            asana: 0
        },
        {
            key: "Nested subtasks",
            dyzo: 1,
            monday: 0,
            asana: 0
        },
        {
            key: "Subtask in multiple locations",
            dyzo: 1,
            monday: 0,
            asana: 0
        },
        {
            key: "Inbox",
            dyzo: 1,
            monday: 0,
            asana: 1
        },
        {
            key: "Custom sprint",
            dyzo: 1,
            monday: 0,
            asana: 0
        },
        {
            key: "Time sheet",
            dyzo: 1,
            monday: 0,
            asana: 0
        },
    ]

    // Auto Change Hero images
    useEffect(() => {
        if (!isAutoChangeActive) return; // stop auto change if flag off

        const interval = setInterval(() => {
            setActiveHeroImage((prev) => (prev === 6 ? 1 : prev + 1));
        }, 4000); // 4 seconds

        return () => clearInterval(interval); // cleanup interval on unmount or flag change
    }, [isAutoChangeActive]);

    // Get Hero Section Images
    function getHeroImages() {
        if (activeHeroImage === 1) return hero1;
        if (activeHeroImage === 2) return hero2;
        if (activeHeroImage === 3) return hero3;
        if (activeHeroImage === 4) return hero4;
        if (activeHeroImage === 5) return hero5;
        if (activeHeroImage === 6) return hero6;
    }

    // Hero Section Image Change
    function handleUserInteraction(newImage) {
        setIsAutoChangeActive(false); // stop automatic image change
        setActiveHeroImage(newImage); // set clicked image
    }

    // Send welcome email
    const sendWelcomeMail = async (data) => {
        try {
            await fetchAuthPost(`${djangoBaseURL}/welcome/admin/`, {
                body: {
                    companyId: data.user.companyId,
                    email: data.user.email,
                    userName: data.user.name,
                },
            });
        } catch (error) {
            console.error("Failed to send welcome email:", error);
        }
    };

    // Get redirect path based on user role
    const getRedirectPath = (role) => {
        const params = new URLSearchParams(location.search);
        const redirectPath = params.get("redirect");
        if (redirectPath) {
            return redirectPath;
        } else if (role === "client") {
            return "/client/dashboard";
        } else if (role === "employee") {
            return "/tasks";
        }
        return "/welcome?status=new";
    };

    // Configure the Google login hook
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            if (googleLoading) return;
            setGoogleLoading(true);
            setLoginType("google");

            try {
                // Step 1: Fetch user info from Google
                const userInfoResponse = await fetch(
                    `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenResponse.access_token}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${tokenResponse.access_token}`,
                            Accept: "application/json",
                        },
                    }
                );
                const profile = await userInfoResponse.json();

                // Step 2: Attempt to create account
                const generatedPassword = Math.random().toString(36).slice(-8);
                const emailPrefix = profile.email.split("@")[0];
                const companyName = `${emailPrefix}'s Company`;

                try {
                    const createCompany = await fetchAuthPost(
                        `${djangoBaseURL}/api/create-company-and-employee/`,
                        {
                            body: {
                                company_name: companyName,
                                email: profile.email,
                                password: generatedPassword,
                            },
                        }
                    );

                    if (createCompany.status) {
                        // Account created successfully, attempt login
                        const userLogin = await fetchAuthPost(`${djangoBaseURL}/login/`, {
                            body: { email: profile.email, password: generatedPassword },
                        });

                        if (userLogin.status) {
                            toast.success("Logged in with Google successfully");
                            dispatch(token(userLogin.token));
                            delete userLogin?.user?.password;
                            dispatch(login(userLogin.user));

                            navigate("/welcome?status=new", { state: { showWelcome: true } });
                            setTimeout(() => {
                                sendWelcomeMail(userLogin);
                            }, 3000);
                        } else {
                            toast.error("Login failed after Google account creation. Please try again.");
                            setTimeout(() => navigate("/login"), 1000);
                        }
                    } else {
                        throw new Error("Account creation failed.");
                    }
                } catch (error) {
                    // Step 3: Handle duplicate account error by logging in the user
                    const loginResponse = await fetchAuthPost(
                        `${djangoBaseURL}/api/google-userlogin/`,
                        {
                            body: {
                                email: profile.email,
                                token: tokenResponse.access_token,
                            },
                        }
                    );

                    if (loginResponse.status === 1) {
                        // Single matching account
                        toast.success("Logged in with Google successfully");
                        dispatch(token(loginResponse.token));
                        delete loginResponse?.user?.password;
                        dispatch(login(loginResponse.user));

                        const redirectPath = getRedirectPath(loginResponse?.user?.user_type);
                        if (redirectPath === "/welcome?status=new") {
                            setTimeout(() => {
                                sendWelcomeMail(loginResponse);
                            }, 3000);
                        }
                        setTimeout(() => navigate(redirectPath), 800);
                    } else if (loginResponse.status === 2) {
                        // Multiple accounts - show company selection
                        setAccounts(loginResponse.accounts);
                        setLoginCredentials(tokenResponse?.access_token);
                        setStep(2);
                    } else {
                        // status = 0 => Error, e.g. user not found, account inactive
                      
                        toast.error(loginResponse.message || "Google login failed");
                    }
                }
            } catch (err) {
                console.error("Google login error:", err);
                toast.error("An error occurred during Google login.");
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: () => {
            toast.error("Google login failed");
            setGoogleLoading(false);
        },
    });

    if (step === 2) {
        return (
            <CompanyAskStep
                accounts={accounts}
                loginCredentials={loginCredentials}
                loginType={loginType}
            />
        );
    }

    return (
        <div className="bg-white w-full">
            <Header />
            <Helmet>
                <title>Dyzo.ai – Smart Task, Time & Workflow Automation Platform</title>
                <meta
                    name="description"
                    content="Manage tasks, track time, and automate workflows with Dyzo.ai — the all-in-one platform for teams. Simplify productivity with dashboards, AI assistant, and real-time reports."
                />
                <meta property="og:title" content="Task Management with Time Tracking & Screenshots | Dyzo" />
                <meta property="og:url" content="https://dyzo.ai/" />
                <link rel="canonical" href="https://dyzo.ai/" />
            </Helmet>
            <div className="overflow-hidden bg-gray-100">

                {/* Hero Section */}
                <div className="bg-gray-100 w-full"
                    style={{
                        backgroundImage: `url(${HeroBG})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}>
                    <section className="relative z-0 max-w-[1440px] mx-auto px-6 md:px-12 py-8 md:py-16 text-center">

                        {/* Top badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 mt-4 md:mt-0 px-4 py-2 rounded-full border text-sm font-medium"
                        >
                            <Icon icon="mdi:stars" className="text-blue-600 text-lg min-w-fit" />
                            All-in-One Time Tracking & Task Management Platform
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="mt-6 text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight"
                        >
                            Manage <span>{displayedText}</span>
                            <span className="border-r-2 border-gray-900 animate-pulse ml-1" />
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-4 max-w-3xl mx-auto text-lg text-gray-600"
                        >
                            Boost productivity with automatic time tracking, task management, and
                            screenshot monitoring in one powerful platform.
                        </motion.p>

                        {/* Buttons */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-8 flex flex-row justify-center items-center gap-2 md:gap-4 flex-wrap"
                        >
                            <Link to="/register" className="px-5 md:px-6 py-2.5 inline-block rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition text-sm md:text-base">
                                Get Started For Free
                            </Link>
                            <button onClick={handleGoogleLogin} disabled={googleLoading} className="flex items-center gap-2 px-3 md:px-6 py-2 border-2 border-blue-600 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition text-sm md:text-base">
                                <Icon icon="logos:google-icon" className="text-xl" />
                                Sign Up With Google
                            </button>
                        </motion.div>

                        {/* Feature badges */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="mt-6 md:mt-12 flex flex-wrap justify-center gap-4"
                        >
                            <div className="bg-white px-1 py-1 rounded-full border flex items-center">
                                <div className="w-6 h-6 bg-blue-200 rounded-full flex justify-center items-center ">
                                    <img src={MadeIndiaIcon} className="w-5" alt="" />
                                </div>
                                <span className="text-blue-600 text-sm font-medium mx-4">Made In India</span>
                            </div>
                            <div className="bg-white px-1 py-1 rounded-full border flex items-center">
                                <div className="w-6 h-6 bg-blue-200 rounded-full flex justify-center items-center ">
                                    <Icon icon="streamline-ultimate:single-neutral-monitor" />
                                </div>
                                <span className="text-blue-600 text-sm font-medium mx-4">Remote employees monitoring</span>
                            </div>
                            <div className="bg-white px-1 py-1 rounded-full border flex items-center">
                                <div className="w-6 h-6 bg-blue-200 rounded-full flex justify-center items-center ">
                                    <img src={EasyUseIcon} className="w-4" alt="" />
                                </div>
                                <span className="text-blue-600 text-sm font-medium mx-4">Easy to use</span>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="mt-4 md:mt-4 flex flex-wrap justify-center gap-4"
                            id="workspace"
                        >
                            <div className="bg-white px-1 py-1 rounded-full border flex items-center">
                                <div className="w-6 h-6 bg-blue-200 rounded-full flex justify-center items-center ">
                                    <Icon icon="mdi:stars" />
                                </div>
                                <span className="text-blue-600 text-sm font-medium mx-4">Dyzo-AI Assistant</span>
                            </div>
                            <div className="bg-white px-1 py-1 rounded-full border flex items-center">
                                <div className="w-6 h-6 bg-blue-200 rounded-full flex justify-center items-center ">
                                    <img src={AutomatedReportsIcon} className="w-4" alt="" />
                                </div>
                                <span className="text-blue-600 text-sm font-medium mx-4">Automatic reports</span>
                            </div>
                        </motion.div>

                        <div
                            className="absolute w-[200px] h-[200px] xl:w-[450px] xl:h-[450px] 2xl:w-[600px] 2xl:h-[600px] rounded-full blur-[100px] xl:blur-[200px] left-0 bottom-28 xl:bottom-64 -z-10"
                            style={{
                                background: `
                        radial-gradient(circle, #0F6FFF 0%, transparent 70%),
                        radial-gradient(circle at bottom, #B59DF9 0%, transparent 70%)
                        `,
                            }}
                        />
                        <div
                            className="absolute w-[200px] h-[200px] xl:w-[450px] xl:h-[450px] 2xl:w-[600px] 2xl:h-[600px] rounded-full blur-[100px] xl:blur-[200px] right-0 xl:right-32 bottom-0 xl:bottom-32 -z-10"
                            style={{
                                background: "radial-gradient(circle, #A026FF 0%, transparent 70%)",
                            }}
                        />

                        <div className="mt-12 lg:mt-20 relative hidden lg:block">

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeHeroImage}
                                    className="p-2 rounded-lg border border-white bg-[#C6D0FF4D] w-[74%]"
                                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -30 }}
                                    transition={{ duration: 0.5 }}
                                    onClick={() => handleUserInteraction(activeHeroImage)}
                                >
                                    <img
                                        src={getHeroImages()}
                                        alt=""
                                        className="w-full max-h-[520px] object-cover object-top"
                                    />
                                </motion.div>
                            </AnimatePresence>

                            <div className="p-2 rounded-lg border border-white bg-[#C6D0FF4D] absolute -right-2 -top-[3%] h-[106%] ">
                                <div className="bg-white border border-electricBlue-50 rounded-lg py-4 px-12 h-full">
                                    <p className="text-center text-xl text-electricBlue-50 font-semibold">Set up your</p>
                                    <p className="text-center text-4xl text-electricBlue-100 font-semibold">Workspace</p>
                                    <div className="grid grid-cols-2 gap-6 xl:gap-7 my-4 xl:my-6">

                                        <div className={`border  rounded-xl flex flex-col items-center justify-center gap-1 px-4 pt-2 pb-3 cursor-pointer ${activeHeroImage === 1 ? "border-electricBlue-50" : "border-customGray-150"}`} onClick={() => handleUserInteraction(1)}>
                                            <div className={`rounded-full p-1.5 ${activeHeroImage === 1 ? "bg-electricBlue-50/20" : "bg-customGray-150/40"}`}>
                                                <Icon icon="hugeicons:task-add-01" className={`text-4xl rounded-full ${activeHeroImage === 1 ? "text-electricBlue-50" : "text-customGray-250"}`} />
                                            </div>
                                            <span className={`text-xs font-semibold ${activeHeroImage === 1 ? "text-electricBlue-50" : "text-customGray-150"}`} >Tasks</span>
                                        </div>

                                        <div className={`border  rounded-xl flex flex-col items-center justify-center gap-1 px-4 pt-2 pb-3 cursor-pointer ${activeHeroImage === 2 ? "border-electricBlue-50" : "border-customGray-150"}`} onClick={() => handleUserInteraction(2)}>
                                            <div className={`rounded-full p-1.5 ${activeHeroImage === 2 ? "bg-electricBlue-50/20" : "bg-customGray-150/40"}`}>
                                                <Icon icon="codicon:github-project" className={`text-4xl rounded-full ${activeHeroImage === 2 ? "text-electricBlue-50" : "text-customGray-250"}`} />
                                            </div>
                                            <span className={`text-xs font-semibold ${activeHeroImage === 2 ? "text-electricBlue-50" : "text-customGray-150"}`} >Project</span>
                                        </div>

                                        <div className={`border  rounded-xl flex flex-col items-center justify-center gap-1 px-4 pt-2 pb-3 cursor-pointer ${activeHeroImage === 3 ? "border-electricBlue-50" : "border-customGray-150"}`} onClick={() => handleUserInteraction(3)}>
                                            <div className={`rounded-full p-1.5 ${activeHeroImage === 3 ? "bg-electricBlue-50/20" : "bg-customGray-150/40"}`}>
                                                <Icon icon="streamline-sharp:graphic-template-website-ui" className={`text-4xl rounded-full ${activeHeroImage === 3 ? "text-electricBlue-50" : "text-customGray-250"}`} />
                                            </div>
                                            <span className={`text-xs font-semibold ${activeHeroImage === 3 ? "text-electricBlue-50" : "text-customGray-150"}`} >Templates</span>
                                        </div>

                                        <div className={`border  rounded-xl flex flex-col items-center justify-center gap-1 px-4 pt-2 pb-3 cursor-pointer ${activeHeroImage === 4 ? "border-electricBlue-50" : "border-customGray-150"}`} onClick={() => handleUserInteraction(4)}>
                                            <div className={`rounded-full p-1.5 ${activeHeroImage === 4 ? "bg-electricBlue-50/20" : "bg-customGray-150/40"}`}>
                                                <Icon icon="codicon:bell-dot" className={`text-4xl rounded-full ${activeHeroImage === 4 ? "text-electricBlue-50" : "text-customGray-250"}`} />
                                            </div>
                                            <span className={`text-xs font-semibold ${activeHeroImage === 4 ? "text-electricBlue-50" : "text-customGray-150"}`} >Inbox</span>
                                        </div>

                                        <div className={`border  rounded-xl flex flex-col items-center justify-center gap-1 px-4 pt-2 pb-3 cursor-pointer ${activeHeroImage === 5 ? "border-electricBlue-50" : "border-customGray-150"}`} onClick={() => handleUserInteraction(5)}>
                                            <div className={`rounded-full p-1.5 ${activeHeroImage === 5 ? "bg-electricBlue-50/20" : "bg-customGray-150/40"}`}>
                                                <Icon icon="mdi:timetable" className={`text-4xl rounded-full ${activeHeroImage === 5 ? "text-electricBlue-50" : "text-customGray-250"}`} />
                                            </div>
                                            <span className={`text-xs font-semibold ${activeHeroImage === 5 ? "text-electricBlue-50" : "text-customGray-150"}`} >Time Tracking</span>
                                        </div>

                                        <div className={`border  rounded-xl flex flex-col items-center justify-center gap-1 px-4 pt-2 pb-3 cursor-pointer ${activeHeroImage === 6 ? "border-electricBlue-50" : "border-customGray-150"}`} onClick={() => handleUserInteraction(6)}>
                                            <div className={`rounded-full p-1.5 ${activeHeroImage === 6 ? "bg-electricBlue-50/20" : "bg-customGray-150/40"}`}>
                                                <Icon icon="lsicon:report-outline" className={`text-4xl rounded-full ${activeHeroImage === 6 ? "text-electricBlue-50" : "text-customGray-250"}`} />
                                            </div>
                                            <span className={`text-xs font-semibold ${activeHeroImage === 6 ? "text-electricBlue-50" : "text-customGray-150"}`} >Report</span>
                                        </div>

                                    </div>
                                    <Link to="/register" className="py-2.5 inline-block w-full rounded-xl bg-electricBlue-50 text-white font-medium shadow hover:bg-electricBlue-100 transition text-sm md:text-base mt-6 xl:mt-0">
                                        Get Started
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 lg:mt-20 lg:hidden">
                            <Swiper
                                modules={[Autoplay]}
                                autoplay={{ delay: 1000, disableOnInteraction: false }}
                                speed={3000}
                                loop={true}
                                spaceBetween={30}
                                slidesPerView={1}
                                breakpoints={{
                                    640: { slidesPerView: 1 },
                                    768: { slidesPerView: 1 },
                                    1024: { slidesPerView: 1 },
                                }}
                                className="flex items-center"
                            >
                                {[hero1, hero2, hero3, hero4, hero5, hero6].map(
                                    (logo, i) => (
                                        <SwiperSlide key={i}>
                                            <div className="p-2 rounded-lg border border-white bg-[#C6D0FF4D]">
                                                <img
                                                    src={logo}
                                                    alt={`Company ${i + 1}`}
                                                    className="w-full object-contain rounded-md"
                                                />
                                            </div>
                                        </SwiperSlide>
                                    )
                                )}
                            </Swiper>
                        </div>

                    </section>
                </div>

                {/* Trusted Companies Section */}
                <section className="relative mx-auto py-8 md:py-16 text-center">
                    {/* Heading */}
                    <h2 className="text-gray-800 text-xl font-semibold mb-10">
                        Companies Big & Small Rely on Dyzo to Stay on Track
                    </h2>

                    {/* Slider */}
                    <Swiper
                        modules={[Autoplay]}
                        autoplay={{ delay: 1000, disableOnInteraction: false }}
                        speed={3000}
                        loop={true}
                        spaceBetween={30}
                        slidesPerView={3}
                        breakpoints={{
                            640: { slidesPerView: 3 },
                            768: { slidesPerView: 4 },
                            1024: { slidesPerView: 5 },
                            1280: { slidesPerView: 5 },
                        }}
                        className="flex items-center"
                    >
                        {[...logos, ...logos].map(
                            (logo, i) => (
                                <SwiperSlide key={i}>
                                    <div className="flex items-center justify-center h-20">
                                        <img
                                            src={logo}
                                            alt={`Company ${i + 1}`}
                                            className="max-h-10 md:max-h-20 object-contain"
                                        />
                                    </div>
                                </SwiperSlide>
                            )
                        )}
                    </Swiper>
                </section>

                {/* Key Features and Capabilities Section */}
                <section id="features" className="relative z-0">
                    <div
                        className="absolute w-[400px] h-[400px] xl:w-[450px] xl:h-[450px] 2xl:w-[600px] 2xl:h-[600px] rounded-full blur-[100px] xl:blur-[200px] -right-28 xl:-right-40 top-96 xl:-top-40 -z-10"
                        style={{
                            background: "radial-gradient(circle, #A026FF 0%, transparent 40%)",
                        }}
                    />
                    <div className="relative max-w-[1440px] mx-auto px-6 md:px-12 py-8 md:py-16">
                        {/* Section heading */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            {/* <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium shadow-sm mb-4 bg-white">
                <Icon icon="mdi:stars" className="text-blue-600 text-lg" />
                Try Dyzo AI
                </span> */}
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                Powerful Features That Deliver Productivity <br className="hidden md:block" /> & Transparency
                            </h2>
                            <p className="mt-2 text-gray-600 max-w-xl mx-auto">
                                Specify helps you gain control of your design system across teams and products.
                            </p>
                        </motion.div>

                        {/* Features grid */}
                        <div className="space-y-12 md:space-y-24">
                            {/* Feature 1 */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7 }}
                                viewport={{ once: true }}
                                className="flex flex-col md:flex-row items-center gap-10 md:gap-20"
                            >
                                <div className="flex-1 text-center md:text-start">
                                    <h3 className="text-2xl font-semibold text-[#6B6B6B]">
                                        Task Management with Automatic Time Tracking
                                    </h3>
                                    <p className="mt-4 text-[#7B7B7B]">
                                        Dyzo makes task management and time tracking simple and effective. Automate your workflow, track billable hours, and ensure your team stays focused on what matters most—without extra admin work.
                                    </p>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        viewport={{ once: true }}
                                        className="mt-6 p-4 border rounded-lg shadow-sm bg-gray-100 hidden md:block"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img src={manishsharma} width="40px" height="auto" alt="Manish Sharma" loading="lazy" className="rounded-full" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">Manish Sharma</p>
                                                <p className="text-xs text-gray-500">SEO Growth</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 italic mt-2">
                                            “With Dyzo, our team’s efficiency has skyrocketed. We’re able to focus on what matters most without getting bogged down by administrative tasks.”
                                        </p>
                                    </motion.div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-end relative ">
                                        <motion.img
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.7, delay: 0.2 }}
                                            viewport={{ once: true }}
                                            src={featureImg1}
                                            alt="Task Management"
                                            className="rounded-xl shadow-md w-full border-2 border-[#71AAFF]"
                                        />
                                        {/* <motion.img
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            viewport={{ once: true }}
                            src={feature1B}
                            alt="Task Management"
                            className="rounded-xl shadow-md w-2/5 absolute right-[60%] top-[40%] "
                        /> */}
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        viewport={{ once: true }}
                                        className="mt-12 p-4 border rounded-lg shadow-sm bg-white md:hidden"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img src={manishsharma} width="40px" height="auto" alt="Manish Sharma" loading="lazy" className="rounded-full" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">Manish Sharma</p>
                                                <p className="text-xs text-gray-500">SEO Growth</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 italic mt-2">
                                            “With Dyzo, our team’s efficiency has skyrocketed. We’re able to focus on what matters most without getting bogged down by administrative tasks.”
                                        </p>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Feature 2 */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.7 }}
                                viewport={{ once: true }}
                                className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-20"
                            >
                                <div className="flex-1 text-center md:text-start">
                                    <h3 className="text-2xl font-semibold text-[#6B6B6B]">
                                        Screenshot Monitoring for Remote Teams
                                    </h3>
                                    <p className="mt-4 text-[#7B7B7B]">
                                        Easily monitor remote employees with automated screenshot monitoring. Keep track of progress, improve accountability, and ensure transparency across distributed teams—without micromanaging.
                                    </p>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        viewport={{ once: true }}
                                        className="mt-6 p-4 border rounded-lg shadow-sm bg-gray-100 hidden md:block"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img src={sean} width="40px" height="auto" alt="Manish Sharma" loading="lazy" className="rounded-full" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">Sean Choudhary</p>
                                                <p className="text-xs text-gray-500">Alchemyleads</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 italic mt-2">
                                            “Dyzo, with its Task Templates, Chrome extension, and AI, makes it easy for my team to create and update tasks.”
                                        </p>
                                    </motion.div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-center relative">
                                        <motion.img
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.7, delay: 0.2 }}
                                            viewport={{ once: true }}
                                            src={featureImg2}
                                            alt="Screenshot Monitoring"
                                            className="rounded-xl shadow-md w-full border-2 border-[#71AAFF]"
                                        />
                                        {/* <motion.img
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            viewport={{ once: true }}
                            src={feature2B}
                            alt="Screenshot Monitoring"
                            className="rounded-xl shadow-md absolute w-2/5 left-0 -top-[10%]"
                        />
                        <motion.img
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            viewport={{ once: true }}
                            src={feature2C}
                            alt="Screenshot Monitoring"
                            className="rounded-xl shadow-md absolute w-2/5 right-0 top-[40%]"
                        /> */}
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        viewport={{ once: true }}
                                        className="mt-6 p-4 border rounded-lg shadow-sm bg-white md:hidden"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img src={sean} width="40px" height="auto" alt="Manish Sharma" loading="lazy" className="rounded-full" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">Sean Choudhary</p>
                                                <p className="text-xs text-gray-500">Alchemyleads</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 italic mt-2">
                                            “Dyzo, with its Task Templates, Chrome extension, and AI, makes it easy for my team to create and update tasks.”
                                        </p>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                    <div
                        className="absolute w-[400px] h-[400px] xl:w-[450px] xl:h-[450px] 2xl:w-[600px] 2xl:h-[600px] rounded-full blur-[140px] xl:blur-[200px] -right-40 -bottom-80 xl:-bottom-96 -z-10"
                        style={{
                            background: "radial-gradient(circle, #A026FF 0%, transparent 50%)",
                        }}
                    />
                </section>

                {/* How it works Section  */}
                <section id="insights" className="relative z-0">
                    <div className="relative max-w-[1440px] mx-auto px-6 md:px-12 py-8 md:py-16 text-center">
                        {/* <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium shadow-sm mb-4 bg-white">
                <Icon icon="mdi:stars" className="text-blue-600 text-lg" />
                Try Dyzo AI
                </span> */}
                        {/* Heading */}
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="mt-2 text-gray-600 max-w-xl mx-auto">
                            Follow just 4 simple steps to get full visibility into your team’s work and productivity.
                        </p>
                        {/* <Link to="/register" className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition my-10">
                    Get Started For Free
                </Link> */}

                        {/* Feature Cards */}
                        {/* Mobile */}
                        <div className="relative overflow-hidden my-12 md:hidden text-start">
                            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-2" style={{
                                scrollbarWidth: "none"
                            }}>
                                {/* Set Up */}
                                <div
                                    ref={cardRefs.setUp}
                                    onClick={() => handleSetActive("setUp")}
                                    className={`min-w-[75%] md:min-w-0 md:flex-1 cursor-pointer rounded-xl px-3 py-4 snap-center transition ${activeTab === "setUp"
                                            ? "border border-blue-500 shadow-xl shadow-blue-500/20 bg-white"
                                            : "bg-[#EAEAEA]"
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {/* <img src={createTaskIcon} className="w-6" alt=""  /> */}
                                        <Icon icon="bi:person-workspace" className="text-2xl min-w-max" />
                                        <h3 className="text-base font-semibold text-gray-800">Set your workspace & invite team</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm mt-2">
                                        Create your workspace, projects, teams, and add users.
                                    </p>
                                </div>

                                {/* Time Track */}
                                <div
                                    ref={cardRefs.timeTrack}
                                    onClick={() => handleSetActive("timeTrack")}
                                    className={`min-w-[75%] md:min-w-0 md:flex-1 cursor-pointer rounded-xl px-3 py-4 snap-center transition ${activeTab === "timeTrack"
                                            ? "border border-blue-500 shadow-xl shadow-blue-500/20 bg-white"
                                            : "bg-[#EAEAEA]"
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {/* <img src={timeLogIcon} className="w-6" alt=""  /> */}
                                        <Icon icon="tdesign:user-time" className="text-2xl min-w-max" />
                                        <h3 className="text-base font-semibold text-gray-800">Start tracking time</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm mt-2">
                                        Time is logged automatically — active time, idle time, breaks.
                                    </p>
                                </div>

                                {/* Screenshot */}
                                <div
                                    ref={cardRefs.screenshot}
                                    onClick={() => handleSetActive("screenshot")}
                                    className={`min-w-[75%] md:min-w-0 md:flex-1 cursor-pointer rounded-xl px-3 py-4 snap-center transition ${activeTab === "screenshot"
                                            ? "border border-blue-500 shadow-xl shadow-blue-500/20 bg-white"
                                            : "bg-[#EAEAEA]"
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {/* <img src={automatedReportIcon} className="w-6" alt=""  /> */}
                                        <Icon icon="iconoir:screenshot" className="text-2xl min-w-max" />
                                        <h3 className="text-base font-semibold text-gray-800">Screenshot & activity capture</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm mt-2">
                                        Adds visual proof, supporting accountability without micromanagement.
                                    </p>
                                </div>

                                {/* Reports */}
                                <div
                                    ref={cardRefs.reports}
                                    onClick={() => handleSetActive("reports")}
                                    className={`min-w-[75%] md:min-w-0 md:flex-1 cursor-pointer rounded-xl px-3 py-4 snap-center transition mr-20 ${activeTab === "reports"
                                            ? "border border-blue-500 shadow-xl shadow-blue-500/20 bg-white"
                                            : "bg-[#EAEAEA]"
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {/* <img src={automatedReportIcon} className="w-6" alt=""  /> */}
                                        <Icon icon="fluent-mdl2:b-i-dashboard" className="text-2xl min-w-max" />
                                        <h3 className="text-base font-semibold text-gray-800">Review dashboards & reports</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm mt-2">
                                        Helps you make data-driven decisions, optimize workflows, and spot inefficiencies.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop */}
                        <div className=" md:grid-cols-4 gap-4 my-12 text-start hidden md:grid">
                            {/* Set up */}
                            <div
                                onClick={() => setActiveTab("setUp")}
                                className={`cursor-pointer rounded-xl p-4  transition ${activeTab === "setUp" ? " border border-blue-500 shadow-xl shadow-blue-500/20 bg-white" : "bg-[#EAEAEA]"
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    {/* <img src={createTaskIcon} className="w-6" alt=""  /> */}
                                    <Icon icon="bi:person-workspace" className="text-2xl min-w-max" />
                                    <h3 className="text-base font-semibold text-gray-800">Set your workspace & invite team</h3>
                                </div>
                                <p className="text-gray-600 text-sm mt-2">
                                    Create your workspace, projects, teams, and add users.
                                </p>
                            </div>

                            {/* Time Track */}
                            <div
                                onClick={() => setActiveTab("timeTrack")}
                                className={`cursor-pointer rounded-xl p-4  transition ${activeTab === "timeTrack" ? " border border-blue-500 shadow-xl shadow-blue-500/20 bg-white" : "bg-[#EAEAEA]"
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    {/* <img src={timeLogIcon} className="w-6" alt=""  /> */}
                                    <Icon icon="tdesign:user-time" className="text-2xl min-w-max" />
                                    <h3 className="text-base font-semibold text-gray-800">Start tracking time</h3>
                                </div>
                                <p className="text-gray-600 text-sm mt-2">
                                    Time is logged automatically — active time, idle time, breaks.
                                </p>
                            </div>

                            {/* Screenshot */}
                            <div
                                onClick={() => setActiveTab("screenshot")}
                                className={`cursor-pointer rounded-xl p-4 transition ${activeTab === "screenshot" ? " border border-blue-500 shadow-xl shadow-blue-500/20 bg-white" : "bg-[#EAEAEA]"
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    {/* <img src={automatedReportIcon} className="w-6" alt=""  /> */}
                                    <Icon icon="iconoir:screenshot" className="text-2xl min-w-max" />
                                    <h3 className="text-base font-semibold text-gray-800">Screenshot & activity capture</h3>
                                </div>
                                <p className="text-gray-600 text-sm mt-2">
                                    Adds visual proof, supporting accountability without micromanagement.
                                </p>
                            </div>

                            {/* Reports */}
                            <div
                                onClick={() => setActiveTab("reports")}
                                className={`cursor-pointer rounded-xl p-4 transition ${activeTab === "reports" ? " border border-blue-500 shadow-xl shadow-blue-500/20 bg-white" : "bg-[#EAEAEA]"
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    {/* <img src={automatedReportIcon} className="w-6" alt=""  /> */}
                                    <Icon icon="fluent-mdl2:b-i-dashboard" className="text-2xl min-w-max" />
                                    <h3 className="text-base font-semibold text-gray-800">Review dashboards & reports</h3>
                                </div>
                                <p className="text-gray-600 text-sm mt-2">
                                    Helps you make data-driven decisions, optimize workflows, and spot inefficiencies.
                                </p>
                            </div>
                        </div>

                        {/* Animated Preview Image */}
                        <div className="relative mx-auto overflow-hidden rounded-lg md:rounded-3xl shadow-lg border-2 border-blue-300 ">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={activeTab}
                                    src={featureImages[activeTab]}
                                    alt="Feature Preview"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full rounded-lg md:rounded-3xl h-[150px] sm:h-[250px] md:h-[300px] lg:h-[450px] xl:h-[520px] object-cover object-top "
                                />
                            </AnimatePresence>
                        </div>

                        <div className="md:hidden flex justify-center items-center gap-2 mt-5">
                            <span className={`w-2 h-2 block rounded-full ${activeTab === "setUp" ? "bg-blue-600" : "bg-blue-600/40"}`}></span>
                            <span className={`w-2 h-2 block rounded-full ${activeTab === "timeTrack" ? "bg-blue-600" : "bg-blue-600/40"}`}></span>
                            <span className={`w-2 h-2 block rounded-full ${activeTab === "screenshot" ? "bg-blue-600" : "bg-blue-600/40"}`}></span>
                            <span className={`w-2 h-2 block rounded-full ${activeTab === "reports" ? "bg-blue-600" : "bg-blue-600/40"}`}></span>
                        </div>
                    </div>
                </section>

                {/*  */}
                <section className="relative z-0">
                    <div className="relative mx-auto px-6 md:px-2 py-8 md:py-16 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            The Dyzo Experience
                        </h2>
                        <p className="mt-2 text-gray-600 max-w-3xl mx-auto">
                            Work smarter, not harder — Dyzo transforms how your team collaborates, tracks time, and achieves goals.
                            But don't just take our word for it. Hear what our satisfied users have to say.
                        </p>
                        {/* Slider */}
                        <Swiper
                            modules={[Autoplay]}
                            autoplay={{
                                delay: 1000,
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true,
                            }}
                            speed={4000}
                            loop={true}
                            spaceBetween={30}
                            slidesPerView={1}
                            breakpoints={{
                                640: { slidesPerView: 2 },
                                1024: { slidesPerView: 3 },
                                1280: { slidesPerView: 4 },
                                1600: { slidesPerView: 5 },
                            }}
                            className="flex items-center mt-12"
                        >
                            {[...reviews, ...reviews].map(
                                (review, i) => (
                                    <SwiperSlide key={i} className="h-full flex items-stretch">
                                        <div className="border border-[#B6BCCD] rounded-2xl p-4 md:p-10 flex flex-col flex-1 h-full bg-gray-100">
                                            <p className="max-w-3xl mx-auto mt-4 md:mt-16 mb-6 md:mb-12 text-base text-gray-800 font-semibold flex-grow">
                                                {review?.words}
                                            </p>
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <img
                                                    src={review?.profile}
                                                    width="40"
                                                    alt={review?.name}
                                                    loading="lazy"
                                                    className="rounded-full"
                                                />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-gray-800">{review?.name}</p>
                                                    <p className="text-xs text-gray-500">{review?.company}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </SwiperSlide>

                                )
                            )}
                        </Swiper>
                    </div>
                    <div
                        className="absolute w-[400px] h-[400px] xl:w-[450px] xl:h-[450px] 2xl:w-[600px] 2xl:h-[600px] rounded-full blur-[140px] xl:blur-[220px] -left-20 xl:-left-40 -bottom-40 xl:-bottom-96 -z-10"
                        style={{
                            background: "radial-gradient(circle, #A026FF 0%, transparent 50%)",
                        }}
                    />
                </section>

                {/*  */}
                <section className="relative z-0">
                    <div className="relative max-w-[1440px] mx-auto px-6 md:px-12 py-8 md:py-16 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Everything Your Team is Looking for
                        </h2>
                        <p className="mt-2 text-gray-600 max-w-3xl mx-auto">
                            From simple tasks to complex workflows, Dyzo does it all — and keeps getting better.
                        </p>
                        <div className="mt-12 grid gap-4 md:gap-8 md:grid-cols-2 p-4 md:p-12 border border-white rounded-2xl">
                            {/* Card 1 */}
                            <div className="bg-white rounded-2xl shadow-sm border px-4 py-3 md:px-10 md:py-6 text-left ">
                                <div className="bg-[#F6F7FF] p-3 mb-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-500 hover:bg-[#f1f2ff]">
                                    <img
                                        src={inboxSection}
                                        alt="Save your time"
                                        className="rounded-xl w-full object-cover"
                                        onClick={() => setFullscreenSrc(inboxSection)}
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Save your time-minimum communication required
                                </h3>
                                <p className="mt-2 text-gray-600 text-sm">
                                    No manual reports are required, as automated reports are delivered to your inbox, while task commenting and notifications streamline communication.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-white rounded-2xl shadow-sm border px-4 py-3 md:px-10 md:py-6 text-left">
                                <div className="bg-[#F6F7FF] p-3 mb-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-500 hover:bg-[#f1f2ff]">
                                    <img
                                        src={dyzoAi}
                                        alt="Save your time"
                                        className="rounded-xl w-full object-cover"
                                        onClick={() => setFullscreenSrc(dyzoAi)}
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Dyzo AI Assistant- No Training needed
                                </h3>
                                <p className="mt-2 text-gray-600 text-sm">
                                    Dyzo AI provides solutions to all your queries and can assist in building a website even with minimal knowledge.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="bg-white rounded-2xl shadow-sm border px-4 py-3 md:px-10 md:py-6 text-left">
                                <div className="bg-[#F6F7FF] p-3 mb-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-500 hover:bg-[#f1f2ff]">
                                    <img
                                        src={liveReport}
                                        alt="Save your time"
                                        className="rounded-xl w-full object-cover"
                                        onClick={() => setFullscreenSrc(liveReport)}
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Easy Tracking of Tasks
                                </h3>
                                <p className="mt-2 text-gray-600 text-sm">
                                    Live reporting makes it easy to track tasks through statuses and sections.
                                </p>
                            </div>

                            {/* Card 4 */}
                            <div className="bg-white rounded-2xl shadow-sm border px-4 py-3 md:px-10 md:py-6 text-left">
                                <div className="bg-[#F6F7FF] p-3 mb-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-500 hover:bg-[#f1f2ff]">
                                    <img
                                        src={pricingPage}
                                        alt="Save your time"
                                        className="rounded-xl w-full object-cover"
                                        onClick={() => setFullscreenSrc(pricingPage)}
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    More Affordable compared to others
                                </h3>
                                <p className="mt-2 text-gray-600 text-sm">
                                    Each user can access all the features for just ₹75, with add-on options available for the Desktop App and Android App.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div
                        className="absolute w-[400px] h-[400px] xl:w-[450px] xl:h-[450px] 2xl:w-[600px] 2xl:h-[600px] rounded-full blur-[140px] xl:blur-[200px] -right-40 -bottom-80 xl:-bottom-60 -z-10"
                        style={{
                            background: "radial-gradient(circle, #A026FF 0%, transparent 50%)",
                        }}
                    />
                </section>

                {fullscreenSrc && (
                    <div
                        className="fixed inset-0 bg-black-500/90 flex justify-center items-center cursor-pointer z-50 "
                        onClick={() => setFullscreenSrc(null)}
                    >
                        <Icon icon="mdi:close" className="absolute top-[5%] right-[5%] text-3xl text-gray-300 bg-black-500/50 p-0.5 rounded-sm hover:bg-black-500" onClick={() => setFullscreenSrc(null)} />
                        <img
                            src={fullscreenSrc}
                            alt="Fullscreen"
                            className="max-w-[80%] max-h-[80%] rounded-lg cursor-default"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                        />
                    </div>
                )}

                {/* Compare Section  */}
                <section className="relative max-w-[1440px] mx-auto px-6 md:px-12 py-8 md:py-16 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Why Choose Us?
                    </h2>
                    <p className="mt-2 text-gray-600 max-w-3xl mx-auto">
                        Compare features and find out why we’re the best choice for your team.
                    </p>
                    {/* Comparison Table */}
                    <div className="mt-12 overflow-x-auto xl:px-36">
                        <table className="w-full text-left text-sm border-separate border-spacing-x-2">
                            <thead>
                                <tr>
                                    <th className="p-4"></th>
                                    <th className="p-4 text-center text-white bg-electricBlue-50 rounded-t-xl botder-2 border-electricBlue-50">
                                        Dyzo
                                    </th>
                                    <th className="p-4 text-center bg-[#CECECE] rounded-t-xl text-gray-800 font-semibold">
                                        Monday
                                    </th>
                                    <th className="p-4 text-center bg-[#CECECE] rounded-t-xl text-gray-800 font-semibold">
                                        Asana
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="">
                                {compareData.map((data, i) => (
                                    <tr key={i} className="text-center">
                                        <td className="p-3 mb-1 block text-left font-semibold bg-white rounded-l-md min-w-[150px] ">{data?.key}</td>
                                        {/* Dyzo  */}
                                        <td className={`p-3 bg-[#F6F4FF] border-x-2 border-electricBlue-50 min-w-[100px] w-[18%] ${i === compareData.length - 1 ? 'border-b-2 ' : ''}`}>
                                            {
                                                data?.dyzo === 0 ? <Icon icon="radix-icons:cross-2" className="text-lg text-white bg-[#D10303] rounded-sm mx-auto" /> : data?.dyzo === 1 ?
                                                    <Icon icon="mynaui:check-solid" className="text-lg text-white bg-[#04C828] rounded-sm mx-auto" /> : (
                                                        <span className="text-xs text-[#DC9E00]">Premium</span>
                                                    )
                                            }
                                        </td>
                                        {/* Monday  */}
                                        <td className="p-3 bg-[#EFEFEF] min-w-[100px] w-[18%]">
                                            {
                                                data?.monday === 0 ? <Icon icon="radix-icons:cross-2" className="text-lg text-white bg-[#D10303] rounded-sm mx-auto" /> : data?.monday === 1 ?
                                                    <Icon icon="mynaui:check-solid" className="text-lg text-white bg-[#04C828] rounded-sm mx-auto" /> : (
                                                        <span className="text-xs text-[#DC9E00]">Premium</span>
                                                    )
                                            }
                                        </td>
                                        {/* Asana  */}
                                        <td className="p-3 bg-[#EFEFEF] w-[18%] min-w-[100px]">
                                            {
                                                data?.asana === 0 ? <Icon icon="radix-icons:cross-2" className="text-lg text-white bg-[#D10303] rounded-sm mx-auto" /> : data?.asana === 1 ?
                                                    <Icon icon="mynaui:check-solid" className="text-lg text-white bg-[#04C828] rounded-sm mx-auto" /> : (
                                                        <span className="text-xs text-[#DC9E00]">Premium</span>
                                                    )
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="FAQs" className="relative z-0 max-w-[1440px] mx-auto px-6 md:px-12 py-8 md:py-16 grid md:grid-cols-2 gap-10 md:gap-12">
                    <div className="text-center md:text-start">
                        {/* <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium shadow-sm mb-4 bg-white">
                <Icon icon="mdi:stars" className="text-blue-600 text-lg" />
                FAQ
                </span> */}
                        {/* Heading */}
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Frequently Asked Questions <br /> &#40; FAQs &#41;
                        </h2>
                        <p className="text-gray-600 max-w-lg">
                            Explore our frequently asked questions to learn more about Dyzo’s features,
                            security, integration capabilities, and more
                        </p>
                    </div>

                    {/* Accordion */}
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="border-b pb-4 cursor-pointer"
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {/* Blue vertical bar (like screenshot) */}
                                        <div className="min-w-[4px] w-1 h-5 bg-blue-600 rounded-full" />
                                        <p className="font-medium text-gray-900">{faq.question}</p>
                                    </div>
                                    <Icon
                                        icon={openIndex === idx ? "mdi:chevron-up" : "mdi:chevron-down"}
                                        className="text-gray-500 min-w-[20px] w-5 h-5"
                                    />
                                </div>

                                <AnimatePresence>
                                    {openIndex === idx && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="text-gray-600 mt-2 pl-4 text-sm"
                                        >
                                            {faq.answer}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </section>

                {/*  */}
                <section className="relative z-0">
                    {/* <div
                className="absolute w-[400px] h-[400px] xl:w-[450px] xl:h-[450px] 2xl:w-[600px] 2xl:h-[600px] rounded-full blur-[140px] xl:blur-[200px] -right-28 xl:right-20 bottom-80 xl:-bottom-10 -z-10 "
                style={{
                background: "radial-gradient(circle, #A026FF 0%, transparent 60%)",
                }}
            /> */}
                    <div className="relative max-w-[1440px] mx-auto py-8 md:py-16 px-0 md:px-6 2xl:px-0">
                        <div className=" px-6 md:px-12 py-8 md:py-16 bg-blue-600 md:rounded-2xl grid md:grid-cols-2 md:gap-20">
                            <div className="flex-1 text-center md:text-start">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                    Simplify Project, Task, and Client Management — All in One Platform
                                </h2>
                                <Link to="/register" className="inline-flex px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 mt-10 mb-1 items-center gap-2 hover:gap-5 bg-gradient-to-r from-white/20 to-white/20 mx-auto md:mx-0hover:from-white/30 hover:to-white/30  border border-transparent hover:border-white/50">
                                    <span className="text-xs">Start Free Trial</span>
                                    <Icon icon="mingcute:arrow-right-fill" className="text-white text-lg" />
                                </Link>
                                <p className="text-xs text-white">No credit card required. Cancel anytime.</p>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-white/10 to-white/20 rounded-md">
                                    <div className="bg-white/20 h-14 w-14 flex items-center justify-center rounded-md">
                                        <img src={instantAccessIcon} className="w-6" alt="" />
                                    </div>
                                    <div>
                                        <h4 className="text-white text-base">Instant Access</h4>
                                        <p className="text-white/80 text-xs font-light">Begin exploring Dyzo's full suite of features immediately</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-white/10 to-white/20 rounded-md">
                                    <div className="bg-white/20 h-14 w-14 flex items-center justify-center rounded-md">
                                        <img src={noCommitmentsIcon} className="w-6" alt="" />
                                    </div>
                                    <div>
                                        <h4 className="text-white text-base">No Commitments</h4>
                                        <p className="text-white/80 text-xs font-light">No credit card required, and you can cancel anytime</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-white/10 to-white/20 rounded-md">
                                    <div className="bg-white/20 h-14 w-14 flex items-center justify-center rounded-md">
                                        <img src={dadicatedSupportIcon} className="w-6" alt="" />
                                    </div>
                                    <div>
                                        <h4 className="text-white text-base">Dedicated Support</h4>
                                        <p className="text-white/80 text-xs font-light">Our team is here to assist you every step of the way during your trial.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <Footer />
            </div>
        </div>
    );
};

export default Index;
