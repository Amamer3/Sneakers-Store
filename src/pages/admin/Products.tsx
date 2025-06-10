import React, { useState, useCallback, useEffect } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { adminProductService } from '@/services/admin-product-service';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AdminProductCard from '@/components/AdminProductCard';
import ProductForm from '@/components/admin/ProductForm';
import { Product, ProductFilters } from '@/types/product';

// Define ProductFormData interface for form submission
interface ProductFormData {
  name: string;
  brand: string;
  price: number;
  description?: string;
  category: string;
  inStock: boolean;
  featured: boolean;
  sizes: string[];
  images?: File[];
  existingImages?: { id: string; url: string }[];
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  
  const { formatPrice } = useCurrency();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchProducts = useCallback(async (filters: Partial<ProductFilters> = {}) => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);
      const response = await adminProductService.getProducts({
        page: 1,
        limit: 10,
        sort: 'createdAt:desc',
        ...filters
      });
      setProducts(response.items || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      toast({
        title: 'Error',
        description: 'Could not load products. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = async (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: ProductFormData & { existingImages?: { id: string; url: string }[] }) => {
    try {
      if (editingProduct) {
        // First, update the product details
        await adminProductService.updateProduct(editingProduct.id, {
          name: data.name,
          brand: data.brand,
          price: data.price,
          description: data.description,
          category: data.category,
          sizes: data.sizes,
          inStock: data.inStock,
          featured: data.featured,
        });

        // Then, if there are new images, upload them
        if (data.images && data.images.length > 0) {
          await adminProductService.uploadImages(editingProduct.id, data.images);
        }

        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      } else {
        // Create the product first
        const newProduct = await adminProductService.createProduct({
          name: data.name,
          brand: data.brand,
          price: data.price,
          description: data.description,
          category: data.category,
          sizes: data.sizes,
          inStock: data.inStock,
          featured: data.featured,
        });

        // Then upload the images if they exist
        if (data.images && data.images.length > 0) {
          await adminProductService.uploadImages(newProduct.id, data.images);
        }

        toast({
          title: 'Success',
          description: 'Product created successfully',
        });
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      setDeletingProductId(productId);
      await adminProductService.deleteProduct(productId);
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleToggleFeatured = async (productId: string, featured: boolean) => {
    try {
      await adminProductService.updateProduct(productId, { featured });
      setProducts(prev => 
        prev.map(p => p.id === productId ? { ...p, featured } : p)
      );
      toast({
        description: `Product ${featured ? 'added to' : 'removed from'} featured items`,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product status',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStock = async (productId: string, inStock: boolean) => {
    try {
      await adminProductService.updateProduct(productId, { inStock });
      setProducts(prev => 
        prev.map(p => p.id === productId ? { ...p, inStock } : p)
      );
      toast({
        description: `Product marked as ${inStock ? 'in stock' : 'out of stock'}`,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stock status',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">You must be an admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products Management</h1>
        <Button onClick={handleCreateProduct}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Content */}
      {error ? (
        <Card className="p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-2 text-lg font-medium">Error Loading Products</p>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => fetchProducts()} className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <p className="mt-2 text-lg font-medium">No Products Found</p>
          <p className="text-muted-foreground">Add your first product to get started</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <AdminProductCard
              key={product.id}
              product={product}
              formatPrice={formatPrice}
              isDeleting={deletingProductId === product.id}
              handleEdit={() => handleEditProduct(product)}
              handleDeleteProduct={() => handleDeleteProduct(product.id)}
              handleToggleFeatured={handleToggleFeatured}
              handleToggleStock={handleToggleStock}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Create New Product'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            initialData={editingProduct || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
