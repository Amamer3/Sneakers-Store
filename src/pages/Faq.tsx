import React from 'react';
import { HelpCircle, Mail } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'How can I check my order status?',
    answer:
      'You’ll receive an email with tracking information once your order ships. You can also log in to your account to view your order status.',
  },
  {
    question: 'What shipping options do you offer?',
    answer:
      'We offer domestic and international shipping with tracking. Delivery times and fees vary by location. See our Shipping Information page for details.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'Returns are accepted within 14 days of delivery for unworn items in original packaging. Visit our Return Policy page for more info.',
  },
  {
    question: 'Which payment methods do you accept?',
    answer:
      'We accept major credit cards, PayPal, and select digital wallets. All payments are processed securely.',
  },
  {
    question: 'How do I choose the right size?',
    answer:
      'Refer to our size guide on each product page. If you need more help, contact our support team for personalized advice.',
  },
  {
    question: 'Are your products authentic?',
    answer:
      'Absolutely! We guarantee 100% authenticity on every product we sell. Our team carefully inspects and sources all items from trusted partners.',
  },
  {
    question: 'Can I change or cancel my order?',
    answer:
      'If your order hasn’t shipped yet, contact us as soon as possible. We’ll do our best to accommodate changes or cancellations.',
  },
];

const Faq: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Hero Section */}
    <section
      className="relative bg-cover bg-center bg-no-repeat py-20 px-4 sm:px-6 lg:px-8 text-white overflow-hidden"
      style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-indigo-900/80"></div>
      <div className="relative max-w-5xl mx-auto text-center z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-xl animate-fade-in-up">
          Frequently Asked Questions
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl font-light mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
          Find answers to common questions about orders, shipping, returns, and more.
        </p>
        <a
          href="#faqs"
          className="inline-block bg-white text-blue-900 font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-blue-100 transition-all duration-300 transform hover:-translate-y-1"
        >
          Explore FAQs
        </a>
      </div>
    </section>

    {/* FAQ Cards */}
    <section id="faqs" className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start border-t-4 border-blue-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex items-center gap-3 mb-3">
              <HelpCircle className="h-6 w-6 text-blue-600" />
              <h2 className="font-bold text-lg text-gray-900">{faq.question}</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Contact */}
    <section className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-6 w-6 text-blue-600" />
          <h2 className="font-bold text-xl text-gray-900">Still have questions?</h2>
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

export default Faq;