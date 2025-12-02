
// src/pages/KanbanPage.js
import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import KanbanBoard from "./KanbanBoard";
import { ToastContainer } from "react-toastify";

const KanbanPage = ({ data, users, getAllTasks }) => {
    const [board, setBoard] = useState(data)

    useEffect(() => {
        setBoard(data);
    }, [data]);

    return (
        <>
            <ToastContainer />
            <DndProvider backend={HTML5Backend} >
                <div className="container mx-auto p-4">
                    <KanbanBoard board={board} setBoard={setBoard} users={users} getAllTasks={getAllTasks} />
                </div>
            </DndProvider>

        </>

    );
};

export default KanbanPage;