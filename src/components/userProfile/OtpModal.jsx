import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Textinput from "../ui/Textinput";
import Icon from "../ui/Icon"; // Import Icon component

const OtpModal = ({ otp, setOtp, onSubmit, onClose, showOtpModal, otpSend, isLoading }) => {
    return (
        <Modal activeModal={showOtpModal} onClose={onClose} title="OTP Verification">
            <Textinput
                label="One-Time Password"
                type="text"
                placeholder="Enter the OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
            />

            {/* Submit Button for OTP Verification */}
            <Button
                text="Submit"
                className="btn-dark mt-3"
                onClick={onSubmit}
            />

            {/* Resend OTP Button */}
            <Button
                text={
                    isLoading ? (
                        <Icon icon="eos-icons:loading" style={{ color: "#2a62ff" }} className="w-6 h-6" />
                    ) : (
                        "Resend OTP"
                    )
                }
                className="btn-outline mt-3"
                onClick={otpSend}
                disabled={isLoading} // Disable the button when loading
            />
        </Modal>
    );
};

export default OtpModal;
