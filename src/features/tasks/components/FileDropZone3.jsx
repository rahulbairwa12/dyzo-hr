import React, { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";

const FileDropZone3 = ({ placeholder, setFile, setNext }) => {
  const [file, setFileState] = useState(null);
  const [inputKey, setInputKey] = useState(Date.now());
  const inputRef = useRef(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const newFile = acceptedFiles[0];
        setFileState(newFile);
        setFile(newFile);
        setNext(true);
      }
    },
  });

  const openFileDialog = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const clearFile = () => {
    setFileState(null);
    setFile(null);       // Safe now due to null check in parent
    setNext(false);
    setInputKey(Date.now());  // Reset input to allow same file re-selection
     const timeoutId = setTimeout(() => {
      openFileDialog();
     }, 100);
     return () => clearTimeout(timeoutId);
  };

  return (
    <div className="w-full text-center border-dashed border border-secondary-500 rounded-md py-5 flex flex-col justify-center items-center h-[180px] xl:h-[250px]">
      <div {...getRootProps({ className: "dropzone w-full h-full flex flex-col justify-center items-center" })}>
        <input
          key={inputKey}
          {...getInputProps()}
          ref={inputRef}
          className="hidden"
        />
        {isDragActive ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Drop the file here ...
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-300 mb-4">
              Drop file here or Continue with Your Tasks.
            </p>
            {
              !file &&
            <button
              type="button"
              className="btn bg-electricBlue-100 hover:bg-electricBlue-100/90 text-white px-4 py-2 rounded-md text-sm"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
            >
              Upload File 
            </button>
            }
          </>
        )}
      </div>

      {file && (
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {file.name}
          </div>
          <button
            type="button"
            className="btn bg-electricBlue-100 hover:bg-electricBlue-100/90 text-white px-4 py-2 rounded-md text-sm"
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
          >
            Change File
          </button>
        </div>
      )}
    </div>
  );
};

export default FileDropZone3;
