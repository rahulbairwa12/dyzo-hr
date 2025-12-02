import React, { useState, useEffect } from 'react';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import { useSelector } from 'react-redux';
import { fetchAuthGET } from '@/store/api/apiSlice';

const BirthdayWish = () => {
    const userInfo = useSelector((state) => state.auth.user);
    const [birthdayEmployees, setBirthdayEmployees] = useState([]);
    const [anniversaryEmployees, setAnniversaryEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const today = new Date()
    const [employeeList, setEmployeeList] = useState([]);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                if (!userInfo) return;
                const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/employee/list/${userInfo.companyId}/`);
                if (data) setEmployeeList(data);

            } catch (error) {
                console.error("Error fetching employee", error);
            }
        };

       fetchEmployee()
    }, []);

    useEffect(() => {
        if (userInfo) {
            checkEvents();
        }
    }, [employeeList, userInfo]);

    const checkEvents = () => {
        const today = new Date();
        const todayKey = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const isClosed = localStorage.getItem(`${userInfo._id}_${todayKey}`);

        if (!isClosed) {
            const birthdayList = employeeList.filter(employee => {
                if(!employee.date_of_birth) return false;
                const userDOB = new Date(employee.date_of_birth);
                return today.getDate() === userDOB.getDate() && today.getMonth() === userDOB.getMonth();
            });

            const anniversaryList = employeeList.filter(employee => {
                if(!employee.date_of_joining) return false;
                const userJoinDate = new Date(employee.date_of_joining);
                return today.getDate() === userJoinDate.getDate() && today.getMonth() === userJoinDate.getMonth();
            });

            if (birthdayList.length > 0 || anniversaryList.length > 0) {
                setBirthdayEmployees(birthdayList);
                setAnniversaryEmployees(anniversaryList);
                setModalTitle(birthdayList.length > 0 ? 'Today\'s Events' : 'Today\'s Events');
                setShowModal(true);
            }
        }
    };

    const handleClose = () => {
        const today = new Date();
        const todayKey = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        localStorage.setItem(`${userInfo._id}_${todayKey}`, 'true');
        setShowModal(false);
    };

    if (!showModal || (birthdayEmployees.length === 0 && anniversaryEmployees.length === 0)) {
        return null;
    }

    return (
        <Modal title={modalTitle} activeModal={showModal} onClose={handleClose}>
            {birthdayEmployees.map((employee) => (
                <Alert
                    key={employee._id}
                    // dismissible
                    icon="fluent:target-20-regular"
                    className="alert-dark light-mode m-auto my-2 capitalize"
                >
                    Happy Birthday, {employee.name}!
                </Alert>
            ))}


            {anniversaryEmployees.map((employee) => {
                const joiningDate = new Date(employee?.date_of_joining)
                const yearCompleted = today.getFullYear() - joiningDate.getFullYear()
                const isWorkAnniversary = yearCompleted >= 1;
                let yearSuffix;

                if (yearCompleted == 1) {
                    yearSuffix = 'st';
                }
                else if (yearCompleted == 2) {
                    yearSuffix = 'nd'
                }
                else if (yearCompleted == 3) {
                    yearSuffix = 'rd'
                }
                else {
                    yearSuffix = 'th'
                }


                return (
                    <Alert
                        key={employee._id}
                        // dismissible
                        icon="fluent:target-20-regular"
                        className="alert-dark light-mode m-auto my-2 capitalize"
                    >
                        {isWorkAnniversary ? (
                            <p>Happy {yearCompleted === 1 ? "1st" : `${yearCompleted}${yearSuffix}`} Work Anniversary, {employee.name}!</p>
                        ) : (
                            <p>Welcome to the company, {employee.name}!</p>
                        )}
                    </Alert>
                )

            })}
        </Modal>
    );
};

export default BirthdayWish;
