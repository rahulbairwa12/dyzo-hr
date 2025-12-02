import React from "react";
import { useDrag } from "react-dnd";
import Card from "./KanbanCard"; // The actual Card component being dragged
import { TrashIcon } from "@heroicons/react/24/outline";

const ItemTypes = {
    CARD: "card",
};

const DraggableCard = ({ card, removeCard, users }) => {
    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.CARD,
        item: { id: card?.taskId },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    return (
        <div ref={drag} className={`${isDragging ? "opacity-50" : ""}`}>
            <Card card={card} removeCard={removeCard} users={users} />
        </div>
    );
};

export default DraggableCard;
