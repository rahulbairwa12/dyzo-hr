import React, { useState, useRef, useEffect } from "react";
import Card from "../../components/ui/Card";
import Switch from "../../components/ui/Switch";
import Textinput from "@/components/ui/Textinput";
import Icon from "@/components/ui/Icon";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchPOST, fetchAuthPatch, fetchGET, fetchAuthGET } from "@/store/api/apiSlice";
import displayRazorpay from "./dispalyrazorpay";
import { toast } from "react-toastify";
import NewPlanSkeleton from "@/components/skeleton/planSkelaton";
import useWidth from "@/hooks/useWidth";
import { getPlanId } from "@/config/razorpay.config";
import { ProfilePicture } from "@/components/ui/profilePicture";


const NewPlan = () => {
    const [teamSize, setTeamSize] = useState(0);
    const [billingCycle, setBillingCycle] = useState("monthly");
    const [showTooltip, setShowTooltip] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showAdminRequiredModal, setShowAdminRequiredModal] = useState(false);
    const [currentEmployeeCount, setCurrentEmployeeCount] = useState(0);
    const [loadingCompanyData, setLoadingCompanyData] = useState(true);
    const [additionalUsers, setAdditionalUsers] = useState(0);
    const [companyEmployeeCount, setCompanyEmployeeCount] = useState(0);
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [currency, setCurrency] = useState("INR");
    const [currencySymbol, setCurrencySymbol] = useState("₹");
    const [customerId, setCustomerId] = useState("");
    const [showProcessingModal, setShowProcessingModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState({
        amount: 0,
        users: 0,
        timestamp: null
    });
    const [success, setSuccess] = useState(false);
    const [isAddingUsers, setIsAddingUsers] = useState(false);
    const [userToAdd, setUserToAdd] = useState(1);
    const [modifyApiResponse, setModifyApiResponse] = useState(null);
    const [isIndianUser, setIsIndianUser] = useState(true);
    const [loadingLocation, setLoadingLocation] = useState(true);

    // New state variables for remaining invite count logic
    const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
    const [activeUsersCount, setActiveUsersCount] = useState(0);
    const [employeeLimit, setEmployeeLimit] = useState(0);

    const dropdownRef = useRef(null);
    const userInfo = useSelector((state) => state.auth.user);
    const { subscriptionData } = useSelector((state) => state.plan);
    const navigate = useNavigate();
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const [activeSubscriptionDetails, setActiveSubscriptionDetails] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [loadingSubscription, setLoadingSubscription] = useState(false);
    const [planId, setPlanId] = useState(getPlanId(true));
    const { width, breakpoints } = useWidth();
    const isMobile = width < 768;


    // Check if user is authenticated
    const isAuthenticated = !!userInfo;

    // Check if user is admin
    const isAdmin = userInfo?.isAdmin === true;
    const companyId = userInfo?.companyId;

    // Price per user (default to India pricing)
    const [pricePerUser, setPricePerUser] = useState(75);
    // const annualDiscount = 0.15; // 15% discount for annual billing - HIDDEN

    // Lock background scroll when any modal is open
    useEffect(() => {
        const anyModalOpen =
            (showConfirmationModal && isAddingUsers) ||
            showSuccessModal ||
            showProcessingModal ||
            showAuthModal ||
            showAdminRequiredModal;

        const html = document.documentElement;
        const body = document.body;

        if (anyModalOpen) {
            const scrollbarWidth = window.innerWidth - html.clientWidth;
            if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
            html.style.overflow = body.style.overflow = 'hidden';
        } else {
            html.style.overflow = body.style.overflow = '';
            body.style.paddingRight = '';
        }

        return () => {
            html.style.overflow = body.style.overflow = '';
            body.style.paddingRight = '';
        };
    }, [
        showConfirmationModal,
        isAddingUsers,
        showSuccessModal,
        showProcessingModal,
        showAuthModal,
        showAdminRequiredModal,
    ]);

    const detectUserLocation = async () => {
        try {
            setLoadingLocation(true);
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            // Check if the user is in India
            const isIndia = data.country === 'IN';
            setIsIndianUser(isIndia);

            // Set currency and price based on location
            if (isIndia) {
                setCurrency("INR");
                setCurrencySymbol("₹");
                setPricePerUser(75);
                setPlanId(getPlanId(true)); // India plan ID
            } else {
                setCurrency("USD");
                setCurrencySymbol("$");
                setPricePerUser(1); // $1 per user
                setPlanId(getPlanId(false)); // Non-India plan ID
            }
        } catch (error) {
            console.error("Error detecting location:", error);
            // Default to India settings if location detection fails
            setCurrency("INR");
            setCurrencySymbol("₹");
            setPricePerUser(75);
            setPlanId(getPlanId(true));
        } finally {
            setLoadingLocation(false);
            updatePageLoadingState();
        }
    };

    const initializeSettings = () => {
        // Detect user location and set appropriate currency and pricing
        detectUserLocation();
    };

    // Run initialization on component mount
    useEffect(() => {
        initializeSettings();
    }, []);

    // Calculate remaining slots for invite count logic
    const remainingSlots = Math.max(0, employeeLimit - activeUsersCount - pendingInvitesCount);

    const fetchCompanyData = async () => {
        try {
            setLoadingCompanyData(true);
            // Using the provided direct API endpoint
            const data = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/company/${companyId}/`);

            if (data && data.active_users_count !== undefined) {
                const companyEmployeeCount = data.employee_limit;
                const totalEmployees = data.active_users_count;

                setCurrentEmployeeCount(companyEmployeeCount);
                setCompanyEmployeeCount(totalEmployees);

                // Set the values for remaining invite count logic
                setActiveUsersCount(totalEmployees);
                setEmployeeLimit(companyEmployeeCount);

                // Keep teamSize at its default value (0) - don't override it
                setAdditionalUsers(Math.max(0, totalEmployees - companyEmployeeCount));
            } else {

            }
        } catch (error) {
            console.error("Error fetching company data:", error);
        } finally {
            setLoadingCompanyData(false);
            updatePageLoadingState();
        }
    };

    // Function to fetch pending invites count
    const fetchPendingInvites = async () => {
        try {
            const response = await fetchAuthGET(
                `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo.companyId}/invited-employees/`
            );
            const data = response.data;
            if (data && data.pending_count !== undefined) {
                setPendingInvitesCount(data.pending_count);
            }
        } catch (e) {
            setPendingInvitesCount(0);
        }
    };

    const updatePageLoadingState = () => {
        // Only set pageLoading to false when all data fetching operations are complete
        if (!loadingCompanyData && !loadingEmployees && !loadingSubscription && !loadingLocation) {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyData();
        fetchEmployees(); // Fetch employees data on page load
        fetchPendingInvites(); // Fetch pending invites count on page load
    }, []);

    // Fetch employees data
    const fetchEmployees = async () => {
        if (!isAuthenticated || !companyId) return;

        try {
            setLoadingEmployees(true);
            setPageLoading(true);

            // Fetch active employees
            const employeeResponse = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/employee/list/${userInfo.companyId}/`);
            let activeEmployees = [];
            if (employeeResponse && Array.isArray(employeeResponse.data)) {
                activeEmployees = employeeResponse.data
                    .filter(emp => emp.isActive === true) // Only include employees with isActive: true
                    .map(emp => ({
                        ...emp,
                        status: 'Active',
                        isPending: false
                    }));
            }

            // Fetch pending invites
            const inviteResponse = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo.companyId}/invited-employees/`);
            let pendingInvites = [];
            if (inviteResponse && inviteResponse.data && Array.isArray(inviteResponse.data)) {
                // Filter to only show invites where is_accepted is false (truly pending)
                const trulyPendingInvites = inviteResponse.data.filter(invite => invite.is_accepted === false);
                pendingInvites = trulyPendingInvites.map(invite => ({
                    _id: invite.id,
                    email: invite.email,
                    first_name: invite.email.split('@')[0],
                    last_name: '',
                    name: invite.email,
                    profile_picture: null,
                    status: 'Pending',
                    isPending: true,
                    isActive: false,
                    invited_by_name: invite.invited_by_name,
                    created_date: invite.created_date
                }));
            }

            // Combine active employees and pending invites
            const combinedUsers = [...activeEmployees, ...pendingInvites];
            setEmployees(combinedUsers);

        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setLoadingEmployees(false);
            updatePageLoadingState();
        }
    };

    // Toggle employee dropdown
    const toggleEmployeeDropdown = () => {
        setShowEmployeeDropdown(!showEmployeeDropdown);
    };

    // Handle toggling user active status
    const handleToggleStatus = async (e, userId, currentStatus) => {
        e.stopPropagation(); // Prevent triggering dropdown close
        try {
            const response = await fetchAuthPatch(
                `${import.meta.env.VITE_APP_DJANGO}/employee/${userId}/`,
                { body: { isActive: !currentStatus } }
            );
            if (response && response.message) {
                // Update local state to reflect the change
                setEmployees(prev =>
                    prev.map(emp => emp._id === userId ? { ...emp, isActive: !currentStatus } : emp)
                );
                fetchCompanyData();
                toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
            } else {
                toast.error("Failed to update user status");
            }
        } catch (error) {
            console.error("Error updating user status:", error);
            toast.error("Failed to update user status");
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowEmployeeDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Handle redirecting to login or signup
    const handleAuthRedirect = (path) => {
        setShowAuthModal(false);
        navigate(path);
    };

    // Calculate total cost based on team size and billing cycle
    const calculateTotalCost = () => {
        // Charge for all users without free tier
        const usersToCharge = teamSize;
        const monthlyTotal = usersToCharge * pricePerUser;

        // Always return monthly total
        return Math.round(monthlyTotal * 100) / 100;
    };

    // Calculate per user cost
    const calculatePerUserCost = () => {
        // HIDDEN ANNUAL BILLING LOGIC
        // if (billingCycle === "annually") {
        //     // Annual per user cost with discount (per month)
        //     return pricePerUser * (1 - annualDiscount);
        // } else {
        //     return pricePerUser;
        // }

        // Always return monthly price
        return pricePerUser;
    };

    // Calculate percentage for slider position based on team size
    const calculatePercentage = (size) => {
        // Convert team size to percentage position (0-100 range)
        return Math.min(Math.max(size, 0), 100);
    };

    // Calculate team size from percentage position
    const calculateTeamSize = (percentage) => {
        // Convert percentage to team size (0-100 range)
        const value = Math.min(Math.max(Math.round(percentage), 0), 100);
        return value;
    };

    // Handle input change
    const handleInputChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        // Allow 0-100 range without minimum employee count restriction
        setTeamSize(Math.min(Math.max(value, 0), 100));
        setAdditionalUsers(Math.max(0, value - currentEmployeeCount));
    };

    // Toggle billing cycle - HIDDEN
    // const toggleBillingCycle = () => {
    //     setBillingCycle(billingCycle === "monthly" ? "annually" : "monthly");
    // };

    // Handle any action that requires authentication and admin privileges
    const handleAuthAndAdminCheck = (callback) => {
        // First check if user is authenticated
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        // Then check if user is admin
        if (!isAdmin) {
            setShowAdminRequiredModal(true);
            return;
        }

        // If both checks pass, execute the callback
        callback();
    };

    // Handle dashboard navigation for free plan
    const handleNavigateDashboard = () => {
        navigate("/dashboard");
    };

    // Check if user has an active subscription
    const checkSubscriptionStatus = async () => {
        if (!isAuthenticated || !companyId) {
            setPageLoading(false);
            return;
        }

        try {
            setLoadingSubscription(true);
            // Use query parameter format as requested
            const response = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/api/company/subscription/?company_id=${companyId}`);

            // Handle new response structure
            if (response && response.active_subscription) {
                setHasActiveSubscription(true);
                setActiveSubscriptionDetails(response.active_subscription);
            } else if (response && response.pending_subscriptions && response.pending_subscriptions.length > 0) {
                // If there's a pending subscription, let the user know but don't treat it as active
                setHasActiveSubscription(false);
                toast.info("You have a pending subscription awaiting payment or approval. Please check your payment status.", {
                    autoClose: 7000,
                });
            } else {
                setHasActiveSubscription(false);
                setActiveSubscriptionDetails(null);
            }
        } catch (error) {
            console.error("Error checking subscription status:", error);
            setHasActiveSubscription(false);
            setActiveSubscriptionDetails(null);
        } finally {
            setLoadingSubscription(false);
            updatePageLoadingState();
            setPageLoading(false);
        }
    };

    // Call this function when component loads
    useEffect(() => {
        if (isAuthenticated && companyId) {
            setPageLoading(true);
            fetchCompanyData();
            checkSubscriptionStatus();
        } else {
            setPageLoading(false);
        }
    }, [isAuthenticated, companyId]);

    // Add additional useEffect to ensure skeleton is hidden when loading is complete
    useEffect(() => {
        updatePageLoadingState();
    }, [loadingCompanyData, loadingEmployees, loadingSubscription]);

    // Set teamSize based on subscription status
    useEffect(() => {
        if (!hasActiveSubscription && activeUsersCount > 0 && teamSize === 0) {
            // If no active subscription, set to active users count
            setTeamSize(activeUsersCount);
        } else if (hasActiveSubscription && teamSize !== 0 && activeUsersCount > 0) {
            // If subscription is active, reset to 0 (for adding additional users)
            setTeamSize(0);
        }
    }, [hasActiveSubscription, activeUsersCount]);

    // Handle subscription creation
    const handleCreateSubscription = async () => {
        // Authentication and admin checks
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        if (!isAdmin) {
            setShowAdminRequiredModal(true);
            return;
        }

        if (teamSize < 1) {
            toast.error("Please select at least 1 user");
            return;
        }

        // Check for an existing subscription first
        try {
            const response = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/api/company/subscription/?company_id=${companyId}`);

            // Check for active subscription
            if (response && response.active_subscription) {
                setHasActiveSubscription(true);
                setActiveSubscriptionDetails(response.active_subscription);

                // If an active subscription exists, redirect to add user page or show information
                toast.info("You already have an active subscription. Use the add users page to add more users.", {
                    autoClose: 5000,
                    position: toast.POSITION.TOP_CENTER
                });

                // Option to navigate to add user page
                if (confirm("Would you like to navigate to the add users page?")) {
                    navigate('/add-users');
                }
                return;
            }

            // Check for pending subscriptions

        } catch (error) {
            console.error("Error checking subscription:", error);
            // Continue with creating a new subscription if the check fails
        }

        setLoading(true);
        try {
            // Prepare subscription payload according to backend expectations
            const subscriptionPayload = {
                company_id: companyId,
                quantity: teamSize,
                razorpay_plan_id: planId,
                employee_id: userInfo?._id,
                currency: currency,
                billing_cycle: billingCycle === "annually" ? "yearly" : "monthly"
            };

            // Use the new subscription API endpoint for first-time subscribers
            const response = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/company/subscription/`, {
                body: subscriptionPayload
            });

            if (response) {
                // Check for errors in response
                if (response.error) {
                    throw new Error(response.error);
                }

                // Handle the updated API response structure
                if (response.status === 1 && response.data) {
                    toast.success(response.message || "Subscription created successfully! Opening payment...");

                    // If we have subscription details in the data
                    if (response.data.subscription_details) {
                        const subDetails = response.data.subscription_details;

                        // Always use displayRazorpay for payment
                        await displayRazorpay(
                            response.data.subscription_id,
                            response.data.next_due_amount, // Amount in rupees/dollars
                            currency,
                            userInfo,
                            response.data.quantity,
                            {
                                title: `${billingCycle === "annually" ? "Annual" : "Monthly"} subscription for ${response.data.quantity} user${response.data.quantity !== 1 ? 's' : ''}`,
                                description: `Subscription for ${response.data.quantity} user${response.data.quantity !== 1 ? 's' : ''}`,
                                subscription_id: response.data.subscription_id,
                                plan_id: planId,
                                quantity: response.data.quantity,
                                currency: currency,
                                price_per_unit: response.data.price_per_unit
                            },
                            billingCycle,
                            navigate,
                            true
                        );
                    }
                } else {
                    // Handle old response structure for backward compatibility
                    if (response.active_subscription || response.subscription_details) {
                        const subDetails = response.active_subscription || response.subscription_details;

                        await displayRazorpay(
                            subDetails.current_sub_id,
                            parseFloat(subDetails.total_amount), // Amount in rupees/dollars
                            currency,
                            userInfo,
                            teamSize,
                            {
                                title: `${billingCycle === "annually" ? "Annual" : "Monthly"} subscription for ${teamSize} user${teamSize !== 1 ? 's' : ''}`,
                                description: `Subscription for ${teamSize} user${teamSize !== 1 ? 's' : ''}`,
                                subscription_id: subDetails.current_sub_id,
                                plan_id: planId,
                                quantity: teamSize,
                                currency: currency
                            },
                            billingCycle,
                            navigate,
                            true
                        );
                    } else if (response.razorpay_short_url) {
                        // Convert short URL redirect to Razorpay popup if possible
                        toast.error("Direct checkout needed but not available. Please try again.");
                    }
                }
            } else {
                // Handle error
                throw new Error("Failed to create subscription");
            }
        } catch (error) {
            // Handle error
            toast.error(error.message || "Failed to create subscription. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Add User function - can be called from this page or linked to add-user page
    const handleAddUsers = async () => {
        if (!isAuthenticated || !isAdmin) {
            toast.error("Authentication required");
            return;
        }

        if (!activeSubscriptionDetails) {
            toast.error("No active subscription found");
            return;
        }

        // Validate teamSize
        if (teamSize < 1) {
            toast.error("Please select at least 1 user");
            return;
        }

        // Don't close modal yet - we'll close it after Razorpay loads
        // setShowConfirmationModal(false);

        // Set loading state
        setLoading(true);

        try {
            // Calculate total amount for new users using teamSize
            const totalAmount = teamSize * pricePerUser;

            // Calculate new total users using teamSize
            const totalUsers = (activeSubscriptionDetails?.quantity || 0) + teamSize;

            // Use the subscription modification API endpoint for existing subscribers
            const updateResponse = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/api/company/subscription/modify/`, {
                body: {
                    company_id: companyId,
                    quantity: totalUsers,
                    razorpay_plan_id: planId,
                    employee_id: userInfo?._id,
                    currency: currency,
                    token_amount: totalAmount,
                    payment_type: "token_amount",
                    // Optional: Set to true to immediately cancel previous subscription
                    cancel_previous: false
                }
            });

            // Store the modify API response for later use
            setModifyApiResponse(updateResponse);

            if (updateResponse) {
                // Check for activation errors
                if (updateResponse.error) {
                    throw new Error(updateResponse.error);
                }

                // Show success message
                toast.success(updateResponse.message || "Processing subscription update...");

                // Handle the case where razorpay_subscription_id is directly in the response
                if (updateResponse.razorpay_subscription_id) {
                    // Determine the correct amount to charge
                    // token_amount_rupees is in rupees, token_amount is in paise
                    let amountToCharge = totalAmount; // Default to calculated amount

                    if (updateResponse.token_amount_rupees) {
                        // If we have token_amount_rupees, use it (already in rupees)
                        amountToCharge = updateResponse.token_amount_rupees;
                    } else if (updateResponse.token_amount) {
                        // If we have token_amount, convert from paise to rupees
                        amountToCharge = updateResponse.token_amount / 100;
                    } else if (updateResponse.full_amount) {
                        // Otherwise use full_amount if available
                        amountToCharge = updateResponse.full_amount;
                    }

                    try {
                        // Store payment details before displaying Razorpay
                        setPaymentDetails({
                            amount: amountToCharge,
                            fullAmount: updateResponse.full_amount || null,
                            users: teamSize,
                            timestamp: new Date().toISOString()
                        });

                        // Close the confirmation modal now that we have all the details
                        setShowConfirmationModal(false);

                        // Use displayRazorpay for payment - pass amount in rupees
                        await displayRazorpay(
                            updateResponse.razorpay_subscription_id,
                            amountToCharge,
                            currency,
                            userInfo,
                            teamSize,
                            {
                                title: `${updateResponse.payment_type === "token_amount" ? "Token payment for " : ""}Additional Users`,
                                description: `Payment for ${teamSize} additional user${teamSize !== 1 ? 's' : ''}`,
                                subscription_id: updateResponse.razorpay_subscription_id,
                                plan_id: planId,
                                quantity: teamSize,
                                currency: currency,
                                price_per_unit: pricePerUser
                            },
                            billingCycle,
                            navigate,
                            true
                        );

                        // If subscription details are available, update the state
                        if (updateResponse.subscription_details) {
                            // Update subscription details
                            setActiveSubscriptionDetails(updateResponse.subscription_details);
                        }

                        // Success modal will now be shown via the event listener
                        // No need to manually set these states here

                        // Refresh subscription status will be handled in the event listener
                    } catch (error) {
                        // Show error message and reset UI
                        toast.error("Unable to process payment. Please try again.");
                        setLoading(false);
                        // Close the confirmation modal since Razorpay failed
                        setShowConfirmationModal(false);
                        setShowProcessingModal(false);
                    }
                }
                // Handle old response structure with short_url
                else if (updateResponse.razorpay_short_url) {
                    // Instead of redirecting, try to extract subscription ID and use displayRazorpay
                    const subscriptionId = updateResponse.subscription_id || updateResponse.old_subscription_id;
                    if (subscriptionId) {
                        try {
                            // Store payment details before displaying Razorpay
                            setPaymentDetails({
                                amount: totalAmount,
                                fullAmount: null,
                                users: teamSize,
                                timestamp: new Date().toISOString()
                            });

                            // Close the confirmation modal now that we have all the details
                            setShowConfirmationModal(false);

                            await displayRazorpay(
                                subscriptionId,
                                totalAmount,
                                currency,
                                userInfo,
                                teamSize,
                                {
                                    title: `Additional Users Subscription`,
                                    description: `Payment for ${teamSize} additional user${teamSize !== 1 ? 's' : ''}`,
                                    subscription_id: subscriptionId,
                                    plan_id: planId,
                                    quantity: teamSize,
                                    currency: currency
                                },
                                billingCycle,
                                navigate,
                                true
                            );

                            // Success modal will now be shown via the event listener
                            // No need to manually set these states here

                            // Refresh subscription status will be handled in the event listener
                        } catch (error) {
                            // Show error message and reset UI
                            toast.error("Unable to process payment. Please try again.");
                        }
                    } else {
                        toast.error("Could not process payment - missing subscription ID");
                    }
                }
                // If response doesn't include payment information, show error
                else {
                    throw new Error("Invalid response from server. Could not process payment.");
                }
            } else {
                throw new Error("Failed to update subscription");
            }
        } catch (error) {
            toast.error(error.message || "Failed to update subscription quantity");
        } finally {
            setLoading(false);
        }
    };

    // Get percentage based on current team size (keeping for potential future use)
    const currentPercentage = calculatePercentage(teamSize);

    // Create a step array with only 0, 50, and 100 (keeping for potential future use)
    const steps = [0, 50, 100];

    // Calculate the total cost
    const totalCost = calculateTotalCost();
    const perUserCost = calculatePerUserCost();

    // Calculate adjusted additional users for display
    const freeUserAllowance = 0;
    let displayAdditionalUsers = Math.max(0, teamSize - currentEmployeeCount);

    // For price calculations
    const totalUsersToCharge = teamSize;
    const chargableAdditionalUsers = additionalUsers;

    // Desktop app download link (platform-aware)
    const detectPlatformLocal = () => {
        const platform = window.navigator.platform.toLowerCase();
        if (platform.includes("win")) {
            return "windows";
        } else if (platform.includes("mac")) {
            return "mac";
        }
        return "unknown";
    };

    const desktopDownloadLink = (() => {
        const platform = detectPlatformLocal();
        if (platform === "windows") {
            return "https://staging.api.dyzo.ai/downloads/windows/latest-build";
        } else if (platform === "mac") {
            return "https://github.com/prpwebsteam/dyzo-desktop-app/releases/download/mac1.0.1/Dyzo.AI-1.0.16.dmg";
        }
        return "https://staging.api.dyzo.ai/downloads/windows/latest-build";
    })();

    // Features list
    const features = [
        "Live Reporting",
        "Unlimited Screenshots",
        <div className="flex items-center">
            <span>Chrome Extension</span>
            <a
                href="https://chromewebstore.google.com/detail/lajocdihefihpcidhehkiodaibaibjaf?utm_source=item-share-cb"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-600"
            >
                <Icon icon="heroicons-outline:download" className="w-6 h-6" />
            </a>
        </div>,
        <div className="flex items-center">
            <span>Desktop App (Timer)</span>
            <a
                href={desktopDownloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-600"
            >
                <Icon icon="heroicons-outline:download" className="w-6 h-6" />
            </a>
        </div>
    ];

    // Add event listener for the payment processing event
    useEffect(() => {
        const handlePaymentProcessing = (event) => {
            setShowProcessingModal(event.detail);
        };

        const handlePaymentSuccess = (event) => {
            // Set payment details from the event
            const paymentInfo = event.detail;

            // Extract payment amount from our stored modify API response
            let paymentAmount = 0; // Default to 0
            let fullAmount = null;

            // Use data from the modify API response (which has the token_amount_rupees)
            if (modifyApiResponse) {
                if (modifyApiResponse.token_amount_rupees) {
                    paymentAmount = modifyApiResponse.token_amount_rupees;
                }

                if (modifyApiResponse.full_amount) {
                    fullAmount = modifyApiResponse.full_amount;
                }
            }

            // If we have originalAmount from Razorpay options, also try using that
            if (typeof paymentInfo.originalAmount !== 'undefined' && paymentInfo.originalAmount !== null) {
                // If we don't have a value yet from the API response, use the original amount
                if (!paymentAmount) {
                    paymentAmount = paymentInfo.originalAmount;
                }
            }

            // Set the payment details with the extracted values
            setPaymentDetails({
                amount: paymentAmount,
                fullAmount: fullAmount,
                users: paymentInfo.userSize,
                timestamp: paymentInfo.timestamp,
                paymentId: paymentInfo.paymentId,
                subscriptionId: paymentInfo.subscriptionId
            });

            // Update subscription status and company data
            checkSubscriptionStatus();
            fetchCompanyData();

            // Refresh pending invites count to update remaining slots
            fetchPendingInvites();

            // Show success modal
            setSuccess(true);
            setUserToAdd(1); // Reset the user input field
            setShowSuccessModal(true);
        };

        document.addEventListener('razorpay:processing', handlePaymentProcessing);
        document.addEventListener('razorpay:success', handlePaymentSuccess);

        return () => {
            document.removeEventListener('razorpay:processing', handlePaymentProcessing);
            document.removeEventListener('razorpay:success', handlePaymentSuccess);
        };
    }, []);

    if (pageLoading) {
        return <NewPlanSkeleton />;
    }

    return (
        <Card className="overflow-hidden min-h-screen flex items-center justify-center" bodyClass={isMobile ? "p-3 w-full" : "w-full"}>
            {/* Authentication Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-all transform" onClick={e => e.stopPropagation()}>
                        {/* Close button */}
                        <button
                            className="absolute top-4 right-4 text-white hover:text-gray-200 z-10 bg-gray-800 bg-opacity-20 rounded-full p-1"
                            onClick={() => setShowAuthModal(false)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>

                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-8 px-4 text-white text-center">
                            <h3 className="text-xl font-bold">Authentication Required</h3>
                        </div>

                        <div className="p-6 md:p-8">
                            <div className="flex justify-center mb-6">
                                <img
                                    src="/login-illustration.svg"
                                    alt="Authentication"
                                    className="w-40 h-40"
                                    onError={(e) => e.target.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJU1-4BreFHkOCz0ez9P45jPd3NNcZGpVhT3Xh-ht8&s'}
                                />
                            </div>

                            <p className="text-gray-600 mb-8 text-center">
                                Please sign in or create an account to continue. Unlock all features and manage your team effectively!
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleAuthRedirect('/login')}
                                    className="w-full py-3.5 bg-[#7A39FF] text-white rounded-lg hover:bg-[#6930d5] transition duration-300 font-medium shadow-md"
                                >
                                    Sign In
                                </button>

                                <button
                                    onClick={() => handleAuthRedirect('/register')}
                                    className="w-full py-3.5 border border-[#7A39FF] text-[#7A39FF] rounded-lg hover:bg-purple-50 transition duration-300 font-medium"
                                >
                                    Create Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Required Modal */}
            {showAdminRequiredModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={() => setShowAdminRequiredModal(false)}>
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-all transform" onClick={e => e.stopPropagation()}>
                        {/* Close button */}
                        <button
                            className="absolute top-4 right-4 text-white hover:text-gray-200 z-10 bg-gray-800 bg-opacity-20 rounded-full p-1"
                            onClick={() => setShowAdminRequiredModal(false)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>

                        <div className="bg-gradient-to-r from-red-500 to-orange-500 py-8 px-4 text-white text-center">
                            <h3 className="text-xl font-bold">Admin Access Required</h3>
                        </div>

                        <div className="p-6 md:p-8">
                            <div className="flex justify-center mb-8">
                                <div className="rounded-full bg-red-100 p-6">
                                    <svg className="w-14 h-14 text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V8m0 0V6m0 2h2M9 10h2"></path>
                                    </svg>
                                </div>
                            </div>

                            <h4 className="text-xl font-bold text-gray-800 mb-3 text-center">Administrator Access Only</h4>

                            <p className="text-gray-600 mb-8 text-center">
                                Only administrators can purchase plans for the organization. Please contact your administrator to upgrade your plan.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setShowAdminRequiredModal(false)}
                                    className="w-full py-3.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition duration-300 font-medium shadow-md"
                                >
                                    I Understand
                                </button>

                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full py-3.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300 font-medium"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Processing Modal */}
            {showProcessingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8 overflow-hidden transition-all transform">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-20 h-20 relative mb-6">
                                <div className="absolute inset-0 border-t-4 border-b-4 border-[#7A39FF] rounded-full animate-spin"></div>
                                <div className="absolute inset-[6px] border-t-4 border-b-4 border-purple-300 rounded-full animate-spin animation-delay-150"></div>
                                <div className="absolute inset-[12px] border-t-4 border-b-4 border-purple-200 rounded-full animate-spin animation-delay-300"></div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Payment</h3>
                            <p className="text-gray-600 text-center mb-2">
                                Please wait while we process your payment...
                            </p>
                            <div className="text-sm text-gray-500 text-center flex items-center mt-4 border-t border-gray-100 pt-4 w-full">
                                <svg className="w-5 h-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                                <span>Do not close this window or refresh the page.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Users Confirmation Modal */}
            {showConfirmationModal && isAddingUsers && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 backdrop-blur-sm p-1 sm:p-2 md:p-4 lg:p-6 pt-4 sm:pt-8 md:pt-12 lg:pt-16">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all max-h-[85vh] min-h-[350px] flex flex-col">
                        {/* Compact gradient header - Fixed */}
                        <div className="bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#8b5cf6] py-1.5 px-4 text-white relative flex-shrink-0">

                            <div className="text-center">
                                <h3 className="text-base sm:text-lg text-white font-bold">Expand Your Team</h3>
                                <p className="text-white text-xs mt-0.5">Add more users to your workspace</p>
                            </div>
                        </div>

                        {/* Scrollable content section */}
                        <div className="p-5 overflow-y-auto flex-1 min-h-0">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div>
                                        <p className="text-xs text-gray-600">Current Plan</p>
                                        <p className="font-semibold text-gray-900">
                                            {activeSubscriptionDetails?.quantity || 0} Users
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-600">Adding</p>
                                        <p className="font-bold text-[#6366f1]">{teamSize} Users</p>
                                    </div>
                                </div>
                            </div>

                            {/* Compact user input section */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        How many users would you like to add?
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                                            <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-gray-100 border border-gray-200">
                                                <Icon icon="heroicons-outline:users" className="h-4 w-4 text-gray-400" />
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={teamSize}
                                            onFocus={(e) => {
                                                // Select all text when focused for easy replacement
                                                e.target.select();
                                            }}
                                            onChange={(e) => {
                                                const inputValue = e.target.value;
                                                // Allow empty string while typing
                                                if (inputValue === '') {
                                                    setTeamSize(0);
                                                    return;
                                                }
                                                // Only allow numeric input
                                                if (/^\d+$/.test(inputValue)) {
                                                    const value = parseInt(inputValue);
                                                    setTeamSize(Math.min(Math.max(value, 0), 100));
                                                }
                                            }}
                                            onBlur={(e) => {
                                                // Ensure minimum value of 1 when leaving the input
                                                if (teamSize === 0 || e.target.value === '') {
                                                    setTeamSize(1);
                                                }
                                            }}
                                            className="w-full h-12 pl-16 pr-16 text-lg font-bold text-center border-2 border-gray-200 rounded-lg bg-white transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:ring-offset-0"
                                            placeholder="Enter users"
                                        />

                                    </div>
                                </div>

                                {/* Compact price breakdown */}
                                <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                                    <h4 className="font-semibold text-gray-900 text-sm flex items-center">
                                        <Icon icon="heroicons-outline:calculator" className="w-4 h-4 mr-1.5 text-[#6366f1]" />
                                        Price Breakdown
                                    </h4>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-gray-600">Price per user</span>
                                            <span className="font-medium">
                                                {currencySymbol}{pricePerUser.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-gray-600">Users to add</span>
                                            <span className="font-medium">{teamSize}</span>
                                        </div>
                                        <div className="flex justify-between items-center rounded-lg  mt-2">
                                            <span className="font-semibold">Total Amount</span>
                                            <span className="text-lg font-bold text-[#6366f1]">
                                                {currencySymbol}{(teamSize * pricePerUser).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Compact info notice */}
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <Icon icon="heroicons-outline:information-circle" className="h-4 w-4 text-amber-500 mt-0.5" />
                                        </div>
                                        <div className="ml-2">
                                            <p className="text-xs text-amber-700">
                                                We'll collect a small upfront fee now to activate the new users. The complete cost will be reflected in your next invoice.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Fixed footer section */}
                        <div className="space-y-2 p-5 pt-0 flex-shrink-0">
                            {teamSize === 0 ? (
                                <div className="w-full h-11 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center font-semibold text-sm">
                                    <Icon icon="heroicons-outline:information-circle" className="w-4 h-4 mr-2" />
                                    Please select at least 1 user
                                </div>
                            ) : (
                                <button
                                    onClick={handleAddUsers}
                                    className={`w-full h-11 ${loading ? 'bg-indigo-400' : 'bg-gradient-to-r from-[#6366f1] to-[#7c3aed] hover:from-[#5856eb] hover:to-[#6d28d9]'} text-white rounded-lg transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <Icon icon="heroicons-outline:refresh" className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center">
                                            <Icon icon="heroicons-outline:credit-card" className="w-4 h-4 mr-2" />
                                            Pay {currencySymbol}{(teamSize * pricePerUser).toFixed(2)}
                                        </span>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={() => setShowConfirmationModal(false)}
                                className="w-full h-10 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-all duration-200 hover:border-gray-400 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal - Redesigned */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-3">
                    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
                        {/* Header with gradient */}
                        <div className="bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#8b5cf6] pt-4 pb-12 px-4 relative">


                            {/* Success Icon */}
                            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2">
                                <div className="h-20 w-20 rounded-full bg-white shadow-xl flex items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                                        <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-4 pt-12 pb-4">
                            {/* Title */}
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Upgrade Successful</h3>
                                <p className="text-gray-600 text-xs">Your team has been successfully upgraded</p>
                            </div>

                            {/* Details Cards */}
                            <div className="space-y-2.5 mb-4">
                                {/* Added Users Card */}
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-600 mb-0.5">Added Users</p>
                                            <p className="text-2xl font-bold text-indigo-600">{paymentDetails.users}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <Icon icon="heroicons-outline:users" className="w-6 h-6 text-indigo-600" />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Amount Card */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-600 mb-0.5">Payment Amount</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {currencySymbol}{Number(paymentDetails.amount || 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                                <Icon icon="heroicons-outline:check-circle" className="w-6 h-6 text-green-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-green-200">
                                        <div className="flex items-center text-xs text-green-700">
                                            <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                            <span className="font-semibold">Paid Successfully</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1.5 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Updated On</span>
                                    <span className="font-semibold text-gray-900">
                                        {paymentDetails.timestamp && new Date(paymentDetails.timestamp).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Subscription ID</span>
                                    <span className="font-mono font-semibold text-gray-900 truncate ml-2" style={{ maxWidth: "200px" }}>
                                        {paymentDetails.subscriptionId || activeSubscriptionDetails?.current_sub_id || "N/A"}
                                    </span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5856eb] hover:to-[#7c3aed] text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full bg-white">
                <div className="max-w-6xl mx-auto py-4 md:py-8 px-4">
                    {/* Header */}
                    <div className="text-center mb-6 md:mb-12 px-0">
                        <h2 className={`font-lato font-extrabold ${isMobile ? "text-xl" : "text-2xl md:text-[40px]"} leading-[100%] tracking-[0%] text-center text-gray-900`}>Simple, transparent pricing</h2>
                        <p className={`${isMobile ? "text-sm mt-2" : "text-base md:text-lg mt-4"} text-gray-600`}>
                            Enjoy a 30-day free trial for up to 15 users. Upgrade anytime to keep your projects running smoothly.
                        </p>
                        <p className={`${isMobile ? "text-sm" : "text-base md:text-lg"} text-gray-700 mt-1`}>
                            Only {currencySymbol}{pricePerUser} per user per month.
                        </p>
                    </div>
                    <div className="mb-5">
                        <div className="relative" ref={dropdownRef}>
                            <div
                                className="cursor-pointer flex items-center gap-2"
                                onClick={toggleEmployeeDropdown}
                            >
                                <p className=" font-bold text-[16px] md:text-[18px] leading-[100%] tracking-[0%]  mt-2 text-[#7A39FF]">
                                    Current Team Size: {employees.length} {employees.length === 1 ? 'user' : 'users'}
                                </p>
                                <Icon
                                    icon={showEmployeeDropdown ? "heroicons-outline:chevron-up" : "heroicons-outline:chevron-down"}
                                    className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} text-[#7A39FF] mt-2`}
                                />
                            </div>

                            {/* Employee Dropdown */}
                            {showEmployeeDropdown && (
                                <div className={`absolute z-50 mt-2 ${isMobile ? "w-screen -left-3" : "w-full"} max-w-[300px] md:w-96 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200`}>
                                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                                        <div className="font-medium text-lg">All Users</div>
                                        <button
                                            className="text-sm text-blue-600 hover:underline"
                                            onClick={() => navigate("/employees")}
                                        >
                                            View All
                                        </button>
                                    </div>

                                    {loadingEmployees ? (
                                        <div className="p-4 text-center">
                                            <span className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></span>
                                            <p className="mt-2 text-gray-600">Loading employees...</p>
                                        </div>
                                    ) : employees.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            No employees found
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-gray-100">
                                            {/* Pending Users First */}
                                            {employees
                                                .filter(employee => employee.status === 'Pending')
                                                .sort((a, b) => (a.email || '').localeCompare(b.email || ''))
                                                .map((employee) => (
                                                    <li key={employee._id} className="p-3 hover:bg-gray-50">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                                <div className="flex-shrink-0">
                                                                    <ProfilePicture
                                                                        user={employee}
                                                                        className="w-8 h-8 rounded-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                                                        {employee.email?.split('@')[0] || 'Unknown User'}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                                                        {employee.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                                                    Pending
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}

                                            {/* Active Users Second */}
                                            {employees
                                                .filter(employee => employee.status === 'Active')
                                                .sort((a, b) => (a.name || `${a.first_name} ${a.last_name}`).localeCompare(b.name || `${b.first_name} ${b.last_name}`))
                                                .map((employee) => (
                                                    <li key={employee._id} className="p-3 hover:bg-gray-50">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                                <div className="flex-shrink-0">
                                                                    <ProfilePicture
                                                                        user={employee}
                                                                        className="w-8 h-8 rounded-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                                                        {employee.name || `${employee.first_name} ${employee.last_name}`}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                                                        {employee.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                                    Active
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className=" pt-3 text-[16px] md:text-[18px] leading-[100%] tracking-[0%]  mt-2 text-gray-900">Remaining Invites: <span className="text-gray-900">{remainingSlots}</span></p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 md:gap-7">
                        {/* Left Column */}
                        <div className="lg:col-span-4 space-y-6 md:space-y-8">
                            {/* Team Size Input */}
                            <div className={`flex ${isMobile ? "flex-col" : "flex-wrap"} gap-2`}>
                                <span className="  text-[16px] md:text-[18px] leading-[100%] tracking-[0%]  mt-2 text-gray-900">How many additional users do you want to add?</span>
                                <div className={`flex items-center ${isMobile ? "mt-2" : ""}`}>
                                    <input
                                        type="text"
                                        min="0"
                                        step="1"
                                        value={teamSize}
                                        onChange={handleInputChange}
                                        className={`${isMobile ? "w-[90px] h-[30px]" : "w-[80px] md:w-[100px] h-[30px] md:h-[30px]"} font-bold text-gray-900 border-[2px] border-[#C5A8FF] rounded-md px-2 md:px-3 py-1 focus:outline-none  focus:ring-[#C5A8FF]`}
                                    />
                                    <span className="  text-[16px] md:text-[18px] leading-[100%] tracking-[0%]  ml-2 text-gray-700">{teamSize === 1 ? 'User' : 'Users'}</span>
                                </div>
                            </div>


                            {/* Users Section without Slider */}
                            <div>




                                {/* Mobile-only pricing card - appears below slider */}
                                {isMobile && (
                                    <div className="bg-white w-[106%] rounded-lg border-[#C5A8FF] border-[2px] shadow-sm p-5 mt-4 mb-6 -ml-3">
                                        {/* Mobile Monthly/Annually Switch - HIDDEN */}
                                        {/* <div className="flex items-center gap-x-3 mb-6 justify-center">
                                            <span 
                                                className={`font-lato font-bold text-sm leading-[100%] tracking-[0%] ${billingCycle === 'monthly' ? 'text-[#212121]' : 'text-[#888888]'} ${isMobile ? "px-2" : ""}`}
                                                onClick={() => billingCycle !== 'monthly' && toggleBillingCycle()}
                                            >
                                                Monthly
                                            </span>
                                            <div className={`relative inline-block ${isMobile ? "w-14" : "w-12"} align-middle select-none`}>
                                                <input
                                                    type="checkbox"
                                                    name="toggle-mobile"
                                                    id="billing-toggle-mobile"
                                                    checked={billingCycle === "annually"}
                                                    onChange={toggleBillingCycle}
                                                    className={`absolute block ${isMobile ? "w-7 h-7" : "w-6 h-6"} rounded-full bg-white border-2 appearance-none cursor-pointer checked:right-0 checked:border-[#7A39FF] focus:outline-none duration-200 ease-in transition-all`}
                                                    style={{
                                                        top: "-2px",
                                                        left: billingCycle === "annually" ? `calc(100% - ${isMobile ? "28px" : "24px"})` : "0",
                                                        zIndex: 1,
                                                    }}
                                                />
                                                <label
                                                    htmlFor="billing-toggle-mobile"
                                                    className={`block ${isMobile ? "h-6" : "h-5"} overflow-hidden rounded-full cursor-pointer ${billingCycle === "annually" ? "bg-[#7A39FF]" : "bg-gray-300"}`}
                                                ></label>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span 
                                                    className={`font-lato text-sm leading-[100%] tracking-[0%] ${billingCycle === 'annually' ? 'font-bold text-[#212121]' : 'font-normal text-[#888888]'} ${isMobile ? "px-2" : ""}`}
                                                    onClick={() => billingCycle !== 'annually' && toggleBillingCycle()}
                                                >
                                                    Annually
                                                </span>
                                                <span className="font-lato font-bold text-sm leading-[100%] tracking-[0%] text-[#3CA787]">(Save 15%)</span>
                                            </div>
                                        </div> */}

                                        {/* Cost for Mobile */}
                                        <div className="text-center mb-6">
                                            <h3 className="text-lg font-semibold mb-2">
                                                {teamSize === 0
                                                    ? "No Users Selected"
                                                    : `Cost for ${teamSize} ${teamSize === 1 ? 'User' : 'Users'}`
                                                }
                                            </h3>

                                            <div className="mt-4">
                                                <div className="text-4xl font-bold">{currencySymbol}{totalCost.toLocaleString('en-US')}</div>
                                                <div className="text-gray-500 text-xs mt-3">
                                                    {teamSize === 0 ? (
                                                        <span>Select users to see pricing</span>
                                                    ) : (
                                                        <>
                                                            ≈ {currencySymbol}{perUserCost.toFixed(2)} / user / month
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons - make them bigger for mobile */}
                                        {teamSize === 0 ? (
                                            <div className="text-center py-3 px-4 border-2 border-gray-300 text-gray-500 rounded-md font-medium text-sm">
                                                SELECT USERS TO CONTINUE
                                            </div>
                                        ) : (
                                            <button
                                                className={`w-full ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#7A39FF] hover:bg-[#6930d5]'} text-white py-3 px-4 rounded-md transition-colors font-medium text-sm`}
                                                onClick={hasActiveSubscription ?
                                                    () => {
                                                        setIsAddingUsers(true);
                                                        setTeamSize(teamSize || 1); // Use current teamSize or default to 1
                                                        setShowConfirmationModal(true);
                                                    } :
                                                    handleCreateSubscription
                                                }
                                                disabled={loading}
                                            >
                                                {loading ? 'PROCESSING...' :
                                                    hasActiveSubscription ? 'UPGRADE PLAN' :
                                                        `SUBSCRIBE NOW (${teamSize} ${teamSize === 1 ? 'USER' : 'USERS'})`}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Features Included */}
                                <div className={`py-4 md:py-6  border-t ${isMobile ? "pt-6" : ""} border-b border-gray-200`}>
                                    <div className="font-medium text-[#212121] mb-4">Included:</div>
                                    <div className={`grid ${isMobile ? "grid-cols-1 gap-y-5" : "grid-cols-1 md:grid-cols-2 gap-y-3"}`}>
                                        {features.map((feature, index) => (
                                            <div key={index} className={`flex items-center ${isMobile ? "text-base" : ""}`}>
                                                <img src="./Group.svg" alt="checkmark" className={`mr-2 ${isMobile ? "w-6 h-6" : "w-5 h-5"}`} />
                                                <span className="text-gray-600">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Contact Sales */}
                                <div className={`pt-4 md:pt-6 ${isMobile ? "pb-6" : ""}`}>
                                    <p className={`text-gray-600 mb-4 ${isMobile ? "text-base" : "text-sm md:text-base"}`}>Need a custom plan tailored to your specific needs?</p>
                                    <a
                                        href={`https://wa.me/+918852885766?text=${encodeURIComponent('Hello Dyzo team, I need help with selecting a plan. Can someone assist me?')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center justify-center ${isMobile ? "py-3.5 px-5 text-base w-full" : "px-3 py-2 md:px-4 md:py-2 text-sm md:text-base"} border border-[#e0e0e0] bg-white rounded-md hover:bg-gray-50 transition-colors text-[#075E54] font-medium`}
                                    >
                                        <Icon icon="logos:whatsapp-icon" width={isMobile ? "22" : "25"} height={isMobile ? "22" : "25"} />
                                        <span className="ml-2">Chat on WhatsApp</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Desktop Only Cost Card */}
                        <div className="lg:col-span-3 hidden md:block">
                            <div className="bg-white rounded-lg border-[#C5A8FF] border-[2px] shadow-sm p-4 md:p-6 h-auto">
                                {/* Monthly/Annually Switch - HIDDEN */}
                                {/* <div className="flex items-center gap-x-2 md:gap-x-3 mb-6 md:mb-8 justify-center md:ml-16">
                                    <span className={`font-lato font-bold text-[14px] md:text-[16px] leading-[100%] tracking-[0%] ${billingCycle === 'monthly' ? 'text-[#212121]' : 'text-[#888888]'}`}>Monthly</span>
                                    <div className="relative inline-block w-10 md:w-12 align-middle select-none">
                                        <input
                                            type="checkbox"
                                            name="toggle"
                                            id="billing-toggle"
                                            checked={billingCycle === "annually"}
                                            onChange={toggleBillingCycle}
                                            className="absolute block w-5 md:w-6 h-5 md:h-6 rounded-full bg-white border-2 appearance-none cursor-pointer checked:right-0 checked:border-[#7A39FF] focus:outline-none duration-200 ease-in transition-all"
                                            style={{
                                                top: "-2px",
                                                left: billingCycle === "annually" ? "calc(100% - 20px)" : "0",
                                                zIndex: 1,
                                            }}
                                        />
                                        <label
                                            htmlFor="billing-toggle"
                                            className={`block h-4 md:h-5 overflow-hidden rounded-full cursor-pointer ${billingCycle === "annually" ? "bg-[#7A39FF]" : "bg-gray-300"}`}
                                        ></label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={`font-lato text-[14px] md:text-[16px] leading-[100%] tracking-[0%] ${billingCycle === 'annually' ? 'font-bold text-[#212121]' : 'font-normal text-[#888888]'}`}>Annually</span>
                                        <span className="font-lato font-bold text-[14px] md:text-[16px] leading-[100%] tracking-[0%] text-[#3CA787]">(Save 15%)</span>
                                    </div>
                                </div> */}

                                {/* Total Cost */}
                                <div className="text-center mb-8 md:mb-10">
                                    <h3 className="text-lg md:text-xl font-semibold mb-1">
                                        {teamSize === 0
                                            ? "No Users Selected"
                                            : `Cost for ${teamSize} ${teamSize === 1 ? 'User' : 'Users'}`
                                        }
                                    </h3>

                                    <div className="mt-8 mb-4">
                                        <div className="text-4xl md:text-5xl font-bold">{currencySymbol}{totalCost.toLocaleString('en-US')}</div>
                                        <div className="text-gray-500 text-xs md:text-sm mt-2">
                                            {teamSize === 0 ? (
                                                <span>Select users to see pricing</span>
                                            ) : (
                                                <>
                                                    ≈ {currencySymbol}{perUserCost.toFixed(2)} / user / month
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Upgrade Button - for paid plans */}
                                <div className={teamSize === 0 ? 'hidden' : ''}>
                                    <button
                                        className={`w-full mt-4 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#7A39FF] hover:bg-[#6930d5]'} text-white py-3 px-4 rounded-md transition-colors font-medium text-base`}
                                        onClick={hasActiveSubscription ?
                                            () => {
                                                setIsAddingUsers(true);
                                                setTeamSize(teamSize || 1); // Use current teamSize or default to 1
                                                setShowConfirmationModal(true);
                                            } :
                                            handleCreateSubscription
                                        }
                                        disabled={loading}
                                    >
                                        {loading ? 'PROCESSING...' :
                                            hasActiveSubscription ? 'UPGRADE PLAN' :
                                                `SUBSCRIBE NOW (${teamSize} ${teamSize === 1 ? 'USER' : 'USERS'})`}
                                    </button>
                                    {hasActiveSubscription && (
                                        <p className="text-xs md:text-sm text-gray-500 mt-2 text-center">
                                            Click to add more users to your existing subscription.
                                        </p>
                                    )}
                                </div>

                                {/* No users selected message */}
                                {teamSize === 0 && (
                                    <div className="text-center py-3 px-4 border-2 border-gray-300 text-gray-500 rounded-md font-medium text-sm md:text-base">
                                        SELECT USERS TO CONTINUE
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default NewPlan;