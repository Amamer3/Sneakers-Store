import React from 'react';
import { Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Image {
  id: string;
  url: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  images: Image[];
  sizes?: string[];
  inStock: boolean;
  featured: boolean;
  category: string;
}

interface AdminProductCardProps {  
  product: Product;
  formatPrice: (amount: number) => string;
  isDeleting: boolean;  // Changed from isDeleting?: boolean to isDeleting: boolean
  handleEdit: (product: Product) => Promise<void>;
  handleDeleteProduct: (productId: string) => Promise<void>;
  handleToggleFeatured: (productId: string, featured: boolean) => Promise<void>;
  handleToggleStock: (productId: string, inStock: boolean) => Promise<void>;
  className?: string;
}

const AdminProductCard: React.FC<AdminProductCardProps> = ({
  product,
  formatPrice,
  isDeleting,
  handleEdit,
  handleDeleteProduct,
  handleToggleFeatured,
  handleToggleStock,
  className = '',
}) => {
  const fallbackImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50%" y="50%" font-size="14" fill="%236b7280" text-anchor="middle" dy=".3em">No Image</text></svg>';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = fallbackImage;
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 hover:shadow-xl border-none bg-white rounded-2xl min-h-[420px]',
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <img
          src={product.images[0]?.url || fallbackImage}
          alt={product.name}
          onError={handleImageError}
          className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-110"
        />
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex justify-end gap-2">
            {product.featured && (
              <Badge
                variant="secondary"
                className="bg-purple-600 text-white px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 hover:bg-purple-700"
              >
                Featured
              </Badge>
            )}
            <Badge
              variant={product.inStock ? 'default' : 'destructive'}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full',
                product.inStock ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'
              )}
            >
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </Badge>
          </div>
        </div>
      </div>

      <CardContent className="p-5 grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{product.brand}</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="font-medium text-gray-700">Category:</span>
            <span className="capitalize">{product.category}</span>
          </div>

          {product.sizes && product.sizes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Sizes:</span>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((size) => (
                  <Badge
                    key={size}
                    variant="outline"
                    className="px-2.5 py-0.5 text-xs border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {size}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 mt-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit?.(product)}
              className="flex gap-1.5 items-center text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900 transition-colors rounded-lg text-xs font-medium"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex gap-1.5 items-center text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg text-xs font-medium"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{product.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteProduct?.(product.id)}
                    className="bg-red-600 hover:bg-red-700 rounded-lg"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleFeatured?.(product.id, !product.featured)}
              className={cn(
                'flex gap-1.5 items-center text-xs font-medium rounded-lg',
                product.featured
                  ? 'bg-purple-50 text-purple-600 border-purple-300 hover:bg-purple-100'
                  : 'text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              {product.featured ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
              Featured
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleStock?.(product.id, !product.inStock)}
              className={cn(
                'flex gap-1.5 items-center text-xs font-medium rounded-lg',
                product.inStock
                  ? 'bg-green-50 text-green-600 border-green-300 hover:bg-green-100'
                  : 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100'
              )}
            >
              {product.inStock ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
              Stock
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminProductCard;