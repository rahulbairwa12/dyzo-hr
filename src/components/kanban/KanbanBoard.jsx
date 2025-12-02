// src/components/KanbanBoard.js
import React from "react";
import Column from "./Column";
import { toast } from "react-toastify";
import { fetchDelete } from "@/store/api/apiSlice";

const KanbanBoard = ({ board, setBoard, users, getAllTasks }) => {
  const addCard = (columnId, card) => {
    const newCard = {
      id: new Date().getTime(),
      title: card.taskName,
      description: card.description,
      progress: Math.floor(Math.random() * 100) // For demo purposes
    };

    const updatedBoard = board.columns.map((column) => {
      if (column.id === columnId) {
        return {
          ...column,
          cards: [...column.cards, newCard],
        };
      }
      return column;
    });

    setBoard({ columns: updatedBoard });
  };

  const moveCard = (cardId, targetColumnId) => {
    let movedCard = null;

    const updatedColumns = board.columns.map((column) => {
      const updatedCards = column.cards.filter((card) => {
        if (card?.taskId === cardId) {
          movedCard = card;
          return false;
        }
        return true;
      });

      return { ...column, cards: updatedCards };
    });

    const targetColumn = updatedColumns.find((column) => column.id === targetColumnId);
    targetColumn.cards.push(movedCard);

    setBoard({ columns: updatedColumns });
  };

  const removeCard = async (columnId, cardId) => {
    try {
      // Make the API call to delete the card
      const response = await fetchDelete(`${import.meta.env.VITE_APP_DJANGO}/api/tasks/${cardId}/`);

      if (response.status) {
        const updatedColumns = board.columns.map((column) => {
          if (column.id === columnId) {
            return {
              ...column,
              cards: column.cards.filter((card) => card?.taskId !== cardId),
            };
          }
          return column;
        });

        setBoard({ columns: updatedColumns });

        // Move these outside of the map function
        toast.success("Card deleted successfully");
        getAllTasks();
      } else {
        console.error('Failed to delete the card:', response.statusText);
        toast.error("Failed to delete the card");
      }
    } catch (error) {
      console.error('Error deleting the card:', error);
      toast.error("Error deleting the card");
    }
  };

  return (
    <div className="flex gap-2">
      {board.columns.map((column) => (
        <Column
          key={column.id}
          column={column}
          moveCard={moveCard}
          removeCard={removeCard}
          addCard={addCard}
          users={users}
          getAllTasks={getAllTasks}
        />
      ))}
    </div>
  );
};

export default KanbanBoard;