import React, { createContext, useState, useEffect } from "react";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import Confetti from "react-confetti";

export const TourContext = createContext();

export const TourProvider = ({ children }) => {
    const [tour, setTour] = useState(null);
    const [isTourRunning, setIsTourRunning] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false); // State to show/hide confetti
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const location = useLocation();
    const navigate = useNavigate();
    const [showCelebration, setShowCelebration] = useState(false);
    const userInfo = useSelector((state) => state.auth.user);
    const [showNotification, setShowNotification] = useState(false);

    const waitForElement = (selector, timeout = 30000, interval = 100) => {
        return new Promise((resolve, reject) => {
            const endTime = Date.now() + timeout;
            const check = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                } else if (Date.now() > endTime) {
                    reject(
                        new Error(`Element ${selector} not found within ${timeout}ms`)
                    );
                } else {
                    setTimeout(check, interval);
                }
            };
            check();
        });
    };

    const detectPlatform = () => {
        const platform = window.navigator.platform.toLowerCase();
        if (platform.includes("win")) {
            return "windows";
        } else if (platform.includes("mac")) {
            return "mac";
        }
        return "unknown";
    };

    const getDownloadLink = () => {
        const platform = detectPlatform();
        if (platform === "windows") {
            return "https://staging.api.dyzo.ai/downloads/windows/latest-build";
        } else if (platform === "mac") {
            return "https://github.com/prpwebsteam/dyzo-desktop-app/releases/download/mac1.0.1/Dyzo.AI-1.0.16.dmg";
        }
        return "#";
    };

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        const tourInstance = new Shepherd.Tour({
            defaultStepOptions: {
                classes: "shepherd-theme-default",
                scrollTo: { behavior: "smooth", block: "center" },
                arrow: true,
                cancelIcon: {
                    enabled: true,
                },
                useModalOverlay: false,
            },
        });

        tourInstance.on("cancel", () => {
            setIsTourRunning(false);
            closeModal();
        });

        setTour(tourInstance);
        setInitialized(true);

        return () => {
            if (tourInstance) tourInstance.cancel();
        };
    }, []);

    useEffect(() => {
        const currentPath = location.pathname;
        const validPaths = ["/projects", "/tasks", "/invite-user", "/dashboard"];
        if (tour && isTourRunning && !validPaths.includes(currentPath)) {
            tour.cancel({
                cancelCallback: () => {
                    setIsTourRunning(false);
                    closeModal();
                }
            });
        }
    }, [location.pathname, tour, isTourRunning]);

    const loadStepsForPath = (tourInstance, currentPath) => {
        tourInstance.steps = [];
        const isMobile = window.innerWidth <= 768;

        // Step configuration for the "/projects" path
        if (currentPath === "/projects") {
            tourInstance.addStep({
                title: "Project Guide",
                text: "Click on the 'Add Project' button to start adding a new project.",
                attachTo: {
                    element: ".add-project-btn",
                    on: isMobile ? "top" : "bottom",
                },
                buttons: [
                    {
                        text: "Next",
                        action: async () => {
                            navigate("/tasks");
                            tourInstance.hide();
                            try {
                                await waitForElement(".task-stepFirst", 30000);
                                loadStepsForPath(tourInstance, "/tasks");
                                tourInstance.show(0);
                                closeModal();
                            } catch (error) {
                                console.error(error);
                                // alert("The next step's element was not found in time. Please try again.");
                            }
                        },
                    },
                ],
            });
        }

        // Step configuration for the "/tasks" path
        else if (currentPath === "/tasks") {
            tourInstance.addStep({
                title: "Task Guide",
                text: "Click 'Add Task' to add a new task.",
                attachTo: {
                    element: ".task-stepFirst",
                    on: isMobile ? "top" : "bottom",
                },
                buttons: [
                    {
                        text: "Next",
                        action: async () => {
                            navigate("/invite-user");
                            tourInstance.hide();
                            try {
                                await waitForElement(".invite-user-element", 30000);
                                loadStepsForPath(tourInstance, "/invite-user");
                                tourInstance.show(0);
                                closeModal();
                            } catch (error) {
                                console.error(error);
                                // alert("The next step's element was not found in time. Please try again.");
                            }
                        },
                    },
                ],
            });
        }

        // Step configuration for the "/invite-user" path
        else if (currentPath === "/invite-user") {
            tourInstance.addStep({
                title: "Add Employee Guide",
                text: "Add multiple emails to invite your company's employees.",
                attachTo: {
                    element: ".InviteEmployee",
                    on: isMobile ? "top" : "bottom",
                },
                buttons: [
                    {
                        text: "Next",
                        action: async () => {
                            navigate("/dashboard");
                            tourInstance.hide();
                            try {
                                await waitForElement(".download-app-element", 30000);
                                loadStepsForPath(tourInstance, "/dashboard");
                                tourInstance.show(0);
                                closeModal();
                            } catch (error) {
                                console.error(error);
                                // alert("The next step's element was not found in time. Please try again.");
                            }
                        },
                    },
                ],
            });
        }

        // Step configuration for the "/dashboard" path
        else if (currentPath === "/dashboard") {
            tourInstance.addStep({
                title: "Timer App",
                text: "Download the desktop application for tracking your time.",
                buttons: [
                    {
                        text: "Download",
                        action: () => {
                            const link = getDownloadLink();
                            window.open(link, "_blank");
                            tourInstance.hide();
                            setTimeout(() => {
                                // Add the final step
                                tourInstance.addStep({
                                    title: "Finish Tour",
                                    text: "Thank you for downloading! Click finish to complete the tour.",
                                    buttons: [
                                        {
                                            text: "Finish",
                                            action: () => {
                                                setShowConfetti(true); // Show confetti
                                                tourInstance.complete();
                                                setIsTourRunning(false);
                                                setTimeout(() => {
                                                    setShowConfetti(false); // Hide confetti after a few seconds
                                                }, 5000);
                                            },
                                        },
                                    ],
                                });
                                tourInstance.show(1);
                            }, 1000);
                        },
                    },
                ],
            });
        }
    };

    useEffect(() => {
        if (initialized && tour) {
            loadStepsForPath(tour, location.pathname);
            if (isTourRunning) {
                tour.start();
            }
        }
    }, [initialized, tour, location.pathname]);

    const startTour = () => {
        if (tour && !isTourRunning) {
            setIsTourRunning(true);
            tour.start();
        }
    };

    const stopTour = () => {
        if (tour) {
            tour.cancel();
            setIsTourRunning(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <TourContext.Provider
            value={{
                startTour,
                stopTour,
                isTourRunning,
                isModalOpen,
                closeModal,
                showCelebration,
            }}
        >
            {isTourRunning && (
                <div className="tour-overlay"></div>
            )}
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    numberOfPieces={500}
                />
            )}
            {children}
        </TourContext.Provider>
    );
};

export default TourProvider;
