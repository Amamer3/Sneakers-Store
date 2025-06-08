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

interface ProductFilters {
  page?: number;
  limit?: number;
  sort?: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  description?: string;
  images: { id: string; url: string }[];
  sizes?: string[];
  category: string;
  inStock: boolean;
  featured: boolean;
}

interface ProductFormData {
  name: string;
  brand: string;
  price: number;
  description: string;
  category: string;
  inStock: boolean;
  featured: boolean;
  images?: { id: string; url: string }[];
  sizes?: string[];
}

interface ProductCreateInput {
  name: string;
  brand: string;
  price: number;
  description: string;
  category: string;
  inStock: boolean;
  featured: boolean;
  images?: { id: string; url: string }[];
  sizes?: string[];
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { isAuthenticated, isAdmin } = useAuth();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminProductService.getProducts({ 
        page: 1, 
        limit: 100, 
        sort: 'createdAt:desc' 
      });
      setProducts(data.items);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleEdit = useCallback(async (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      setIsDeleting(productId);
      await adminProductService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  }, [toast]);

  const handleToggleFeatured = useCallback(async (productId: string, featured: boolean) => {
    try {
      await adminProductService.updateProduct(productId, { featured });
      setProducts(prev =>
        prev.map(p =>
          p.id === productId ? { ...p, featured } : p
        )
      );
      toast({
        description: `Product ${featured ? 'marked as featured' : 'removed from featured'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleToggleStock = useCallback(async (productId: string, inStock: boolean) => {
    try {
      await adminProductService.updateProduct(productId, { inStock });
      setProducts(prev =>
        prev.map(p =>
          p.id === productId ? { ...p, inStock } : p
        )
      );
      toast({
        description: `Product ${inStock ? 'marked as in stock' : 'marked as out of stock'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleSubmit = useCallback(async (productData: ProductFormData) => {
    try {
      if (editingProduct) {
        const updatedProduct = await adminProductService.updateProduct(editingProduct.id, productData as ProductCreateInput);
        setProducts(prev =>
          prev.map(p =>
            p.id === editingProduct.id ? { ...p, ...updatedProduct } : p
          )
        );
        toast({
          description: 'Product updated successfully',
        });
      } else {
        const newProduct = await adminProductService.createProduct(productData as ProductCreateInput);
        setProducts(prev => [newProduct, ...prev]);
        toast({
          description: 'Product created successfully',
        });
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save product',
        variant: 'destructive',
      });
    }
  }, [editingProduct, toast]);

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 h-[400px]">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <div className="space-y-2 mt-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <p className="mt-2 text-lg font-medium">No products found</p>
          <p className="text-muted-foreground">Add your first product to get started</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <AdminProductCard
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div>
            {/* We'll need to implement or import the ProductForm component */}
            Form will be rendered here
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;