import React from 'react';
import { RefreshCcw, PackageCheck, ShieldCheck, Mail } from 'lucide-react';

const Returns: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Hero Section */}
    <section
      className="relative bg-cover bg-center bg-no-repeat py-20 px-4 sm:px-6 lg:px-8 text-white overflow-hidden"
      style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-indigo-900/80"></div>
      <div className="relative max-w-5xl mx-auto text-center z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-xl animate-fade-in-up">
          Hassle-Free Returns
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl font-light mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
          We want you to love your sneakers. If you’re not 100% satisfied, our return process is simple and transparent.
        </p>
        <a
          href="#policy"
          className="inline-block bg-white text-blue-900 font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-blue-100 transition-all duration-300 transform hover:-translate-y-1"
        >
          Explore Return Policy
        </a>
      </div>
    </section>

    {/* Policy Cards */}
    <section id="policy" className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-blue-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <RefreshCcw className="h-12 w-12 text-blue-600 mb-4" />
          <h2 className="font-bold text-xl text-gray-900 mb-3">Eligibility</h2>
          <ul className="text-gray-600 text-sm space-y-2 leading-relaxed">
            <li>
              Return within <span className="font-semibold">14 days</span> of delivery
            </li>
            <li>Unworn, unused, in original packaging</li>
            <li>Final sale items are not eligible</li>
          </ul>
        </div>
        <div className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-purple-500 border-solid transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <PackageCheck className="h-12 w-12 text-purple-600 mb-4" />
          <h2 className="font-bold text-xl text-gray-900 mb-3">How to Return</h2>
          <ol className="text-gray-600 text-sm space-y-2 list-decimal list-inside text-left">
            <li>
              Email{' '}
              <a
                href="mailto:support@sneakersstore.com"
                className="text-blue-600 underline hover:text-blue-800 transition-colors duration-200"
              >
                support@sneakersstore.com
              </a>
            </li>
            <li>Get return instructions & shipping label</li>
            <li>Pack sneakers in original box</li>
            <li>Ship with provided label</li>
          </ol>
        </div>
        <div className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-indigo-500 border-solid transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <ShieldCheck className="h-12 w-12 text-indigo-600 mb-4" />
          <h2 className="font-bold text-xl text-gray-900 mb-3">Refunds & Shipping</h2>
          <ul className="text-gray-600 text-sm space-y-2 leading-relaxed">
            <li>Return shipping: customer pays (unless our error)</li>
            <li>
              Refunds in <span className="font-semibold">3–5 business days</span> after inspection
            </li>
            <li>Email confirmation when refund is issued</li>
          </ul>
        </div>
      </div>
    </section>

    {/* Contact */}
    <section className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-6 w-6 text-blue-600" />
          <h2 className="font-bold text-xl text-gray-900">Questions?</h2>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          Reach out to our support team at{' '}
          <a
            href="mailto:support@sneakersstore.com"
            className="text-blue-600 underline font-medium hover:text-blue-800 transition-colors duration-200"
          >
            support@sneakersstore.com
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
        },
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

export default Returns;