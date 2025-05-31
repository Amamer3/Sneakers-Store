
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Gift, Truck, Shield } from 'lucide-react';

const PromoBanner = () => {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose SNKRS?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Experience the ultimate sneaker shopping with unmatched benefits
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="bg-white/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Truck className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Free Shipping</h3>
            <p className="text-blue-100">On orders over $100. Fast and reliable delivery worldwide.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Authenticity Guaranteed</h3>
            <p className="text-blue-100">100% authentic sneakers verified by our experts.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Gift className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Exclusive Drops</h3>
            <p className="text-blue-100">Get early access to limited edition releases.</p>
          </div>
        </div>
        
        <div className="text-center">
          <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            <Link to="/register">
              Join SNKRS Today
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
