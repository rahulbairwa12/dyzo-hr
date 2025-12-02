import React, { useState } from "react";
import { useDispatch } from "react-redux";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import { createNewSection, fetchSectionTasks } from "../store/sectionTaskSlice";
import { validateSectionName } from "../utils/apiUtils";

const CreateSectionModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [sectionName, setSectionName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const validationError = validateSectionName(sectionName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Dispatch the create section action
      await dispatch(
        createNewSection({
          name: sectionName.trim(),
          order: Date.now(), // Use timestamp for ordering
          color: "#3B82F6", // Default blue color
          icon: "mdi:folder-outline", // Default icon
        }),
      ).unwrap();

      // Refresh the sections data
      await dispatch(fetchSectionTasks());

      // Reset form and close modal on success
      setSectionName("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create section");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSectionName("");
    setError("");
    onClose();
  };

  const handleInputChange = (e) => {
    setSectionName(e.target.value);
    if (error) {
      setError(""); // Clear error when user starts typing
    }
  };

  const footerContent = (
    <div className="flex justify-end space-x-3">
      <Button
        text="Cancel"
        className="btn-outline-secondary"
        onClick={handleClose}
        disabled={isLoading}
      />
              <Button
          text={isLoading ? "Creating..." : "Create Section"}
          className="btn-dark bg-[#7A39FF] hover:bg-[#6A2FFF] text-white"
          onClick={handleSubmit}
          disabled={isLoading || !sectionName.trim()}
          icon={isLoading ? "eos-icons:loading" : "heroicons:plus"}
          iconClass="text-lg"
        />
    </div>
  );

  return (
    <Modal
      activeModal={isOpen}
      onClose={handleClose}
      title="Create New Section"
      className="max-w-md "
      centered
      footerContent={footerContent}
      icon="mdi:folder-plus-outline"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Textinput
            label="Section Name"
            type="text"
            placeholder="Enter section name"
            value={sectionName}
            onChange={handleInputChange}
            error={error ? { message: error } : null}
            className="w-full"
            autoComplete="off"
            maxLength={50}
          />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose a descriptive name for your section (2-100 characters)
          </p>
        </div>

      
      </form>
    </Modal>
  );
};

export default CreateSectionModal;
