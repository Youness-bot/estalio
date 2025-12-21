import React, { useState, useRef } from 'react';
import Icon from './AppIcon';
import Button from './ui/Button';

const ImageUploader = ({ 
  onUpload, 
  onRemove,
  onReorder,
  existingImages = [], 
  maxImages = 10,
  maxSizeMB = 10,
  label = "Property Images",
  showPreview = true,
  multiple = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Add state for drag-to-reorder functionality
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file) => {
    if (!allowedTypes?.includes(file?.type)) {
      return `${file?.name}: Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.`;
    }
    if (file?.size > maxSizeBytes) {
      return `${file?.name}: File size exceeds ${maxSizeMB}MB limit.`;
    }
    return null;
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    const newErrors = [];
    const validFiles = [];

    // Check max images limit
    if (existingImages?.length + fileArray?.length > maxImages) {
      setErrors([`Maximum ${maxImages} images allowed. You can upload ${maxImages - existingImages?.length} more.`]);
      return;
    }

    // Validate each file
    fileArray?.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors?.push(error);
      } else {
        validFiles?.push(file);
      }
    });

    setErrors(newErrors);

    if (validFiles?.length === 0) return;

    setUploading(true);

    try {
      // Upload files one by one with progress tracking
      for (let i = 0; i < validFiles?.length; i++) {
        const file = validFiles?.[i];
        setUploadProgress(prev => ({ ...prev, [file?.name]: 0 }));

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file?.name]: Math.min((prev?.[file?.name] || 0) + 10, 90)
          }));
        }, 200);

        await onUpload(file);

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file?.name]: 100 }));

        // Clear progress after short delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress?.[file?.name];
            return newProgress;
          });
        }, 1000);
      }
    } catch (error) {
      setErrors(prev => [...prev, `Upload failed: ${error?.message}`]);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e?.preventDefault();
    // Only set isDragging for file upload zone, not for image reordering
    if (!e?.dataTransfer?.types?.includes('text/plain')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e?.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setIsDragging(false);
    
    const files = e?.dataTransfer?.files;
    if (files?.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e) => {
    const files = e?.target?.files;
    if (files?.length > 0) {
      handleFiles(files);
    }
    // Reset input to allow same file selection again
    e.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef?.current?.click();
  };

  // NEW: Image reordering handlers
  const handleImageDragStart = (e, index) => {
    setDraggedIndex(index);
    e?.dataTransfer?.setData('text/plain', index?.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e, index) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    setDragOverIndex(index);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDragLeave = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setDragOverIndex(null);
  };

  const handleImageDrop = (e, dropIndex) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Call onReorder callback with old and new indices
    if (onReorder) {
      onReorder(draggedIndex, dropIndex);
    }

    // Reset drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          <span className="text-muted-foreground ml-2">
            (Max {maxImages} images, {maxSizeMB}MB each)
          </span>
        </label>
      )}
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-primary bg-primary/10 scale-105' :'border-border hover:border-primary/50 hover:bg-muted/50'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes?.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading || existingImages?.length >= maxImages}
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
            <Icon name={isDragging ? 'CloudUpload' : 'Upload'} size={32} />
          </div>

          <div>
            <p className="text-base font-medium">
              {uploading 
                ? 'Uploading...' 
                : isDragging 
                  ? 'Drop files here' :'Drag & drop images or click to browse'
              }
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supported: JPEG, PNG, WebP, GIF
            </p>
          </div>

          {!uploading && existingImages?.length < maxImages && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e?.stopPropagation();
                triggerFileInput();
              }}
            >
              Select Files
            </Button>
          )}
        </div>
      </div>
      {/* Upload Progress */}
      {Object.keys(uploadProgress)?.length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress)?.map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate flex-1">{fileName}</span>
                <span className="text-muted-foreground ml-2">{progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Error Messages */}
      {errors?.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
          {errors?.map((error, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-destructive">
              <Icon name="AlertCircle" size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
      {/* Image Preview Grid */}
      {showPreview && existingImages?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {existingImages?.map((image, index) => (
            <div 
              key={index}
              draggable={true}
              onDragStart={(e) => handleImageDragStart(e, index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragLeave={handleImageDragLeave}
              onDrop={(e) => handleImageDrop(e, index)}
              onDragEnd={handleImageDragEnd}
              className={`
                relative group aspect-square rounded-lg overflow-hidden border bg-muted
                cursor-move transition-all
                ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                ${dragOverIndex === index ? 'border-primary border-2 scale-105' : 'border-border'}
              `}
            >
              <img
                src={image?.url || image}
                alt={`Property image ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                onError={(e) => {
                  e.target.src = '/assets/images/no_image.png';
                }}
              />
              
              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
                  Primary
                </div>
              )}

              {/* Drag Handle Indicator */}
              <div className="absolute top-2 left-2 bg-background/80 text-foreground p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Icon name="GripVertical" size={16} />
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => {
                  e?.stopPropagation();
                  onRemove(index);
                }}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Remove image"
              >
                <Icon name="Trash2" size={16} />
              </button>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors pointer-events-none" />
            </div>
          ))}
        </div>
      )}
      {/* Image Counter */}
      {existingImages?.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {existingImages?.length} of {maxImages} images uploaded
        </div>
      )}
    </div>
  );
};

export default ImageUploader;