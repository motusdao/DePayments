"use client";
import React, { useState, useCallback } from 'react';
import { Upload, File, CheckCircle, X, Loader, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileUploaded?: (fileUrl: string, filename: string) => void;
  onUploadComplete?: (fileData: string) => void | Promise<void>;
  accept?: string;
  acceptedFileTypes?: string[];
  maxSizeMB?: number;
  label?: string;
  existingFile?: {
    url: string;
    filename: string;
  };
}

export default function FileUploader({
  onFileUploaded,
  onUploadComplete,
  accept,
  acceptedFileTypes,
  maxSizeMB = 5,
  label = 'Upload Document',
  existingFile
}: FileUploaderProps) {
  // Handle both accept patterns
  const acceptString = accept || (acceptedFileTypes ? acceptedFileTypes.map(t => 
    t.startsWith('application/') ? `.${t.split('/')[1]}` : 
    t.startsWith('image/') ? `.${t.split('/')[1]}` : t
  ).join(',') : '.pdf,.jpg,.jpeg,.png,.webp');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<boolean>(!!existingFile);
  const [currentFile, setCurrentFile] = useState<{ url: string; filename: string } | null>(existingFile || null);
  const [error, setError] = useState<string | null>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file size
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    // Validate file type
    const acceptedTypes = acceptString.split(',').map(t => t.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      setError(`Invalid file type. Accepted: ${acceptString}`);
      return;
    }

    setUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const result = await response.json();

      // Update state
      const uploadedFile = {
        url: result.fileUrl,
        filename: result.filename
      };
      setCurrentFile(uploadedFile);
      setUploaded(true);
      
      // Notify parent - support both callback patterns
      if (onFileUploaded) {
        onFileUploaded(result.fileUrl, result.filename);
      }
      if (onUploadComplete) {
        await onUploadComplete(result.fileUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
      setUploaded(false);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentFile) return;

    try {
      // Optionally call DELETE API
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: currentFile.url })
      });

      setCurrentFile(null);
      setUploaded(false);
      setError(null);
    } catch (err) {
      console.error('Failed to delete file:', err);
      // Still remove from UI even if API call fails
      setCurrentFile(null);
      setUploaded(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {!uploaded ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#635BFF] bg-purple-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={acceptString}
            onChange={handleFileInput}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader className="w-12 h-12 text-[#635BFF] animate-spin mb-3" />
              <p className="text-gray-600 font-medium">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-700 font-medium mb-1">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                {acceptString.replace(/\./g, '').toUpperCase()} files up to {maxSizeMB}MB
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentFile?.filename || 'File uploaded'}
              </p>
              <p className="text-xs text-gray-500">
                Upload successful
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-4 p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove file"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
