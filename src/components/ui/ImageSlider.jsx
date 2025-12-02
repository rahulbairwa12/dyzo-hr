import React from 'react';
import { Icon } from "@iconify/react";

const ImageSlider = ({
    isOpen,
    onClose,
    images,
    currentIndex,
    onPrevious,
    onNext
}) => {
    if (!isOpen) return null;

    return (
        <div className="image-slider-overlay">
            <div className="image-slider-container">
                <button
                    className="image-slider-close"
                    onClick={onClose}
                >
                    <Icon icon="material-symbols-light:close" className="w-6 h-6" />
                </button>

                <button
                    className="image-slider-nav image-slider-prev"
                    onClick={onPrevious}
                >
                    <Icon icon="material-symbols:chevron-left" className="w-8 h-8" />
                </button>

                <img
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    className="image-slider-image"
                />

                <button
                    className="image-slider-nav image-slider-next"
                    onClick={onNext}
                >
                    <Icon icon="material-symbols:chevron-right" className="w-8 h-8" />
                </button>

                <div className="image-slider-counter">
                    {currentIndex + 1} / {images.length}
                </div>
            </div>
        </div>
    );
};

export default ImageSlider; 