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
import { Switch } from '@/components/ui/switch';
import {
  Percent,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Download,
  Copy,
  Calendar,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Gift
} from 'lucide-react';
import { couponService, Coupon, CouponUsageStats } from '@/services/coupon-service';
import { DiscountType } from '@/types/order';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface CouponFilters {
  status?: 'active' | 'inactive' | 'expired';
  type?: DiscountType;
  search?: string;
}

interface CouponFormData {
  code: string;
  description: string;
  type: DiscountType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  userLimit?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];

  isFirstTimeOnly?: boolean;
}

const CouponManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { items: cartItems, totalPrice: cartTotal } = useCart();
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [usageStats, setUsageStats] = useState<CouponUsageStats>({ totalCoupons: 0, activeCoupons: 0, totalUsage: 0, totalDiscount: 0, topCoupons: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CouponFilters>({});
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    description: '',
    type: 'percentage',
    value: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  });
  const [activeTab, setActiveTab] = useState('overview');

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [couponsResponse, statsResponse] = await Promise.allSettled([
        couponService.getAllCoupons(),
        couponService.getCouponStats()
      ]);

      if (couponsResponse.status === 'fulfilled') {
        setCoupons(couponsResponse.value);
      }

      if (statsResponse.status === 'fulfilled') {
        setUsageStats(statsResponse.value);
      }

    } catch (err: any) {
      console.error('Error fetching coupons:', err);
      setError(err.message || 'Failed to fetch coupons');
      toast({
        title: 'Error',
        description: 'Failed to fetch coupons',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async () => {
    try {
      if (!formData.code || !formData.description || !formData.value) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      await couponService.createCoupon({
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      });

      toast({
        title: 'Success',
        description: 'Coupon created successfully'
      });

      setShowCreateDialog(false);
      resetForm();
      fetchCoupons();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create coupon',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateCoupon = async () => {
    try {
      if (!selectedCoupon || !formData.code || !formData.description || !formData.value) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      await couponService.updateCoupon(selectedCoupon.id, {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      });

      toast({
        title: 'Success',
        description: 'Coupon updated successfully'
      });

      setShowEditDialog(false);
      setSelectedCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update coupon',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await couponService.deleteCoupon(couponId);
      toast({
        title: 'Success',
        description: 'Coupon deleted successfully'
      });
      fetchCoupons();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete coupon',
        variant: 'destructive'
      });
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    try {
      await couponService.updateCoupon(coupon.id, {
        ...coupon,
        isActive: !coupon.isActive
      });
      toast({
        title: 'Success',
        description: `Coupon ${coupon.isActive ? 'deactivated' : 'activated'} successfully`
      });
      fetchCoupons();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update coupon status',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true
    });
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
      usageLimit: coupon.usageLimit,
      userLimit: coupon.userLimit,
      startDate: new Date(coupon.startDate).toISOString().split('T')[0],
      endDate: new Date(coupon.endDate).toISOString().split('T')[0],
      isActive: coupon.isActive,
      applicableProducts: coupon.applicableProducts,
      applicableCategories: coupon.applicableCategories,

      isFirstTimeOnly: coupon.isFirstTimeOnly
    });
    setShowEditDialog(true);
  };

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.startDate);
    const validUntil = new Date(coupon.endDate);

    if (!coupon.isActive) {
      return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    } else if (now < validFrom) {
      return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    } else if (now > validUntil) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { label: 'Used Up', color: 'bg-orange-100 text-orange-800' };
    } else {
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    }
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    } else {
      return `₵${coupon.value}`;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Coupon code copied to clipboard'
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredCoupons = coupons.filter(coupon => {
    if (filters.search && !coupon.code.toLowerCase().includes(filters.search.toLowerCase()) &&
        !coupon.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.type && coupon.type !== filters.type) {
      return false;
    }
    if (filters.status) {
      const status = getCouponStatus(coupon);
      if (filters.status === 'active' && status.label !== 'Active') return false;
      if (filters.status === 'inactive' && status.label !== 'Inactive') return false;
      if (filters.status === 'expired' && status.label !== 'Expired') return false;
    }
    return true;
  });

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => getCouponStatus(c).label === 'Active').length;
  const expiredCoupons = coupons.filter(c => getCouponStatus(c).label === 'Expired').length;
  const totalUsage = usageStats.totalUsage;
    const totalSavings = usageStats.totalDiscount;

  if (loading && coupons.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Example usage for validating a coupon (add this where you need to validate a coupon):
  const validateCoupon = async (code: string, cartTotalOverride?: number) => {
    try {
      const result = await couponService.validateCoupon({
        code,
        userId: user?.id || user?._id || '',
        cart: cartItems,
        cartTotal: typeof cartTotalOverride === 'number' ? cartTotalOverride : cartTotal
      });
      // Handle result (e.g., show toast, update UI, etc.)
      if (result.isValid) {
        toast({
          title: 'Coupon Valid',
          description: 'The coupon is valid!',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Invalid Coupon',
          description: result.error || 'Coupon is not valid',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to validate coupon',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupon Management</h1>
          <p className="text-muted-foreground">
            Create and manage discount coupons and promotional codes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
          <Button onClick={fetchCoupons} disabled={loading}>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCoupons}</div>
            <p className="text-xs text-muted-foreground">All time coupons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCoupons}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Coupons</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredCoupons}</div>
            <p className="text-xs text-muted-foreground">No longer valid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">Times used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₵{totalSavings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Customer savings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search coupons..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.type || ''}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as DiscountType }))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="shipping">Free Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>Coupons</CardTitle>
          <CardDescription>Manage your discount coupons and promotional codes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCoupons.map((coupon) => {
              const status = getCouponStatus(coupon);
              const stats = usageStats.topCoupons?.find(s => s.code === coupon.code);
              
              return (
                <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {coupon.code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                      <Badge variant="outline">
                        {getDiscountDisplay(coupon)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Valid: {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}</span>
                      {coupon.usageLimit && (
                        <span>Usage: {coupon.usageCount}/{coupon.usageLimit}</span>
                      )}
                      {stats && (
                        <span>Savings: ₵{stats.totalDiscount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={coupon.isActive}
                      onCheckedChange={() => handleToggleCouponStatus(coupon)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCoupon(coupon);
                        setShowStatsDialog(true);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(coupon)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCoupon(coupon.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredCoupons.length === 0 && (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No coupons found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Coupon Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>
              Create a new discount coupon for your customers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., SAVE20"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Discount Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as DiscountType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe this coupon..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Discount Value *</Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step={formData.type === 'percentage' ? "1" : "0.01"}
                  placeholder={formData.type === 'percentage' ? "20" : "10.00"}
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minOrderAmount">Minimum Order Amount</Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.minOrderAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || undefined }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Valid From *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Valid Until *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.usageLimit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userLimit">Usage Limit Per User</Label>
                <Input
                  id="userLimit"
                  type="number"
                  placeholder="Enter usage limit per user"
                  value={formData.userLimit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, userLimit: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCoupon}>
                Create Coupon
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update coupon details and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Coupon Code *</Label>
                <Input
                  id="edit-code"
                  placeholder="e.g., SAVE20"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Discount Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as DiscountType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe this coupon..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-value">Discount Value *</Label>
                <Input
                  id="edit-value"
                  type="number"
                  min="0"
                  step={formData.type === 'percentage' ? "1" : "0.01"}
                  placeholder={formData.type === 'percentage' ? "20" : "10.00"}
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minOrderAmount">Minimum Order Amount</Label>
                <Input
                  id="edit-minOrderAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.minOrderAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || undefined }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Valid From *</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">Valid Until *</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-usageLimit">Usage Limit</Label>
                <Input
                  id="edit-usageLimit"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.usageLimit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-userLimit">Usage Limit Per User</Label>
                <Input
                  id="edit-userLimit"
                  type="number"
                  placeholder="Enter usage limit per user"
                  value={formData.userLimit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, userLimit: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCoupon}>
                Update Coupon
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coupon Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coupon Statistics</DialogTitle>
            <DialogDescription>
              Usage statistics for {selectedCoupon?.code}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCoupon && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Usage</Label>
                  <p className="text-2xl font-bold">
                    {usageStats.topCoupons?.find(s => s.code === selectedCoupon.code)?.usageCount || 0}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Total Savings</Label>
                  <p className="text-2xl font-bold">
                    ₵{usageStats.topCoupons?.find(s => s.code === selectedCoupon.code)?.totalDiscount.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Coupon Details</Label>
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <p><strong>Code:</strong> {selectedCoupon.code}</p>
                  <p><strong>Type:</strong> {selectedCoupon.type}</p>
                  <p><strong>Value:</strong> {getDiscountDisplay(selectedCoupon)}</p>
                  <p><strong>Valid:</strong> {formatDate(selectedCoupon.startDate)} - {formatDate(selectedCoupon.endDate)}</p>
                  {selectedCoupon.usageLimit && (
                    <p><strong>Usage Limit:</strong> {selectedCoupon.usageCount}/{selectedCoupon.usageLimit}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponManagement;