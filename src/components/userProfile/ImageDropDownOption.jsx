import React, { useCallback, useRef, useEffect, useState } from 'react';
import { fetchAuthPatch, fetchDelete } from '@/store/api/apiSlice';
import { toast } from 'react-toastify';
import Dropzone from 'react-dropzone';
import Modal from '../ui/Modal';

const ImageDropDownOptions = ({ isOpen, onClose, employeeDetail, fetchEmployeeDetail, isAccessable= false }) => {
    const dropdownRef = useRef(null);
    const [imageEnlarge, setImageEnlarge] = useState(false);

    const handleRemovePicture = async () => {
        try {
            const isProfilePictureRemove = await fetchDelete(`${import.meta.env.VITE_APP_DJANGO}/employee/${employeeDetail?._id}/delete-picture-record/`, { body: { profile_picture: '' } });
            if (isProfilePictureRemove.status) {
                toast.success("Profile picture removed successfully");
                fetchEmployeeDetail();
                onClose();
            }
        } catch {
            toast.error("Failed to remove profile picture");
        }
    };

    const handleUploadPicture = useCallback(async (acceptedFiles) => {
        try {
            const formData = new FormData();
            formData.append('profile_picture', acceptedFiles[0]);
            const response = await fetchAuthPatch(`${import.meta.env.VITE_APP_DJANGO}/employee/${employeeDetail?._id}/`, { body: formData });

            if (response.status) {
                toast.success("Profile picture uploaded successfully");
                fetchEmployeeDetail();
                onClose();
            }
        } catch {
            toast.error("Failed to upload profile picture");
        }
    }, [employeeDetail?._id, onClose]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (

        <>

            <div
                ref={dropdownRef}
                className={`absolute right-0 origin-top-right border border-slate-200 rounded bg-white dark:bg-slate-800 dark:border-slate-700 shadow-dropdown z-[9999] w-[140px] top-[102%] transform ${isOpen ? 'opacity-100 scale-100 ' : 'opacity-0 scale-95 hidden'}`}
                aria-labelledby="dropdown-menu"
                role="menu"
                tabIndex="0"
            >
                <div role="none">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800" role="none">
                        <Dropzone onDrop={handleUploadPicture} multiple={false}>
                            {({ getRootProps, getInputProps }) => (
                                <>
                                {
                                    isAccessable &&
                                    <div
                                        role="menuitem"
                                        tabIndex="-1"
                                        className="hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 dark:hover:bg-opacity-50 w-full border-b border-b-gray-500 border-opacity-10 px-2 py-2 text-sm cursor-pointer first:rounded-t last:rounded-b flex items-center rtl:space-x-reverse"
                                        {...getRootProps()}
                                    >
                                        <input {...getInputProps()} />
                                        <span>Upload Picture</span>
                                    </div>
                                }

                                    {
                                         employeeDetail?.profile_picture && (
                                            <div
                                                role="menuitem"
                                                tabIndex="-1"
                                                className="hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 dark:hover:bg-opacity-50 w-full border-b border-b-gray-500 border-opacity-10 px-2 py-2 text-sm cursor-pointer first:rounded-t last:rounded-b flex items-center rtl:space-x-reverse"
                                                onClick={() => setImageEnlarge(true)}
                                            >
                                                <span>View Picture</span>
                                            </div>
                                        )
                                    }

                                    {
                                        isAccessable && employeeDetail?.profile_picture &&
                                        <div
                                            role="menuitem"
                                            tabIndex="-1"
                                            className="hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 dark:hover:bg-opacity-50 w-full border-b border-b-gray-500 border-opacity-10 px-2 py-2 text-sm cursor-pointer first:rounded-t last:rounded-b flex items-center rtl:space-x-reverse"
                                            onClick={handleRemovePicture}
                                        >
                                            <span>Remove Picture</span>
                                        </div>
                                    }
                                </>
                            )}
                        </Dropzone>
                    </div>
                </div>
            </div>

           <Modal title=''  className='max-w-3xl ' activeModal={imageEnlarge} onClose={(()=>{setImageEnlarge(false)})}> <img src={`${import.meta.env.VITE_APP_DJANGO}${employeeDetail?.profile_picture}`} alt={employeeDetail?.name} className='w-full object-cover '/> </Modal>

        </>
    );
};

export default ImageDropDownOptions;