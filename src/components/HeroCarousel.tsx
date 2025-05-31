
import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';

const HeroCarousel = () => {
  const heroSlides = [
    {
      id: 1,
      title: "Step Into Style",
      subtitle: "Discover the latest and greatest sneakers from top brands. Your perfect pair is waiting.",
      gradient: "from-blue-900/80 via-purple-900/80 to-indigo-900/80",
      textGradient: "from-blue-400 to-purple-400",
      backgroundImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=2000&q=80"
    },
    {
      id: 2,
      title: "Exclusive Collection",
      subtitle: "Get access to limited edition sneakers and premium collections from world-renowned brands.",
      gradient: "from-purple-900/80 via-indigo-900/80 to-blue-900/80",
      textGradient: "from-purple-400 to-blue-400",
      backgroundImage: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=2000&q=80"
    },
    {
      id: 3,
      title: "Unbeatable Comfort",
      subtitle: "Experience the perfect blend of style and comfort with our carefully curated sneaker selection.",
      gradient: "from-indigo-900/80 via-blue-900/80 to-purple-900/80",
      textGradient: "from-indigo-400 to-purple-400",
      backgroundImage: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=2000&q=80"
    }
  ];

  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {heroSlides.map((slide) => (
          <CarouselItem key={slide.id}>
            <section className="relative text-white py-20 overflow-hidden h-[700px] flex items-center">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${slide.backgroundImage})` }}
              />
              
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`}></div>
              
              {/* Additional Dark Overlay for better text readability */}
              <div className="absolute inset-0 bg-black/30"></div>
              
              {/* Content */}
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full z-10">
                <div className="backdrop-blur-sm bg-white/5 rounded-3xl p-12 border border-white/10">
                  <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
                    {slide.title.split(' ').slice(0, -1).join(' ')}
                    <span className={`bg-gradient-to-r ${slide.textGradient} bg-clip-text text-transparent`}> {slide.title.split(' ').slice(-1)}</span>
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto animate-fade-in leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <Button asChild size="lg" className="animate-fade-in bg-white text-black hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-2xl">
                    <Link to="#products">
                      Shop Now
                      <ArrowDown className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Bottom Fade */}
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent"></div>
            </section>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm" />
      <CarouselNext className="right-4 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm" />
    </Carousel>
  );
};

export default HeroCarousel;
