'use client';

/**
 * Image upload component with drag-and-drop support.
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

export default function ImageUpload({ onUpload, isUploading = false }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) {
      setError('Please upload a valid image file (PNG, JPG, JPEG)');
      return;
    }

    const file = acceptedFiles[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    onUpload(file);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const clearPreview = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-lg text-blue-600">Drop the image here...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-700 mb-2">
                Drag & drop an image here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports: PNG, JPG, JPEG (max 10MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative max-w-2xl mx-auto">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto max-h-96 object-contain rounded-lg border-2 border-gray-300 shadow-lg"
          />
          {!isUploading && (
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              aria-label="Remove image"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Processing...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
