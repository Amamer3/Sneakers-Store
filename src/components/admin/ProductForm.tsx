import React, { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Product } from '@/types/product';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const BRANDS = [
  { value: 'nike', label: 'Nike' },
  { value: 'adidas', label: 'Adidas' },
  { value: 'puma', label: 'Puma' },
  { value: 'reebok', label: 'Reebok' },
];
const CATEGORIES = [
  { value: 'sneakers', label: 'Sneakers' },
  { value: 'boots', label: 'Boots' },
  { value: 'sandals', label: 'Sandals' },
  { value: 'formal', label: 'Formal' },
];

// Form schema
const productSchema = z.object({
  name: z.string().min(1, 'Please enter a product name').max(100, 'Product name is too long'),
  brand: z.string().min(1, 'Please select a brand'),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a valid number' })
    .min(0.01, 'Price must be greater than 0')
    .max(99999.99, 'Price is too high'),
  description: z.string().optional(),
  category: z.string().min(1, 'Please select a category'),
  sizes: z.array(z.string()).min(1, 'Please select at least one size').optional(),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  images: z.custom<File[]>()
    .refine((files) => files?.length >= 1 || false, 'At least one image is required')
    .refine(
      (files) => files?.length <= 5 || false,
      'Maximum 5 images allowed'
    )
    .refine(
      (files) => files?.every(file => ALLOWED_TYPES.includes(file.type)) || false,
      'All images must be JPEG, PNG, or WebP'
    )
    .refine(
      (files) => files?.every(file => file.size <= MAX_FILE_SIZE) || false,
      'Each image must not exceed 5MB'
    )
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Omit<Product, 'createdAt' | 'updatedAt'>;
  onSubmit: (data: ProductFormValues & { existingImages?: { id: string; url: string }[] }) => Promise<void>;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      brand: initialData?.brand || '',
      price: initialData?.price || 0,
      description: initialData?.description || '',
      category: initialData?.category || '',
      sizes: initialData?.sizes || [],
      inStock: initialData?.inStock ?? true,
      featured: initialData?.featured ?? false,
      images: undefined,
    },
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>(
    initialData?.images?.map(img => img.url) || []
  );
  const [existingImages] = useState(initialData?.images || []);

  const selectedSizes = watch('sizes');
  const uploadedImages = watch('images') || [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate total number of images
    const totalImages = uploadedImages.length + files.length;
    if (totalImages > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => 
      ALLOWED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
    );

    if (validFiles.length === 0) {
      alert('Please upload valid image files (JPEG, PNG, or WebP, max 5MB each)');
      return;
    }

    // Update form state with new files
    const newFiles = [...uploadedImages, ...validFiles];
    setValue('images', newFiles, { shouldValidate: true });

    // Generate previews for new files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);

    const newFiles = Array.from(uploadedImages);
    newFiles.splice(index, 1);
    setValue('images', newFiles, { shouldValidate: true });
  };

  const handleCancel = () => {
    reset();
    setImagePreviews(initialData?.images?.map(img => img.url) || []);
    onCancel();
  };

  const onFormSubmit = async (data: ProductFormValues) => {
    const formData = {
      ...data,
      existingImages: existingImages
    };
    await onSubmit(formData);
  };

  const errorMessages = Object.entries(errors).map(([field, error]) => ({
    field,
    message: error?.message as string | undefined
  })).filter(error => error.message);

  const handleSizeToggle = (size: string) => {
    const current = selectedSizes || [];
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    setValue('sizes', updated, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex-1 overflow-y-auto px-1 space-y-6">
        {/* Error Summary */}
        {errorMessages.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 font-medium">Please fix the following errors:</p>
            <ul className="list-disc list-inside text-sm text-red-600">
              {errorMessages.map(({ field, message }) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Product Fields */}
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Enter product name"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Select
            onValueChange={(value) => setValue('brand', value, { shouldValidate: true })}
            defaultValue={initialData?.brand}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              {BRANDS.map((brand) => (
                <SelectItem key={brand.value} value={brand.value}>
                  {brand.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.brand && (
            <p className="text-sm text-red-500">{errors.brand.message}</p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Price (GHS)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('price')}
          />
          {errors.price && (
            <p className="text-sm text-red-500">{errors.price.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            onValueChange={(value) => setValue('category', value, { shouldValidate: true })}
            defaultValue={initialData?.category}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Enter product description"
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Images */}
        <div className="space-y-3">
          <Label htmlFor="images" className="text-lg font-medium text-gray-700">
            Product Images
            <span className="ml-1 text-sm text-gray-500">(Max 5 images)</span>
          </Label>
          <div
            className={cn(
              "border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center gap-4 bg-gray-50 hover:bg-gray-100 transition-colors",
              imagePreviews.length > 0 && "border-gray-400 bg-gray-100"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files || []);
              if (files.length > 0) {
                const event = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleImageChange(event);
              }
            }}
          >
            <div className="flex-1 w-full">
              <Input
                id="images"
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleImageChange}
                className="hidden"
                multiple
              />
              <Button
                type="button"
                variant="outline"
                className="w-full py-6 text-gray-600 hover:bg-gray-200"
                onClick={() => document.getElementById('images')?.click()}
              >
                <ImagePlus className="w-6 h-6 mr-2" />
                {imagePreviews.length > 0 ? "Add More Images" : "Upload or Drag Images"}
              </Button>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={preview}
                      alt={`Product preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg shadow-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 rounded-full w-8 h-8 bg-red-500 hover:bg-red-600"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.images && (
            <p className="text-sm text-red-500 font-medium">{errors.images.message}</p>
          )}
        </div>

        {/* Sizes */}
        <div className="space-y-2">
          <Label>Sizes</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {SIZES.map((size) => (
              <Button
                key={size}
                type="button"
                variant={selectedSizes?.includes(size) ? 'default' : 'outline'}
                onClick={() => handleSizeToggle(size)}
                className={cn(
                  'w-full',
                  selectedSizes?.includes(size) &&
                    'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {size}
              </Button>
            ))}
          </div>
          {errors.sizes && (
            <p className="text-sm text-red-500">{errors.sizes.message}</p>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center justify-between">
          <Label htmlFor="inStock">In Stock</Label>
          <Switch
            id="inStock"
            checked={watch('inStock')}
            onCheckedChange={(checked) => setValue('inStock', checked, { shouldValidate: true })}
          />
        </div>

        {/* Featured Status */}
        <div className="flex items-center justify-between">
          <Label htmlFor="featured">Featured</Label>
          <Switch
            id="featured"
            checked={watch('featured')}
            onCheckedChange={(checked) => setValue('featured', checked, { shouldValidate: true })}
          />
        </div>
      </div>

      {/* Form Actions - Fixed at bottom */}
      <div className="flex justify-end gap-4 py-4 mt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || Object.keys(errors).length > 0}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
