import React from 'react';
import { Truck, Globe, Timer, Mail } from 'lucide-react';

const Shipping: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Hero Section */}
    <section
      className="relative bg-cover bg-center bg-no-repeat py-20 px-4 sm:px-6 lg:px-8 text-white overflow-hidden"
      style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-indigo-900/80"></div>
      <div className="relative max-w-5xl mx-auto text-center z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-xl animate-fade-in-up">
          Shipping Information
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl font-light mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
          Fast, reliable delivery—worldwide. Track your order every step of the way.
        </p>
        <a
          href="#info"
          className="inline-block bg-white text-blue-900 font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-blue-100 transition-all duration-300 transform hover:-translate-y-1"
        >
          Explore Shipping Details
        </a>
      </div>
    </section>

    {/* Info Cards */}
    <section id="info" className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-blue-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <Timer className="h-12 w-12 text-blue-600 mb-4" />
          <h2 className="font-bold text-xl text-gray-900 mb-3">Processing Time</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Orders processed in <span className="font-semibold">1–2 business days</span>. Orders on weekends/holidays ship the next business day.
          </p>
        </div>
        <div className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-purple-500 border-solid transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <Truck className="h-12 w-12 text-purple-600 mb-4" />
          <h2 className="font-bold text-xl text-gray-900 mb-3">Domestic Shipping</h2>
          <ul className="text-gray-600 text-sm space-y-2 leading-relaxed">
            <li>
              Delivery: <span className="font-semibold">2–5 business days</span> after dispatch
            </li>
            <li>
              Flat rate: <span className="font-semibold">$8</span> (free over $150)
            </li>
            <li>Tracking included</li>
          </ul>
        </div>
        <div className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-indigo-500 border-solid transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <Globe className="h-12 w-12 text-indigo-600 mb-4" />
          <h2 className="font-bold text-xl text-gray-900 mb-3">International Shipping</h2>
          <ul className="text-gray-600 text-sm space-y-2 leading-relaxed">
            <li>
              Delivery: <span className="font-semibold">7–15 business days</span>
            </li>
            <li>Fees calculated at checkout</li>
            <li>Customs/taxes: recipient pays</li>
            <li>Tracking where available</li>
          </ul>
        </div>
      </div>
    </section>

    {/* Tracking & Delays */}
    <section className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl">
        <h2 className="font-bold text-xl text-blue-700 mb-4 flex items-center gap-2">
          <Timer className="h-6 w-6 text-blue-600" />
          Tracking & Delays
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          You’ll receive a tracking number by email once your order ships. Please allow up to 24 hours for tracking to update. Delivery times are estimates and may be affected by weather, customs, or carrier delays.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          Questions?{' '}
          <a
            href="mailto:support@sneakersstore.com"
            className="text-blue-600 underline font-medium hover:text-blue-800 transition-colors duration-200"
          >
            Contact our support team
          </a>
          .
        </p>
      </div>
    </section>

    {/* Tailwind CSS Animation Keyframes */}
    <style>{`
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
      }
      .animation-delay-200 {
        animation-delay: 0.2s;
      }
    `}</style>
  </div>
);

export default Shipping;