import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import Icons from '../ui/Icon';
import { Icon } from '@iconify/react';

const EmployeeGrid = ({ employee, index }) => {
    const navigate = useNavigate();
    const { _id, name, email, phone, designation, profile_picture, isActive } = employee;
    const [isMobile, setIsMobile] = useState(false);
    
    // Check if device is mobile
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        // Initial check
        checkIfMobile();
        
        // Add event listener for resize
        window.addEventListener('resize', checkIfMobile);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', checkIfMobile);
        };
    }, []);
    
    // Format email for display
    const displayEmail = () => {
        if (!email) return '';
        
        // For very small screens, show just the first part before @
        if (window.innerWidth < 350) {
            const parts = email.split('@');
            return `${parts[0]}@...`;
        }
        
        // For mobile but not too small
        if (isMobile && email.length > 18) {
            return `${email.substring(0, 18)}...`;
        }
        
        // For desktop
        return email;
    };
    
    return (
        <div className="relative w-full group max-w-md min-w-0 mx-auto mt-4 md:mt-10 mb-4 md:mb-6 break-words bg-white border shadow-md md:shadow-2xl dark:bg-gray-800 dark:border-gray-700 md:max-w-sm rounded-xl hover:cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]" 
            onClick={() => { navigate(`/profile/${_id}?name=${name.replace(/ /g, "-")}`) }} 
            key={index}
        >
            <div className={`pb-3 md:pb-6 ${isMobile ? 'pt-16' : 'pt-20'}`}>
                <div className="flex flex-wrap justify-center">
                    <div className="flex justify-center w-full">
                        <div className={`relative ${isMobile ? 'w-[100px] h-[100px]' : 'w-[150px] h-[150px]'}`}>
                            {
                                (profile_picture) ? (
                                    <img
                                        src={`${import.meta.env.VITE_APP_DJANGO}${profile_picture}`}
                                        className={`${isMobile ? 'w-[100px] h-[100px]' : 'w-[150px] h-[150px]'} object-cover object-top rounded-full absolute z-10 -translate-y-1/2 top-0 shadow-md border-2 border-white dark:border-gray-700`}
                                        alt="User profile"
                                    />
                                ) : (
                                    <div 
                                        className={`${isMobile ? 'w-[100px] h-[100px]' : 'w-[150px] h-[150px]'} flex items-center justify-center object-cover object-top rounded-full absolute z-10 -translate-y-1/2 top-0 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-4xl font-bold shadow-md border-2 border-white dark:border-gray-700`}
                                    >
                                        {name ? name.charAt(0).toUpperCase() : "U"}
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>

                <button
                    className='absolute right-2 top-1 flex flex-row gap-1 md:gap-2 items-center py-1 px-1 md:px-2 font-semibold rounded'
                >
                    <Link to={`/user-feedbacks/${_id}`} onClick={(e) => e.stopPropagation()}>
                        <Icons icon="fluent:person-feedback-48-regular" className='w-5 h-5 md:w-6 md:h-6' />
                    </Link>
                </button>

                <div className="mt-2 text-center px-3 md:px-4">
                    <h3 className="mb-1 text-lg md:text-2xl font-bold leading-tight text-gray-700 dark:text-gray-300 capitalize">{name}</h3>
                    
                    {designation && (
                        <p className="mb-2 font-normal text-sm md:text-base text-gray-500 dark:text-gray-400 text-center capitalize">
                            {designation}
                        </p>
                    )}
                    
                    <div className="flex flex-col space-y-1 md:space-y-2 mt-2">
                        <div className="flex justify-center items-center gap-1 text-sm md:text-base" onClick={(e) => e.stopPropagation()}>
                            <Icons icon="circum:mail" className='w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0' />
                            <Link 
                                to={`mailto:${email}`} 
                                target='_blank' 
                                className='hover:text-blue-600 truncate max-w-[180px] md:max-w-[220px]' 
                                title={email}
                            >
                                {displayEmail()}
                            </Link>
                        </div>

                        {phone && (
                            <div className="flex justify-center items-center gap-1 text-sm md:text-base" onClick={(e) => e.stopPropagation()}>
                                <Icons icon="solar:phone-outline" className='w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0' />
                                <Link 
                                    to={`tel:${phone}`} 
                                    target='_blank' 
                                    className='hover:text-green-600' 
                                    title='call'
                                >
                                    {phone}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* View profile indicator */}
                <div className="mt-3 flex justify-center">
                    <div className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1 border-t border-gray-100 dark:border-gray-700 pt-2 px-4">
                        <Icons icon="heroicons-outline:eye" className="w-3.5 h-3.5" />
                        View Profile
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EmployeeGrid