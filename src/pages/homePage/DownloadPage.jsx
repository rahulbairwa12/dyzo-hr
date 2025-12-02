import React, { useEffect, useState } from 'react';
import Header from "./Header";
import Footer from "./Footer";
import HeroBG from "./images/heroBG.webp"
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import timerApp from "./images/timerApp.webp";
import instantAccessIcon from "./images/instant-access.png"
import noCommitmentsIcon from "./images/no-commitments.png"
import dadicatedSupportIcon from "./images/dadicated-support.png"
import WorkFromAnywhere from "./images/WorkFromAnywhere.webp"
import EasyToUse from "./images/EasyToUse.webp"
import HighSpeed from "./images/HighSpeed.webp"

const DownloadPage = () => {
    const [currentOS , setCurrentOS] = useState({})
    
    const appVersions = [
        {
            os:"windows",
            version:"1.0.23",
            name:"Windows",
            url:"https://staging.api.dyzo.ai/downloads/windows/latest-build",
            support:"",
            icon:"uiw:windows"
        },
        {
            os:"mac",
            version:"1.0.23",
            name:"macOS",
            url:"https://staging.api.dyzo.ai/downloads/mac/latest-build",
            support:"",
            icon:"uiw:apple"
        },
        {
            os:"linux",
            version:"1.0.23",
            name:"Linux",
            url:"https://staging.api.dyzo.ai/downloads/linux/latest-build",
            support:"",
            icon:"uiw:linux"
        },
    ]

    useEffect(() => {
        const platform = navigator.platform.toLowerCase();
        let osKey = "unknown";
        if (platform.includes("win")) {
            osKey = "windows";
        } else if (platform.includes("mac")) {
            osKey = "mac";
        } else if (platform.includes("linux")) {
            osKey = "linux";
        }
        const osData = appVersions.find(os => os.os === osKey) || { os: "unknown" };
        setCurrentOS(osData);
    }, []);

    const highlights = [
        {
            icon:WorkFromAnywhere,
            title:"Work from Anywhere",
            para:"Access your desktops securely, no matter where you are."
        },
        {
            icon:EasyToUse,
            title:"Easy to use",
            para:"Designed for everyone, no learning curve needed."
        },
        {
            icon:HighSpeed,
            title:"High-Speed, Low-Latency",
            para:"Real-time response for smooth control."
        },
    ]

    const handleDownload = (url)=>{
        if(!url) return;
        window.open(url, "_blank")
    }

  return (
    <div className="bg-white w-full">
            <Header />
            <div className="overflow-hidden bg-gray-100">

                {/* Hero Section */}
                <div className="bg-gray-100 w-full"
                    style={{
                        backgroundImage: `url(${HeroBG})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}>
                    <section className="relative z-0 max-w-[1440px] mx-auto px-6 md:px-12 py-8 md:py-16 text-center">
                        <div
                            className="absolute w-[400px] h-[400px] xl:w-[450px] xl:h-[450px] 2xl:w-[540px] 2xl:h-[540px] rounded-full blur-[140px] xl:blur-[200px] -left-20 xl:-left-40 -bottom-0 xl:-bottom-0 -z-10"
                            style={{
                                background: "radial-gradient(circle, #A026FF 0%, transparent 50%)",
                            }}
                        />
                        {/* <p className="text-xl text-gray-900 mt-4 md:mt-20">Remote Control Chrome OS from Anywhere</p> */}
                        <h1 className="text-4xl md:text-6xl max-w-3xl mx-auto font-extrabold text-gray-900 leading-tight my-8">Remote Desktop Software for Your Team</h1>
                        <div className=" my-6 md:my-12 space-y-4">
                            <p className="text-base font-light text-gray-900 max-w-5xl mx-auto">Dyzo lets you securely access and manage your work computers from anywhere — whether you’re using Windows, macOS, or Linux. Empower your team to stay productive with seamless, high-speed remote desktop connectivity designed for collaboration, monitoring, and management.</p>
                            <p className="text-base font-light text-gray-900">By downloading and using Dyzo, you accept our <a className="text-black-500 font-medium underline underline-offset-4 decoration-2" href="/terms-and-conditions">Terms & Conditions</a> and our <a className="text-black-500 font-medium underline underline-offset-4 decoration-2 " href="/privacy-policy">Privacy Policy</a></p>
                        </div>
                        {
                            currentOS?.os !== "unknown" &&
                            <button className="px-5 md:px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition text-sm md:text-base items-center gap-2 w-fit mx-auto hidden md:flex" 
                            onClick={()=>handleDownload(currentOS?.url)}
                            >
                            <Icon icon={currentOS?.icon} className="text-xl" /> Download Now
                            </button>
                        }
                    </section>
                </div>

                {/* App Versions Section */}
                <section className="max-w-[1440px] mx-auto px-6 py-8 md:py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 max-w-3xl mx-auto items-center gap-8">
                        {
                            appVersions?.map((data , i)=>(
                                <div key={i} className="w-full bg-blue-600 p-3 rounded-md">
                                    <div className="p-3">
                                        <Icon icon={data?.icon} className="text-5xl text-white mx-auto" /> 
                                        <span className="text-xl text-white font-light block my-2 text-center">{data?.name}</span>
                                        <span className="text-base text-white font-light block my-2 text-center">v{data?.version}</span>
                                    </div>
                                    <button className="text-blue-600 w-full text-center py-2 rounded-lg bg-white transition-colors duration-300 flex items-center justify-center gap-1 hover:bg-blue-500 hover:text-white font-semibold"
                                    onClick={()=>handleDownload(data?.url)}
                                    >
                                    <Icon icon="line-md:download-loop" className="text-2xl" />    
                                    Download</button>
                                </div>
                            ))
                        }
                    </div>
                </section>

                {/*  */}
                <section className="relative z-0 max-w-[1440px] mx-auto px-6 py-8 md:py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6" >
                        <div >
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight my-6 text-center md:text-start">Your Remote Desktop Software for Team</h2>
                            <p className="text-base font-light text-gray-900">
                                Empower your workforce to work from anywhere with Dyzo Remote — a secure, high-speed remote desktop software built for modern teams. Whether you're managing systems, supporting clients, or collaborating remotely, Dyzo ensures effortless access, crystal-clear performance, and enterprise-grade security — across every device.
                            </p>
                        </div>
                        <div >
                            <img src={timerApp} alt="img" />
                        </div>
                    </div>
                    <div
                        className="absolute w-[400px] h-[400px] xl:w-[450px] xl:h-[450px] 2xl:w-[600px] 2xl:h-[600px] rounded-full blur-[140px] xl:blur-[180px] -right-0 -bottom-80 xl:-bottom-20 -z-10"
                        style={{
                            background: "radial-gradient(circle, #A026FF 0%, transparent 50%)",
                        }}
                    />
                </section>

                {/* Why Teams Trust Dyzo Remote */}
                <section className="max-w-[1440px] mx-auto px-6 py-8 md:py-16 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight my-6 ">Why Teams Trust Dyzo Remote</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-12 xl:m-16 mt-12">
                        {
                            highlights?.map((data , i)=>(
                            <div key={i}>
                                <img src={data?.icon} alt={data?.title} className="w-40 mx-auto" />
                                <h3 className="text-xl md:text-xl font-semibold text-gray-900 leading-tight mt-4">{data?.title}</h3>
                                <p className="text-gray-900 text-base font-normal leading-7">{data?.para}</p>
                            </div>
                            ))
                        }
                    </div>
                </section>

                {/*  */}
                <section className="relative z-0">
                    <div
                        className="absolute w-[400px] h-[400px] xl:w-[450px] xl:h-[450px] 2xl:w-[500px] 2xl:h-[500px] rounded-full blur-[140px] xl:blur-[180px] -right-28 xl:right-20 bottom-80 xl:-bottom-0 -z-10 "
                        style={{
                        background: "radial-gradient(circle, #A026FF 0%, transparent 60%)",
                        }}
                    />
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
  )
}

export default DownloadPage