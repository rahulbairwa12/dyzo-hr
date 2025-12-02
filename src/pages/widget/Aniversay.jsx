import React, { useState, useEffect } from 'react';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';

const AniversayWish = ({ users }) => {
    const [birthdayEmployees, setBirthdayEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        checkBirthdays();
    }, [users]);

    const checkBirthdays = () => {
        const today = new Date();
        const todayKey = `birthdayWishClosed_${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const isClosed = localStorage.getItem(todayKey);

        if (!isClosed) {
            const birthdayList = users.filter(employee => {
                const userDOB = new Date(employee.date_of_joining);
                return today.getDate() === userDOB.getDate() && today.getMonth() === userDOB.getMonth();
            });

            if (birthdayList.length > 0) {
                setBirthdayEmployees(birthdayList);
                setShowModal(true);
            }
        }
    };

    const handleClose = () => {
        const today = new Date();
        const todayKey = `birthdayWishClosed_${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        localStorage.setItem(todayKey, 'true');  // Store the closed state in localStorage
        setShowModal(false);  // Hide the modal
    };

    if (!showModal || birthdayEmployees.length === 0) {
        return null;
    }

    return (
        <Modal title='Today Event' activeModal={showModal} onClose={handleClose}>
            {birthdayEmployees.map((employee) => (
                <Alert
                    key={employee._id}
                    dismissible
                    icon="fluent:target-20-regular"
                    className="alert-dark light-mode m-auto my-2 capitalize"
                >
                    Happy Work Aniversary, {employee.name}! 🎉
                </Alert>
            ))}
        </Modal>
    );
};

export default AniversayWish;
