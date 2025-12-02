import React, { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import DraggableCard from "./DraggableCard"; // Importing the new DraggableCard component
import { useSelector } from "react-redux";
import AddCardForm from "./AddCardFrom";
import { Icon } from "@iconify/react";

const ItemTypes = {
    CARD: "card",
};

const Column = ({ column, moveCard, removeCard, addCard, users, getAllTasks }) => {
    const userInfo = useSelector(state => state?.auth?.user);
    // const [showForm, setShowForm] = useState(false);

    // Drop functionality to move cards between columns
    const [{ isOver }, drop] = useDrop({
        accept: ItemTypes.CARD,
        drop: (item) => {
            moveCard(item.id, column.id);
            handleCardMove(item, userInfo);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    });

    // Function to update the task position in the database
    const handleCardMove = async (item, userInfo) => {
        try {
            if (!userInfo) {
                console.error('User info is undefined');
                return;
            }
            const updateTaskStatus = await fetchAuthPatchFile(`${import.meta.env.VITE_APP_DJANGO}/task/${item?.id}/${userInfo?._id}/`, { body: { taskStatus: column.id } });
            if (updateTaskStatus.status) {
            }
        } catch (error) {
        }
    };

    // Function to add a new card to the column
    const handleAddCard = (card) => {
        addCard(column.id, card);
        setShowForm(false);
    };

    return (
        <div ref={drop} className={`w-1/3 ${isOver ? "bg-blue-100" : ""} `}>
            <div className="bg-gray-100 p-4 rounded shadow-md dark:bg-slate-700">

                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold capitalize dark:text-white">{column.title}</h2>
                    {/* <Icon icon="ic:baseline-plus" className='w-7 h-7 cursor-pointer' onClick={() => setShowForm(true)} /> */}
                </div>


                <div className="bg-gray-100 p-2 rounded min-h-screen dark:bg-slate-700">
                    {[...column.cards].reverse().map((card) => (
                        <DraggableCard
                            key={card?.taskId}
                            card={card}
                            removeCard={(cardId) => removeCard(column.id, cardId)}
                            users={users}
                        />
                    ))}
                </div>
            </div>

            {/* <AddCardForm showForm={showForm} setShowForm={setShowForm} onAdd={handleAddCard} getAllTasks={getAllTasks} /> */}

        </div>
    );
};

export default Column;
