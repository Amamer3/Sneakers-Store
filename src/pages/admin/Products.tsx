import React, { useCallback } from 'react';
import { ImagePlus, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProductImage {
  id: string;
  url: string;
  order: number;
}

interface ProductImageUploadProps {
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  existingImages?: ProductImage[];
  onRemoveExistingImage?: (productId: string, imageId: string) => Promise<void>;
  onImageDrop?: (productId: string, targetImageId: string) => Promise<void>;
  onImageDragStart?: (imageId: string) => void;
  onImageDragEnd?: () => void;
  productId?: string;
  isLoading?: boolean;
}

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  selectedFiles,
  setSelectedFiles,
  existingImages = [],
  onRemoveExistingImage,
  onImageDrop,
  onImageDragStart,
  onImageDragEnd,
  productId,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const validFiles: File[] = [];
      const errors: string[] = [];

      files.forEach((file) => {
        const error = ALLOWED_TYPES.includes(file.type)
          ? file.size > MAX_FILE_SIZE
            ? 'File size too large. Maximum size is 5MB.'
            : null
          : 'File type not supported. Please upload JPEG, PNG, or WebP images.';
        if (error) errors.push(`${file.name}: ${error}`);
        else validFiles.push(file);
      });

      if (errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid Files',
          description: errors.join('\n'),
          duration: 5000,
        });
      }

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [setSelectedFiles, toast]
  );

  const handleRemoveSelectedFile = useCallback(
    (index: number) => {
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    },
    [setSelectedFiles]
  );

  const handleDragStart = useCallback(
    (imageId: string) => (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('text/plain', imageId);
      onImageDragStart?.(imageId);
    },
    [onImageDragStart]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (imageId: string) => async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const draggedImageId = e.dataTransfer.getData('text/plain');
      if (productId && draggedImageId !== imageId) {
        await onImageDrop?.(productId, imageId);
      }
    },
    [onImageDrop, productId]
  );

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-700">Product Images</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'relative w-full rounded-lg border-dashed border-2 border-gray-300 hover:border-blue-500 transition-all duration-200',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isLoading}
              asChild
            >
              <label
                htmlFor="file-upload"
                className={cn('cursor-pointer flex items-center justify-center py-3', isLoading && 'pointer-events-none')}
              >
                <ImagePlus className="h-5 w-5 mr-2 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Upload Images</span>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="rounded-lg bg-gray-800 text-white">
            <p className="text-xs">Upload JPEG, PNG, or WebP images (max 5MB each)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {(selectedFiles.length > 0 || existingImages.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
          {existingImages.map((image) => (
            <div
              key={image.id}
              className="relative group rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              draggable
              onDragStart={handleDragStart(image.id)}
              onDragEnd={onImageDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop(image.id)}
            >
              <img
                src={image.url}
                alt={`Product image ${image.order}`}
                className="w-full h-32 object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14" fill="%236b7280">No Image</text></svg>';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-600 hover:bg-red-700"
                onClick={() => productId && onRemoveExistingImage?.(productId, image.id)}
                aria-label={`Remove image ${image.order}`}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {selectedFiles.map((file, index) => (
            <div
              key={`file-${index}`}
              className="relative group rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-600 hover:bg-red-700"
                onClick={() => handleRemoveSelectedFile(index)}
                aria-label={`Remove image ${index + 1}`}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {(selectedFiles.length === 0 && existingImages.length === 0) && (
        <div className="flex items-center justify-center h-32 rounded-lg bg-gray-50 border border-gray-200">
          <div className="text-center text-gray-500">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">No images selected</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageUpload;