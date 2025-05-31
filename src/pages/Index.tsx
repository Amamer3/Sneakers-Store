
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockProducts } from '@/data/mockData';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import HeroCarousel from '@/components/HeroCarousel';
import PromoBanner from '@/components/PromoBanner';
import { Star, Truck, Shield, HeadphonesIcon } from 'lucide-react';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const featuredProducts = mockProducts.filter(product => product.featured);
  const categories = ['all', ...Array.from(new Set(mockProducts.map(product => product.category)))];
  
  const filteredProducts = selectedCategory === 'all' 
    ? mockProducts 
    : mockProducts.filter(product => product.category === selectedCategory);

  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "Free shipping on orders over $100"
    },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "100% secure payment processing"
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Support",
      description: "Round-the-clock customer service"
    },
    {
      icon: Star,
      title: "Quality Guarantee",
      description: "Premium quality guaranteed"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section with Carousel */}
      <HeroCarousel />

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <div className="bg-white rounded-full px-6 py-2">
                <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FEATURED COLLECTION
                </span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trending <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Sneakers</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Hand-picked selection of the most popular and trending sneakers from top brands
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map(product => (
              <div key={product.id} className="transform hover:scale-105 transition-transform duration-300">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Products */}
      <section id="products" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Complete <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Collection</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Browse our complete range of premium sneakers</p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`capitalize transition-all duration-300 ${
                  selectedCategory === category 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg" 
                    : "hover:scale-105"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="transform hover:scale-105 transition-transform duration-300">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <PromoBanner />

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl font-bold text-2xl inline-block mb-6 shadow-2xl">
                SNKRS
              </div>
              <p className="text-gray-300 leading-relaxed">Your ultimate destination for premium sneakers and streetwear fashion.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Shop</h3>
              <ul className="space-y-3 text-gray-300">
                <li><Link to="/search?q=Nike" className="hover:text-blue-400 transition-colors">Nike</Link></li>
                <li><Link to="/search?q=Adidas" className="hover:text-blue-400 transition-colors">Adidas</Link></li>
                <li><Link to="/search?q=Jordan" className="hover:text-blue-400 transition-colors">Jordan</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Customer Service</h3>
              <ul className="space-y-3 text-gray-300">
                <li><Link to="/track-order" className="hover:text-blue-400 transition-colors">Track Your Order</Link></li>
                <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
                <li><Link to="/shipping" className="hover:text-blue-400 transition-colors">Shipping Info</Link></li>
                <li><Link to="/returns" className="hover:text-blue-400 transition-colors">Returns</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Account</h3>
              <ul className="space-y-3 text-gray-300">
                <li><Link to="/profile" className="hover:text-blue-400 transition-colors">My Account</Link></li>
                <li><Link to="/track-order" className="hover:text-blue-400 transition-colors">Order History</Link></li>
                <li><Link to="/wishlist" className="hover:text-blue-400 transition-colors">Wishlist</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 SNKRS. All rights reserved. Made with ❤️ for sneaker enthusiasts.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
