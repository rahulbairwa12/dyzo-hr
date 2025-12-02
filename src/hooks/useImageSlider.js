import { useState, useEffect } from 'react';

const useImageSlider = (initialImages = []) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [images, setImages] = useState(initialImages);

    const handlePrevious = () => {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
    };

    const openSlider = (clickedImage, allImages) => {
        setImages(allImages);
        setCurrentIndex(allImages.indexOf(clickedImage));
        setIsOpen(true);
    };

    const closeSlider = () => {
        setIsOpen(false);
        setCurrentIndex(0);
    };

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                handlePrevious();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'Escape') {
                closeSlider();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    return {
        isOpen,
        currentIndex,
        images,
        handlePrevious,
        handleNext,
        openSlider,
        closeSlider
    };
};

export default useImageSlider; 