import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Icon from './AppIcon';
import Button from './ui/Button';
import ImageUploader from './ImageUploader';

/**
 * Property Image Manager with Drag & Drop Ordering
 * 
 * Features:
 * - Explicit primary image selection (user action required)
 * - Drag & drop reordering (updates display_order only)
 * - Intelligent deletion (auto-recalculates primary)
 * - Single source of truth (property_images table)
 * 
 * @param {Array} images - Array of image objects with {id, url, is_primary, display_order}
 * @param {Function} onUpload - Callback when new images are uploaded
 * @param {Function} onRemove - Callback when an image is removed
 * @param {Function} onSetPrimary - Callback when primary image is set
 * @param {Function} onReorder - Callback when images are reordered
 * @param {boolean} editMode - Whether in edit mode or create mode
 */
const PropertyImageManager = ({
  images = [],
  onUpload,
  onRemove,
  onSetPrimary,
  onReorder,
  editMode = false
}) => {
  const [localImages, setLocalImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalImages(images?.map((img, index) => ({
      ...img,
      id: img?.id || `temp-${index}`,
      url: img?.image_url || img?.url,
      isPrimary: img?.is_primary || false,
      displayOrder: img?.display_order ?? index
    })));
  }, [images]);

  const handleDragEnd = (result) => {
    setIsDragging(false);

    if (!result?.destination) return;

    const items = Array.from(localImages);
    const [reorderedItem] = items?.splice(result?.source?.index, 1);
    items?.splice(result?.destination?.index, 0, reorderedItem);

    // Update display_order based on new positions
    const updatedItems = items?.map((item, index) => ({
      ...item,
      displayOrder: index
    }));

    setLocalImages(updatedItems);

    // Call parent callback with updated order (only id and display_order)
    if (onReorder) {
      const imageOrders = updatedItems?.filter(img => img?.id && !img?.id?.startsWith('temp-'))?.map(img => ({
          id: img?.id,
          display_order: img?.displayOrder
        }));
      
      onReorder(imageOrders);
    }
  };

  const handleSetPrimary = (index) => {
    if (!editMode) {
      // In create mode, just update local state
      const updated = localImages?.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }));
      setLocalImages(updated);
    } else {
      // In edit mode, call API to set primary
      const image = localImages?.[index];
      if (image?.id && !image?.id?.startsWith('temp-') && onSetPrimary) {
        onSetPrimary(image?.id);
      }
    }
  };

  const handleRemove = (index) => {
    const image = localImages?.[index];
    const wasPrimary = image?.isPrimary;

    if (onRemove) {
      onRemove(index);
    }

    // Update local state
    const updated = localImages?.filter((_, i) => i !== index);

    // If primary was removed and images remain, auto-set first as primary
    if (wasPrimary && updated?.length > 0 && !editMode) {
      updated[0].isPrimary = true;
    }

    setLocalImages(updated);
  };

  const getPrimaryImage = () => {
    return localImages?.find(img => img?.isPrimary);
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <ImageUploader
        existingImages={[]}
        onUpload={onUpload}
        onRemove={onRemove}
        onReorder={onReorder}
        showPreview={false}
        multiple
      />
      {/* Primary Image Display */}
      {localImages?.length > 0 && (
        <div className="p-4 bg-muted/40 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Star" size={18} className="text-yellow-500" />
            <span className="font-medium">Primary Image</span>
          </div>
          {getPrimaryImage() ? (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-yellow-500">
              <img
                src={getPrimaryImage()?.url}
                alt="Primary"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No primary image selected. Click "Set as Primary" on any image.
            </p>
          )}
        </div>
      )}
      {/* Drag & Drop Image List */}
      {localImages?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              All Images ({localImages?.length})
            </p>
            {editMode && (
              <p className="text-xs text-muted-foreground">
                Drag to reorder • Click star to set primary
              </p>
            )}
          </div>

          <DragDropContext 
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
          >
            <Droppable droppableId="images">
              {(provided, snapshot) => (
                <div
                  {...provided?.droppableProps}
                  ref={provided?.innerRef}
                  className={`space-y-2 ${
                    snapshot?.isDraggingOver ? 'bg-muted/20' : ''
                  }`}
                >
                  {localImages?.map((image, index) => (
                    <Draggable
                      key={image?.id}
                      draggableId={image?.id?.toString()}
                      index={index}
                      isDragDisabled={!editMode}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided?.innerRef}
                          {...provided?.draggableProps}
                          className={`flex items-center gap-3 p-3 border rounded-lg bg-card ${
                            snapshot?.isDragging ? 'shadow-lg' : ''
                          } ${image?.isPrimary ? 'border-yellow-500 bg-yellow-50' : ''}`}
                        >
                          {/* Drag Handle (Edit Mode Only) */}
                          {editMode && (
                            <div
                              {...provided?.dragHandleProps}
                              className="cursor-move text-muted-foreground hover:text-foreground"
                            >
                              <Icon name="GripVertical" size={20} />
                            </div>
                          )}

                          {/* Image Preview */}
                          <div className="w-16 h-16 rounded overflow-hidden border">
                            <img
                              src={image?.url}
                              alt={`Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Image Info */}
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              Image {index + 1}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Order: {image?.displayOrder}
                            </p>
                            {image?.isPrimary && (
                              <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
                                <Icon name="Star" size={14} />
                                <span>Primary</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!image?.isPrimary && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetPrimary(index)}
                              >
                                <Icon name="Star" size={16} />
                                Set as Primary
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemove(index)}
                            >
                              <Icon name="Trash2" size={16} className="text-red-500" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided?.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
      {/* Empty State */}
      {localImages?.length === 0 && (
        <div className="p-8 text-center border-2 border-dashed rounded-lg">
          <Icon name="Image" size={48} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No images uploaded yet. Click above to add images.
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertyImageManager;