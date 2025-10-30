/**
 * Image Uploader - Manual image upload interface
 */

import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpload: (imagePath: string, imageId: string) => void;
}

export function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      
      // Generate unique ID for the image
      const imageId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Call parent with image data
      onImageUpload(result, imageId);
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border">
      {!preview ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 dark:border-gray-700'
          }`}
          style={{ minHeight: '500px' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          
          <Upload className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Upload an Image</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Drag and drop an image here, or click to browse
          </p>
          
          <button
            onClick={handleButtonClick}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <ImageIcon className="h-5 w-5" />
            Choose Image
          </button>

          <div className="mt-6 text-sm text-muted-foreground text-center">
            <p>Supported formats: JPG, PNG, JPEG</p>
            <p>Maximum size: 10MB</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={handleClear}
            className="absolute top-4 right-4 z-10 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto rounded-lg"
            style={{ maxHeight: '600px', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}
