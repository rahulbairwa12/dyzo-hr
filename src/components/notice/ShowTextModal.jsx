import React, { useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const ShowTextModal = ({ showTextModal, setShowTextModal, description }) => {


    const { register, control, reset, formState: { errors }, handleSubmit } = useForm({
        mode: "all",
        defaultValues: {
            text: description,
        }
    });

    useEffect(() => {
        reset({ text: description });
    }, [description, reset]);

    return (
        <div>
            <Modal
                title="Notic Text"
                labelclassName="btn-outline-dark"
                activeModal={showTextModal}
                onClose={() => setShowTextModal(false)}
            >
                <form className="space-y-4">
                    <Textarea
                        name="text"
                        register={register}
                        placeholder="Text"
                        row={8}
                    />

                </form>
            </Modal>
        </div>
    );
};

export default ShowTextModal;
