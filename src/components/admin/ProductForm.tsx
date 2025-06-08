import React from 'react';
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
  name: z.string().min(1, 'Product name is required').max(100),
  brand: z.string().min(1, 'Brand is required'),
  price: z.coerce
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(99999.99, 'Price is too high'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  sizes: z.array(z.string()).min(1, 'At least one size is required'),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: ProductFormValues & { id?: string };
  onSubmit: (data: ProductFormValues) => Promise<void>;
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
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      ...initialData,
      sizes: initialData?.sizes || [],
      inStock: initialData?.inStock ?? true,
      featured: initialData?.featured ?? false,
    },
  });

  const selectedSizes = watch('sizes');

  const handleSizeToggle = (size: string) => {
    const current = selectedSizes || [];
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    setValue('sizes', updated, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Product name"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <Label htmlFor="brand">Brand</Label>
        <Select
          onValueChange={(value) => setValue('brand', value)}
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
          {...register('price')}
          placeholder="0.00"
        />
        {errors.price && (
          <p className="text-sm text-red-500">{errors.price.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          onValueChange={(value) => setValue('category', value)}
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
          placeholder="Product description"
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Sizes */}
      <div className="space-y-2">
        <Label>Sizes</Label>
        <div className="grid grid-cols-5 gap-2">
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
          onCheckedChange={(checked) => setValue('inStock', checked)}
        />
      </div>

      {/* Featured Status */}
      <div className="flex items-center justify-between">
        <Label htmlFor="featured">Featured</Label>
        <Switch
          id="featured"
          checked={watch('featured')}
          onCheckedChange={(checked) => setValue('featured', checked)}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
