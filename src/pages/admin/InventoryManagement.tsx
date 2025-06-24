import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Edit,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  History
} from 'lucide-react';
import { inventoryService, InventoryItem, LowStockAlert, StockMovement } from '@/services/inventory-service';
import { productService } from '@/services/product-service';
import { Product } from '@/types/product';

interface InventoryFilters {
  lowStock?: boolean;
  outOfStock?: boolean;
  category?: string;
  location?: string;
  search?: string;
}

interface StockAdjustment {
  productId: string;
  size?: string;
  adjustment: number;
  reason: string;
  type: 'increase' | 'decrease' | 'set';
}

const InventoryManagement: React.FC = () => {
  const { toast } = useToast();
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [stockSummary, setStockSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showMovementHistory, setShowMovementHistory] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState<StockAdjustment>({
    productId: '',
    adjustment: 0,
    reason: '',
    type: 'increase'
  });
  const [activeTab, setActiveTab] = useState('overview');

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [summary, alerts, movements] = await Promise.allSettled([
        inventoryService.getStockSummary(),
        inventoryService.getLowStockAlerts(),
        inventoryService.getStockMovements(undefined, 50)
      ]);

      if (summary.status === 'fulfilled') {
        setStockSummary(summary.value);
      }

      if (alerts.status === 'fulfilled') {
        setLowStockAlerts(alerts.value);
      }

      if (movements.status === 'fulfilled') {
        setStockMovements(movements.value);
      }

      // Fetch products for inventory display
      const productsResponse = await productService.getProducts({ page: 1, limit: 100, sort: 'name' });
      setProducts(productsResponse.products || []);

    } catch (err: any) {
      console.error('Error fetching inventory data:', err);
      setError(err.message || 'Failed to fetch inventory data');
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  const handleStockAdjustment = async () => {
    try {
      if (!stockAdjustment.productId || !stockAdjustment.reason) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      if (stockAdjustment.type === 'set') {
        await inventoryService.updateStock(
          stockAdjustment.productId,
          stockAdjustment.size,
          stockAdjustment.adjustment,
          stockAdjustment.reason
        );
      } else {
        const adjustment = stockAdjustment.type === 'decrease' 
          ? -Math.abs(stockAdjustment.adjustment)
          : Math.abs(stockAdjustment.adjustment);
        
        await inventoryService.adjustStock(
          stockAdjustment.productId,
          stockAdjustment.size,
          adjustment,
          stockAdjustment.reason
        );
      }

      toast({
        title: 'Success',
        description: 'Stock adjusted successfully'
      });

      setShowStockAdjustment(false);
      setStockAdjustment({
        productId: '',
        adjustment: 0,
        reason: '',
        type: 'increase'
      });
      fetchInventoryData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to adjust stock',
        variant: 'destructive'
      });
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (item.quantity <= item.reorderLevel) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'out': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'adjustment': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'reserved': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'released': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !stockSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage product inventory levels
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowStockAdjustment(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Adjust Stock
          </Button>
          <Button onClick={fetchInventoryData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stockSummary?.totalProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stockSummary?.lowStockItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Need restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stockSummary?.outOfStockItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unavailable items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stockSummary?.totalValue?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Low Stock Alerts</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="products">Product Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Low Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Low Stock Alerts</CardTitle>
                <CardDescription>Products that need immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStockAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">SKU: {alert.sku}</p>
                        <p className="text-xs text-muted-foreground">
                          Current: {alert.currentStock} • Reorder: {alert.reorderLevel}
                        </p>
                      </div>
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                    </div>
                  ))}
                  {lowStockAlerts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No low stock alerts
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Stock Movements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Stock Movements</CardTitle>
                <CardDescription>Latest inventory changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stockMovements.slice(0, 5).map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getMovementIcon(movement.type)}
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{movement.sku}</p>
                          <p className="text-xs text-muted-foreground">
                            {movement.reason}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {movement.type === 'out' || movement.type === 'reserved' ? '-' : '+'}
                          {movement.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(movement.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {stockMovements.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent movements
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Products requiring immediate restocking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">SKU: {alert.sku}</p>
                      <p className="text-sm text-muted-foreground">
                        Product ID: {alert.productId}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Current Stock: {alert.currentStock}</span>
                        <span>Reorder Level: {alert.reorderLevel}</span>
                        <span>Suggested: {alert.suggestedReorder}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => {
                          setStockAdjustment({
                            productId: alert.productId,
                            adjustment: alert.suggestedReorder,
                            reason: 'Restocking due to low stock alert',
                            type: 'increase'
                          });
                          setShowStockAdjustment(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Restock
                      </Button>
                    </div>
                  </div>
                ))}
                {lowStockAlerts.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No low stock alerts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stock Movements</CardTitle>
                  <CardDescription>Complete history of inventory changes</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowMovementHistory(true)}
                >
                  <History className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getMovementIcon(movement.type)}
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{movement.sku}</p>
                        <p className="text-sm text-muted-foreground">{movement.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          By: {movement.performedBy} • {formatDate(movement.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {movement.type === 'out' || movement.type === 'reserved' ? '-' : '+'}
                        {movement.quantity}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {movement.type}
                      </Badge>
                    </div>
                  </div>
                ))}
                {stockMovements.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No stock movements found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>Current stock levels for all products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0]?.url || '/placeholder.svg'}
                          alt={product.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                      )}
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {product.sku || 'Not assigned'} • Category: {product.category}
                        </p>
                        <Badge className={product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setStockAdjustment({
                            productId: product.id,
                            adjustment: 0,
                            reason: '',
                            type: 'set'
                          });
                          setShowStockAdjustment(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Adjust
                      </Button>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No products found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showStockAdjustment} onOpenChange={setShowStockAdjustment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Update inventory levels for a product
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={stockAdjustment.productId}
                onValueChange={(value) => setStockAdjustment(prev => ({ ...prev, productId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku || 'No SKU'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="size">Size (Optional)</Label>
              <Input
                id="size"
                placeholder="e.g., 42, L, XL"
                value={stockAdjustment.size || ''}
                onChange={(e) => setStockAdjustment(prev => ({ ...prev, size: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Adjustment Type</Label>
              <Select
                value={stockAdjustment.type}
                onValueChange={(value) => setStockAdjustment(prev => ({ ...prev, type: value as 'increase' | 'decrease' | 'set' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase Stock</SelectItem>
                  <SelectItem value="decrease">Decrease Stock</SelectItem>
                  <SelectItem value="set">Set Stock Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adjustment">Quantity</Label>
              <Input
                id="adjustment"
                type="number"
                min="0"
                placeholder="Enter quantity"
                value={stockAdjustment.adjustment}
                onChange={(e) => setStockAdjustment(prev => ({ ...prev, adjustment: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Reason for stock adjustment"
                value={stockAdjustment.reason}
                onChange={(e) => setStockAdjustment(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowStockAdjustment(false)}>
                Cancel
              </Button>
              <Button onClick={handleStockAdjustment}>
                Apply Adjustment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;