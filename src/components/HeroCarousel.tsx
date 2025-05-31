
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
      gradient: "from-blue-900 via-purple-900 to-indigo-900",
      textGradient: "from-blue-400 to-purple-400"
    },
    {
      id: 2,
      title: "Exclusive Collection",
      subtitle: "Get access to limited edition sneakers and premium collections from world-renowned brands.",
      gradient: "from-purple-900 via-indigo-900 to-blue-900",
      textGradient: "from-purple-400 to-blue-400"
    },
    {
      id: 3,
      title: "Unbeatable Comfort",
      subtitle: "Experience the perfect blend of style and comfort with our carefully curated sneaker selection.",
      gradient: "from-indigo-900 via-blue-900 to-purple-900",
      textGradient: "from-indigo-400 to-purple-400"
    }
  ];

  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {heroSlides.map((slide) => (
          <CarouselItem key={slide.id}>
            <section className={`relative bg-gradient-to-r ${slide.gradient} text-white py-20 overflow-hidden h-[600px] flex items-center`}>
              <div className="absolute inset-0 bg-black opacity-20"></div>
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
                  {slide.title.split(' ').slice(0, -1).join(' ')}
                  <span className={`bg-gradient-to-r ${slide.textGradient} bg-clip-text text-transparent`}> {slide.title.split(' ').slice(-1)}</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto animate-fade-in">
                  {slide.subtitle}
                </p>
                <Button asChild size="lg" className="animate-fade-in bg-white text-black hover:bg-gray-100">
                  <Link to="#products">
                    Shop Now
                    <ArrowDown className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent"></div>
            </section>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" />
      <CarouselNext className="right-4" />
    </Carousel>
  );
};

export default HeroCarousel;
