import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Mock coupon data
const mockCoupons = [
  {
    id: '1',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    description: 'Welcome discount for new customers',
    isActive: true,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    usageLimit: 100,
    usageCount: 25,
    minOrderAmount: 50,
    maxDiscount: 20,
    applicableCategories: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    code: 'SAVE25',
    type: 'fixed',
    value: 25,
    description: 'Fixed $25 off on orders over $100',
    isActive: true,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-06-30T23:59:59Z',
    usageLimit: 50,
    usageCount: 12,
    minOrderAmount: 100,
    applicableCategories: ['sneakers'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    code: 'EXPIRED20',
    type: 'percentage',
    value: 20,
    description: 'Expired coupon for testing',
    isActive: false,
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2023-12-31T23:59:59Z',
    usageLimit: 200,
    usageCount: 150,
    minOrderAmount: 30,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-12-31T00:00:00Z'
  }
];

let couponsData = [...mockCoupons];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error, using mock data');
          });
          
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Intercept API calls and provide mock responses
            const url = req.url;
            
            // Admin coupon endpoints
            if (url === '/api/admin/coupons' && req.method === 'GET') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ items: couponsData, total: couponsData.length }));
              return;
            }
            
            if (url === '/api/admin/coupons/stats' && req.method === 'GET') {
              const stats = {
                totalCoupons: couponsData.length,
                activeCoupons: couponsData.filter(c => c.isActive && new Date(c.endDate) > new Date()).length,
                totalUsage: couponsData.reduce((sum, c) => sum + c.usageCount, 0),
                totalDiscount: 1250.50,
                topCoupons: couponsData.sort((a, b) => b.usageCount - a.usageCount).slice(0, 5).map(c => ({
                  code: c.code,
                  usageCount: c.usageCount,
                  totalDiscount: c.usageCount * (c.type === 'percentage' ? 15 : c.value)
                }))
              };
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(stats));
              return;
            }
            
            if (url === '/api/admin/coupons' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                const newCoupon = {
                  id: Date.now().toString(),
                  ...JSON.parse(body),
                  usageCount: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                couponsData.push(newCoupon);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newCoupon));
              });
              return;
            }
            
            if (url.startsWith('/api/admin/coupons/') && req.method === 'PUT') {
              const id = url.split('/').pop();
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                const index = couponsData.findIndex(c => c.id === id);
                if (index !== -1) {
                  couponsData[index] = { ...couponsData[index], ...JSON.parse(body), updatedAt: new Date().toISOString() };
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(couponsData[index]));
                } else {
                  res.writeHead(404, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Coupon not found' }));
                }
              });
              return;
            }
            
            // Delete coupon
            if (url.startsWith('/api/admin/coupons/') && req.method === 'DELETE') {
              const id = url.split('/').pop();
              const index = couponsData.findIndex(c => c.id === id);
              if (index !== -1) {
                couponsData.splice(index, 1);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Coupon not found' }));
              }
              return;
            }

            // Apply coupon to cart
            if (url === '/api/cart/apply-coupon' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                const { couponCode, cartTotal } = JSON.parse(body);
                const coupon = couponsData.find(c => c.code.toLowerCase() === couponCode.toLowerCase());
                
                if (!coupon) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: 'Invalid coupon code' }));
                  return;
                }
                
                if (!coupon.isActive) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: 'This coupon is no longer active' }));
                  return;
                }
                
                const now = new Date();
                if (now > new Date(coupon.endDate) || now < new Date(coupon.startDate)) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: 'This coupon has expired or is not yet valid' }));
                  return;
                }
                
                if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: `Minimum order amount of $${coupon.minOrderAmount} required` }));
                  return;
                }
                
                let discountAmount = 0;
                if (coupon.type === 'percentage') {
                  discountAmount = (cartTotal * coupon.value) / 100;
                  if (coupon.maxDiscount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                  }
                } else {
                  discountAmount = coupon.value;
                }
                
                discountAmount = Math.min(discountAmount, cartTotal);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  success: true, 
                  appliedCoupon: {
                    code: coupon.code,
                    type: coupon.type,
                    value: coupon.value,
                    discountAmount: discountAmount
                  },
                  newTotal: cartTotal - discountAmount
                }));
              });
              return;
            }

            // Remove coupon from cart
            if (url === '/api/cart/remove-coupon' && req.method === 'POST') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Coupon removed from cart' }));
              return;
            }
            
            // Public coupon validation endpoint
            if (url === '/api/coupons/validate' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                const { couponCode, orderTotal } = JSON.parse(body);
                const coupon = couponsData.find(c => c.code.toLowerCase() === couponCode.toLowerCase());
                
                if (!coupon) {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ isValid: false, error: 'Coupon code not found' }));
                  return;
                }
                
                if (!coupon.isActive) {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ isValid: false, error: 'This coupon is no longer active' }));
                  return;
                }
                
                const now = new Date();
                if (now > new Date(coupon.endDate) || now < new Date(coupon.startDate)) {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ isValid: false, error: 'This coupon has expired or is not yet valid' }));
                  return;
                }
                
                if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ isValid: false, error: `Minimum order amount of $${coupon.minOrderAmount} required` }));
                  return;
                }
                
                let discountAmount = 0;
                if (coupon.type === 'percentage') {
                  discountAmount = (orderTotal * coupon.value) / 100;
                  if (coupon.maxDiscount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                  }
                } else {
                  discountAmount = coupon.value;
                }
                
                discountAmount = Math.min(discountAmount, orderTotal);
                
                const discount = {
                  type: coupon.type,
                  value: coupon.value,
                  amount: discountAmount,
                  code: coupon.code,
                  description: coupon.description
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  isValid: true, 
                  coupon, 
                  discount,
                  message: `Coupon applied! You saved $${discountAmount.toFixed(2)}` 
                }));
              });
              return;
            }
          });
        }
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

