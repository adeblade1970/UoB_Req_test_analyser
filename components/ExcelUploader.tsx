import React, { useState, useCallback } from 'react';
import { ExcelIcon } from './icons/ExcelIcon';

interface ExcelUploaderProps {
  onFileUpload: (file: File) => void;
  fileName: string | undefined;
}

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onFileUpload, fileName }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        onFileUpload(file);
      }
      e.dataTransfer.clearData();
    }
  }, [onFileUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
       if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        onFileUpload(file);
      }
    }
  };
  
  const displayText = fileName 
    ? <><span className="font-bold text-white">{fileName}</span> uploaded successfully.</>
    : <>Drag & drop an Excel file here</>;

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-colors duration-200 ${
        isDragging ? 'border-teal-400 bg-slate-700/50' : 'border-slate-600 hover:border-teal-500'
      }`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleChange}
        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer">
        <ExcelIcon className="w-12 h-12 text-slate-400 mb-4" />
        <p className="text-lg font-semibold text-white">{displayText}</p>
        <p className="text-slate-400">or click to select a file</p>
      </label>
    </div>
  );
};
