import React from 'react';
import { Users, Award, Globe, Zap } from 'lucide-react';

const About: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Hero Section */}
    <section
      className="relative bg-cover bg-center bg-no-repeat py-20 px-4 sm:px-6 lg:px-8 text-white overflow-hidden"
      style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-indigo-900/80"></div>
      <div className="relative max-w-5xl mx-auto text-center z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-xl animate-fade-in-up">
          About Sneakers Store
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl font-light mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
          Curating the world’s most sought-after sneakers and streetwear for passionate sneakerheads everywhere.
        </p>
        <a
          href="#story"
          className="inline-block bg-white text-blue-900 font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-blue-100 transition-all duration-300 transform hover:-translate-y-1"
        >
          Discover Our Story
        </a>
      </div>
    </section>

    {/* Brand Story Section */}
    <section id="story" className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        <div className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-blue-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <Award className="h-12 w-12 text-blue-600 mb-4" />
          <h2 className="font-bold text-xl text-gray-900 mb-3">Our Vision</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Sneakers are more than shoes—they’re a statement, a passion, and a way to express yourself. Our founder’s vision: a trusted space for sneaker lovers to discover and connect.
          </p>
        </div>
        <div className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-purple-500 border-solid transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <Zap className="h-12 w-12 text-purple-600 mb-4" />
          <h2 className="font-bold text-xl text-gray-900 mb-3">Authenticity</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Every pair is 100% authentic, sourced from reputable brands and partners. Shop with confidence and style—always.
          </p>
        </div>
        <div className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-indigo-500 border-solid transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <Globe className="h-12 w-12 text-indigo-600 mb-4" />
          <h2 className="font-bold text-xl text-gray-900 mb-3">Global Community</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Join a worldwide community of sneaker enthusiasts. Connect, share, and celebrate the culture with us!
          </p>
        </div>
        <div className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-t-4 border-pink-500 border-solid transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <Users className="h-12 w-12 text-pink-600 mb-4" />
          <h2 className="font-bold text-xl text-gray-900 mb-3">Our Promise</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            We’re committed to authenticity, quality, and connecting sneaker lovers worldwide. Thank you for choosing Sneakers Store.
          </p>
        </div>
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

export default About;