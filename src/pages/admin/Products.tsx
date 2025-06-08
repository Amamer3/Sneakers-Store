import React, { useState, useCallback, useEffect, useMemo, Component, ReactNode } from 'react';
import { Plus, ImagePlus, X, AlertTriangle } from 'lucide-react';
import { adminProductService, ProductCreateInput } from '@/services/admin-product-service';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { currencyService } from '@/services/currency-service';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
// Import ProductCard component
import ProductCard from '@/components/ProductCard';

// Constants
const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e5e7eb"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14" fill="#6b7280">No Image</text></svg>';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
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

// Interfaces
interface ProductImage {
  id: string;
  url: string;
  order: number;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  description?: string;
  sizes?: string[];
  category: string;
  inStock: boolean;
  featured: boolean;
  images: ProductImage[];
  createdAt: string;
}

interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// Form validation schema
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Product name is too long'),
  brand: z.string().min(1, 'Brand is required'),
  price: z.coerce
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(99999.99, 'Price is too high')
    .transform(val => Number(val.toFixed(2))), // Ensure 2 decimal places
  description: z.string().optional(),
  sizes: z.array(z.string()).min(1, 'At least one size is required'),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean(),
  featured: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// Debounce Hook
const useDebounce = <T extends (...args: any[]) => void>(callback: T, delay: number) =>
  useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(...args), delay);
    };
  }, [callback, delay]);

// Select Field Component
const SelectField = ({
  name,
  label,
  options,
  error,
  setValue,
  defaultValue,
}: {
  name: 'brand' | 'category';
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  setValue: (name: string, value: string, options?: { shouldValidate: boolean }) => void;
  defaultValue: string;
}) => (
  <div className="space-y-1">
    <Label htmlFor={name} className="text-sm font-medium text-gray-700">
      {label}
    </Label>
    <Select
      defaultValue={defaultValue}
      onValueChange={(value) => setValue(name, value, { shouldValidate: true })}
    >
      <SelectTrigger
        className="mt-1 rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500 transition"
        aria-label={`Select ${label.toLowerCase()}`}
      >
        <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {error && (
      <p className="text-red-500 text-sm" role="alert">
        {error}
      </p>
    )}
  </div>
);



// Main Component
const Products = () => {
  // Auth context
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  
  // Currency context
  const { currency, formatPrice } = useCurrency();

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filters state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    category: 'all',
    brand: 'all',
    sort: 'createdAt',
    featured: false
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 1,
    hasMore: false
  });

  const { toast } = useToast();

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.debug('[Products] Fetching products with filters:', filters);

      const response = await adminProductService.getProducts(filters);
      console.debug('[Products] Products response:', response);

      setProducts(prev => 
        filters.page === 1 ? response.items : [...prev, ...response.items]
      );

      setPagination({
        currentPage: response.page,
        totalItems: response.total,
        totalPages: response.totalPages,
        hasMore: response.hasMore
      });
    } catch (error: any) {
      console.error('[Products] Error fetching products:', error);
      
      if (error.message === 'Authentication required') {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to access the admin dashboard',
          variant: 'destructive',
        });
        return;
      }

      setError(error.message || 'Failed to fetch products');
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  // Effect to fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle loading more products
  const handleLoadMore = useCallback(() => {
    if (pagination.hasMore) {
      setFilters(prev => ({
        ...prev,
        page: prev.page + 1
      }));
    }
  }, [pagination.hasMore]);

  // Filter handlers
  const handleSearch = useDebounce((search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  }, 300);

  const handleSort = useCallback((sort: string) => {
    setFilters(prev => ({ ...prev, sort, page: 1 }));
  }, []);

  const handleCategoryFilter = useCallback((category: string) => {
    setFilters(prev => ({ ...prev, category, page: 1 }));
  }, []);

  const handleBrandFilter = useCallback((brand: string) => {
    setFilters(prev => ({ ...prev, brand, page: 1 }));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    getValues,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      brand: '',
      price: 0,
      description: '',
      sizes: [],
      category: '',
      inStock: true,
      featured: false,
    },
    mode: 'onChange',
  });

  const watchedSizes = watch('sizes') || [];

  // Handlers
  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    reset();
    setSelectedFiles([]);
  }, [reset]);

  const handleSizeToggle = useCallback(
    (size: string) => {
      const currentSizes = getValues('sizes') || [];
      setValue('sizes', currentSizes.includes(size)
        ? currentSizes.filter((s) => s !== size)
        : [...currentSizes, size], { shouldValidate: true });
    },
    [getValues, setValue]
  );

  const convertToUSD = async (ghsAmount: number) => {
    try {
      const rates = await currencyService.getExchangeRates();
      return Number((ghsAmount / rates.GHS).toFixed(2));
    } catch (error) {
      console.error('Error converting currency:', error);
      return Number((ghsAmount / 12.05).toFixed(2));
    }
  };

  const convertToGHS = async (usdAmount: number) => {
    try {
      const rates = await currencyService.getExchangeRates();
      return Number((usdAmount * rates.GHS).toFixed(2));
    } catch (error) {
      console.error('Error converting currency:', error);
      return Number((usdAmount * 12.05).toFixed(2));
    }
  };

  const onSubmit = async (formData: ProductCreateInput) => {
    try {
      setIsSubmitting(true);
      const priceInUSD = currency === 'GHS' ? await convertToUSD(formData.price) : formData.price;
      const productData = { ...formData, price: priceInUSD };
      const newProduct = editingProduct
        ? await adminProductService.updateProduct(editingProduct.id, productData)
        : await adminProductService.createProduct(productData);      if (selectedFiles.length > 0) {
        try {
          // Upload all images at once
          const uploadedImages = await adminProductService.uploadImages(newProduct.id, selectedFiles);
          
          // Map the uploaded images with order
          const successfulUploads = uploadedImages.map((image, index) => ({
            ...image,
            order: newProduct.images.length + index + 1,
          }));

          // Update the product with new images
          newProduct.images = [
            ...newProduct.images,
            ...successfulUploads,
          ];

          toast({
            title: 'Images uploaded successfully',
            description: `Successfully uploaded ${uploadedImages.length} images.`,
            variant: 'default',
            duration: 3000,
          });
        } catch (error: any) {
          console.error('Error uploading images:', error);
          toast({
            title: 'Error uploading images',
            description: error.message || 'Failed to upload images',
            variant: 'destructive',
            duration: 5000,
          });
        }
      }

      setProducts((prev) =>
        editingProduct
          ? prev.map((p) => (p.id === newProduct.id ? newProduct : p))
          : [newProduct, ...prev]
      );

      handleCloseDialog();
      toast({
        title: `Product ${editingProduct ? 'updated' : 'created'} successfully`,
        description: newProduct.name,
        variant: 'default',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingProduct ? 'update' : 'create'} product`,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (product: Product) => {
    try {
      const ghsPrice = await convertToGHS(product.price);
      setEditingProduct(product);
      setIsDialogOpen(true);
      reset({
        name: product.name,
        brand: product.brand,
        price: ghsPrice,
        description: product.description || '',
        sizes: product.sizes || [],
        category: product.category,
        inStock: product.inStock,
        featured: product.featured,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        title: 'Invalid files',
        description: errors.join('\n'),
        duration: 5000,
      });
    }

    if (validFiles.length > 0) setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = async (productId: string, imageId: string) => {
    try {
      setIsLoading(true);
      await adminProductService.removeImage(productId, imageId);
      const refreshedProduct = await adminProductService.getProduct(productId);
      setProducts((prev) =>
        prev.map((p) => (p.id === refreshedProduct.id ? refreshedProduct : p))
      );
      setEditingProduct((prev) =>
        prev && prev.id === productId ? refreshedProduct : prev
      );
      toast({
        title: 'Success',
        description: 'Image removed successfully',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove image',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleImageDragStart = useCallback((imageId: string) => {
    setDraggedImageId(imageId);
  }, []);

  const handleImageDragEnd = useCallback(() => {
    setDraggedImageId(null);
  }, []);

  const handleImageDrop = useCallback(
    async (productId: string, targetImageId: string) => {
      if (!draggedImageId || draggedImageId === targetImageId) return;
      try {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        const currentImages = [...product.images];
        const draggedIndex = currentImages.findIndex((img) => img.id === draggedImageId);
        const targetIndex = currentImages.findIndex((img) => img.id === targetImageId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedImage] = currentImages.splice(draggedIndex, 1);
        currentImages.splice(targetIndex, 0, draggedImage);

        await adminProductService.reorderImages(productId, {
          imageIds: currentImages.map((img) => img.id),
        });

        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, images: currentImages } : p))
        );
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to reorder images',
          variant: 'destructive',
          duration: 5000,
        });
      }
    },
    [draggedImageId, products, toast]
  );

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      try {
        setIsDeleting(productId);
        await adminProductService.deleteProduct(productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        toast({
          title: 'Product deleted successfully',
          description: 'The product has been removed from the catalog.',
          duration: 3000,
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete product',
          variant: 'destructive',
          duration: 5000,
        });
      } finally {
        setIsDeleting(null);
      }
    },
    [toast]
  );

  const handleToggleFeatured = useCallback(
    async (productId: string, featured: boolean) => {
      try {
        await adminProductService.updateProduct(productId, { featured });
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, featured } : p))
        );
        toast({
          title: `Product ${featured ? 'featured' : 'unfeatured'} successfully`,
          description: `The product is now ${featured ? 'featured' : 'not featured'}.`,
          duration: 3000,
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update featured status',
          variant: 'destructive',
          duration: 5000,
        });
      }
    },
    [toast]
  );

  const handleToggleStock = useCallback(
    async (productId: string, inStock: boolean) => {
      try {
        await adminProductService.updateProduct(productId, { inStock });
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, inStock } : p))
        );
        toast({
          title: `Product marked as ${inStock ? 'in stock' : 'out of stock'}`,
          description: `The product status has been updated.`,
          duration: 3000,
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update stock status',
          variant: 'destructive',
          duration: 5000,
        });
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  if (authLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="rounded-xl shadow-sm">
              <Skeleton className="w-full h-48 rounded-t-xl" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">
              You need to be logged in as an admin to view this page.
            </p>
            <Link to="/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 text-center text-red-500">
          An error occurred. Please try again.
        </div>
      }
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <Button
            onClick={() => {
              reset();
              setSelectedFiles([]);
              setEditingProduct(null);
              setIsDialogOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Input
            placeholder="Search products..."
            onChange={(e) => handleSearch(e.target.value)}
            className="rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
            aria-label="Search products"
          />
          <Select value={filters.category} onValueChange={handleCategoryFilter}>
            <SelectTrigger
              className="rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by category"
            >
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.brand} onValueChange={handleBrandFilter}>
            <SelectTrigger
              className="rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by brand"
            >
              <SelectValue placeholder="Filter by brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {BRANDS.map((brand) => (
                <SelectItem key={brand.value} value={brand.value}>
                  {brand.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.sort} onValueChange={handleSort}>
            <SelectTrigger
              className="rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
              aria-label="Sort products"
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="-price">Price: High to Low</SelectItem>
              <SelectItem value="name">Name: A to Z</SelectItem>
              <SelectItem value="-name">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? 'Make changes to the product details below.'
                  : 'Fill in the product details below to create a new product.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className="rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
                    aria-invalid={errors.name ? 'true' : 'false'}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm" role="alert">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="price">Price (GHS)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="Enter price in Ghana Cedis"
                    {...register('price')}
                    className="rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
                    aria-invalid={errors.price ? 'true' : 'false'}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm" role="alert">
                      {errors.price.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  name="brand"
                  label="Brand"
                  options={BRANDS}
                  error={errors.brand?.message}
                  setValue={setValue}
                  defaultValue={getValues('brand')}
                />
                <SelectField
                  name="category"
                  label="Category"
                  options={CATEGORIES}
                  error={errors.category?.message}
                  setValue={setValue}
                  defaultValue={getValues('category')}
                />
              </div>

              <div className="space-y-1">
                <Label>Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((size) => (
                    <Button
                      key={size}
                      type="button"
                      variant={watchedSizes.includes(size) ? 'default' : 'outline'}
                      onClick={() => handleSizeToggle(size)}
                      className="h-8 px-3"
                      aria-pressed={watchedSizes.includes(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
                {errors.sizes && (
                  <p className="text-red-500 text-sm" role="alert">
                    {errors.sizes.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  className="rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
                  aria-invalid={errors.description ? 'true' : 'false'}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm" role="alert">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="inStock"
                    checked={watch('inStock')}
                    onCheckedChange={(checked) => setValue('inStock', checked)}
                    aria-label="Toggle in stock status"
                  />
                  <Label htmlFor="inStock">In Stock</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={watch('featured')}
                    onCheckedChange={(checked) => setValue('featured', checked)}
                    aria-label="Toggle featured status"
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Product Images</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                </div>
                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveSelectedFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleCloseDialog();
                    setSelectedFiles([]);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⌛</span>
                      {editingProduct ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{editingProduct ? 'Update Product' : 'Create Product'}</>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Products Grid */}
        <div className="mt-6">
          {isLoading ? (
            // Loading skeletons
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <CardContent className="p-4">
                    <div className="h-4 w-3/4 bg-gray-200 animate-pulse mb-2" />
                    <div className="h-4 w-1/2 bg-gray-200 animate-pulse mb-4" />
                    <div className="h-8 w-full bg-gray-200 animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-10">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Failed to load products</p>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => fetchProducts()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : products.length === 0 ? (
            // Empty state
            <div className="text-center py-10">
              <ImagePlus className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
              <p className="text-gray-500 mb-4">Get started by creating a new product</p>
              <Button
                onClick={() => {
                  setIsDialogOpen(true);
                  setEditingProduct(null);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            // Products grid
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  formatPrice={formatPrice}
                  isDeleting={isDeleting}
                  handleEdit={handleEdit}
                  handleDeleteProduct={handleDeleteProduct}
                  handleToggleFeatured={handleToggleFeatured}
                  handleToggleStock={handleToggleStock}
                />
              ))}
            </div>
          )}

          {/* Load more button */}
          {!isLoading && !error && products.length > 0 && pagination.hasMore && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleLoadMore}
                variant="outline"
                className="min-w-[200px]"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Products;