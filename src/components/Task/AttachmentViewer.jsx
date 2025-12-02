import { Dialog } from "@headlessui/react";
import { Icon } from "@iconify/react";
import { useState, useEffect, useRef } from "react";
import documentIcon from "@/assets/images/all-img/document.png";
import pdfIcon from "@/assets/images/all-img/pdf.png";
import imageIcon from "@/assets/images/all-img/image.png";
import videoIcon from "@/assets/images/all-img/video.png";

export default function AttachmentViewer({
  attachments,
  initialIndex = 0,
  open,
  onClose,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  // Pan and zoom state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const currentAttachment = attachments[currentIndex];

  // Reset zoom and pan when changing attachments
  useEffect(() => {
    setZoom(1);
    setIsLoading(true);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Reset pan when zoom is reset
  useEffect(() => {
    if (zoom === 1) setPosition({ x: 0, y: 0 });
  }, [zoom]);

  const goPrev = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + attachments?.length) % attachments?.length
    );
  const goNext = () =>
    setCurrentIndex((prev) => (prev + 1) % attachments?.length);

  const isPreviewable = (type) => ["image", "video"].includes(type);

  const handleZoom = (direction) => {
    setZoom((prev) => {
      const newZoom = direction === "in" ? prev + 0.2 : prev - 0.2;
      return Math.min(Math.max(0.1, newZoom), 3);
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Pan handlers
  const handleMouseDown = (e) => {
    // if (zoom === 1) return; // Only allow pan when zoomed
    e.preventDefault();
    setIsDragging(true);
    setStartDrag({ x: e.clientX, y: e.clientY });
    setStartPos({ ...position });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startDrag.x;
    const dy = e.clientY - startDrag.y;
    setPosition({ x: startPos.x + dx, y: startPos.y + dy });
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Touch support
  const handleTouchStart = (e) => {
    if (zoom === 1) return;
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setStartDrag({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setStartPos({ ...position });
  };
  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startDrag.x;
    const dy = e.touches[0].clientY - startDrag.y;
    setPosition({ x: startPos.x + dx, y: startPos.y + dy });
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Prevent image drag ghost
  const handleImgDragStart = (e) => e.preventDefault();

  const handleWheelZoom = (e) => {
    e.preventDefault();
  
    // Optionally require Ctrl key for zoom to avoid interfering with page scroll
    // if (!e.ctrlKey) return;
  
    const zoomDirection = e.deltaY < 0 ? "in" : "out";
    setZoom((prev) => {
      const newZoom = zoomDirection === "in" ? prev + 0.1 : prev - 0.1;
      return Math.min(Math.max(0.1, newZoom), 3);
    });
  };

  const handleImageLoad = (e) => {
    setIsLoading(false);
  
    if (!containerRef.current) return;
  
    const container = containerRef.current;
    const img = e.target;
  
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
  
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
  
    // Calculate scale needed to fit image in container
    const scale = Math.min(
      containerWidth / imgWidth,
      containerHeight / imgHeight
    );
  
    // Convert to percentage
    let percent = scale * 100;
  
    // Always round down to nearest 10
    percent = Math.floor(percent / 10) * 10;
  
    // Clamp to max 100%
    if (percent > 100) percent = 100;
    if (percent < 10) percent = 10;
  
    // Apply zoom
    setZoom(percent / 100);
    setPosition({ x: 0, y: 0 }); // Reset pan
  };
  
  function shortenFilename(filename, maxLength = 25) {
    if (!filename) return;
    const extIndex = filename.lastIndexOf(".");
    if (extIndex === -1) return filename;

    const name = filename.slice(0, extIndex);
    const ext = filename.slice(extIndex);

    // If it's already short enough, return as-is
    if (filename.length <= maxLength) return filename;

    const start = name.slice(0, 15);
    const end = name.slice(-5);

    return `${start}...${end}${ext}`;
  }

  const handleDownloadAttachment = async (attachment) => {
    try {
      // First, try the fetch approach for non-CORS restricted files
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name || "download"; // clean filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Fetch download failed, trying fallback method:", error);
      
      // Fallback method for CORS-restricted files (like AWS S3 images)
      try {
        const link = document.createElement("a");
        link.href = attachment.url;
        link.download = attachment.name || "download";
        link.target = "_blank"; // Open in new tab as fallback
        link.rel = "noopener noreferrer";
        
        // For images, we might need to force download by setting the filename
        if (attachment.type === "image") {
          // Try to add download attribute with proper filename
          const urlParts = attachment.url.split('/');
          const filename = attachment.name || urlParts[urlParts.length - 1] || 'image';
          link.download = filename;
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError);
        // Final fallback - just open the URL in a new tab
        window.open(attachment.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const renderContent = (attachment) => {
    if (attachment?.type === "image") {
      return (
        <div
          ref={containerRef}
          className="relative w-full h-full overflow-hidden bg-slate-100 select-none"
          style={{
            minHeight: 400,
            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheelZoom}
        >
          <img
            src={attachment?.url}
            alt={attachment?.name}
            draggable={false}
            onDragStart={handleImgDragStart}
            style={{
              display: "block",
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) scale(${zoom}) translate(${
                position.x / zoom
              }px, ${position.y / zoom}px)`,
              transition: isDragging ? "none" : "transform 0.3s",
              maxWidth: "none",
              maxHeight: "none",
              userSelect: "none",
              pointerEvents: "auto",
            }}
            onLoad={handleImageLoad}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      );
    }

    if (attachment?.type === "video") {
      return (
        <div className="relative group w-full h-full flex items-center justify-center bg-slate-100">
          <video
            controls
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            onLoadStart={() => setIsLoading(true)}
            onLoadedData={() => setIsLoading(false)}
          >
            <source src={attachment.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-slate-100 rounded-lg w-full h-full">
        <Icon icon="heroicons:document" className="w-16 h-16 text-gray-400" />
        <p className="text-lg text-gray-600">
          Cannot preview this file. You can download it below:
        </p>
        <button
          onClick={() => handleDownloadAttachment(attachment)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg"
        >
          <Icon icon="heroicons:arrow-down-tray" className="w-5 h-5" />
          <span>Download {shortenFilename(attachment?.name)}</span>
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (containerRef.current && currentAttachment?.type === "image") {
      const container = containerRef.current;
      const img = container.querySelector("img");
      if (img) {
        // Use scrollWidth/scrollHeight for the actual size
        const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
        const scrollTop = (container.scrollHeight - container.clientHeight) / 2;
        container.scrollLeft = Math.max(0, scrollLeft);
        container.scrollTop = Math.max(0, scrollTop);
      }
    }
  }, [zoom, currentIndex, currentAttachment?.type]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
        isFullscreen ? "bg-black-500" : "bg-black-500/80"
      }`}
    >
      <Dialog.Panel
        className={`relative bg-white  w-full mx-4 p-6 shadow-2xl transition-all duration-300 ${
          isFullscreen
            ? "max-w-none mx-0 rounded-none"
            : "xl:max-w-[70%] rounded-xl "
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap mb-4">
          <div className="flex items-center gap-4">
            {currentAttachment?.type === "image" && (
              <img src={imageIcon} alt="" className="w-8 h-8" />
            )}
            {currentAttachment?.type === "document" && (
              <img src={documentIcon} alt="" className="w-8 h-8" />
            )}
            {currentAttachment?.type === "pdf" && (
              <img src={pdfIcon} alt="" className="w-8 h-8" />
            )}
            {currentAttachment?.type === "video" && (
              <img src={videoIcon} alt="" className="w-8 h-8" />
            )}
            <h3 className="text-lg font-medium text-gray-900">
              {shortenFilename(currentAttachment?.name)}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {currentAttachment?.type === "image" && (
              <>
                <button
                  onClick={() => handleZoom("out")}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icon icon="heroicons:minus" className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleZoom("in")}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icon icon="heroicons:plus" className="w-5 h-5" />
                </button>
                {/* Zoom percentage display and input */}
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min={10}
                    max={300}
                    step={5}
                    value={Math.round(zoom * 100)}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (isNaN(val)) val = 100;
                      val = Math.max(10, Math.min(300, val));
                      setZoom(val / 100);
                    }}
                    className="w-16 px-1 py-0.5 border rounded text-center text-sm focus:outline-none"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon
                icon={
                  isFullscreen
                    ? "heroicons:arrows-pointing-in"
                    : "heroicons:arrows-pointing-out"
                }
                className="w-5 h-5"
              />
            </button>
            <button
              onClick={() => handleDownloadAttachment(currentAttachment)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon
                icon="heroicons:arrow-down-tray-20-solid"
                className="w-5 h-5"
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon icon="heroicons:x-mark" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className={`flex flex-col items-center justify-center text-center border-2 border-slate-200 ${
            isFullscreen ? "h-[calc(100vh-100px)]" : "h-[70vh]"
          }  min-h-[400px]`}
        >
          <div className="w-full h-full flex items-center justify-center">
            {renderContent(currentAttachment)}
          </div>
        </div>

        {/* Navigation */}
        {attachments?.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300 hover:scale-110"
            >
              <Icon icon="heroicons:chevron-left" className="w-6 h-6" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300 hover:scale-110"
            >
              <Icon icon="heroicons:chevron-right" className="w-6 h-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-lg">
              {currentIndex + 1} / {attachments?.length}
            </div>
          </>
        )}
      </Dialog.Panel>
    </Dialog>
  );
}
