import React, { useCallback, useState, useEffect, useRef } from 'react';

// Extend the Window interface to include the analytics property
declare global {
  interface Window {
    analytics?: {
      page(arg0: { productId: string; productName: string; category: string; brand: string; }): unknown;
      track: (event: string, properties?: Record<string, any>) => void;
    };
  }
}
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  gradient: string;
  textGradient: string;
  backgroundImage: string;
  sneakerImage: string;
}

const HeroCarousel: React.FC = React.memo(() => {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number>();

  const heroSlides: HeroSlide[] = [
    {
      id: 1,
      title: 'Kick It Fresh',
      subtitle: 'Unleash your style with the latest drops from top sneaker brands.',
      gradient: 'from-red-600/50 via-purple-600/50 to-blue-600/50',
      textGradient: 'from-red-300 to-blue-300',
      backgroundImage: 'https://static.nike.com/a/images/f_auto,cs_srgb/w_1536,c_limit/82c46c4e-1dd5-47dd-83c2-7289b2eef2f4/men-s-shoes-clothing-accessories.jpg',
      sneakerImage: 'https://images.pexels.com/photos/1032110/pexels-photo-1032110.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
    {
      id: 2,
      title: 'Own The Drop',
      subtitle: 'Exclusive limited-edition sneakers for those who dare to stand out.',
      gradient: 'from-purple-600/50 via-blue-600/50 to-teal-600/50',
      textGradient: 'from-purple-300 to-teal-300',
      backgroundImage: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=2400&q=85',
      sneakerImage: 'https://1stcopyshoe.com/wp-content/uploads/2023/09/travis-scott-retro-6-air-jordan-2.jpeg',
    },
    {
      id: 3,
      title: 'Walk Your Way',
      subtitle: 'Comfort and style collide in our curated sneaker collection.',
      gradient: 'from-blue-600/50 via-teal-600/50 to-green-600/50',
      textGradient: 'from-blue-300 to-green-300',
      backgroundImage: 'https://images.unsplash.com/photo-1600585153490-76fb20a0f2b4?auto=format&fit=crop&w=2400&q=85',
      sneakerImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const handleShopNowClick = useCallback((slideId: number, slideTitle: string) => {
    window.analytics?.track('Shop Now Clicked', {
      slideId,
      slideTitle,
    });
  }, []);

  // Handle carousel changes
  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      const selectedSlide = api.selectedScrollSnap();
      if (typeof selectedSlide === 'number') {
        setCurrentSlide(selectedSlide);
      }
    });
  }, [api]);

  // Auto-advance slides
  useEffect(() => {
    const startAutoplay = () => {
      if (intervalRef.current) return;
      
      intervalRef.current = window.setInterval(() => {
        if (!isPaused && api) {
          api.scrollNext();
        }
      }, 6000);
    };

    const stopAutoplay = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };

    if (api) {
      startAutoplay();
    }

    return () => stopAutoplay();
  }, [api, isPaused]);

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Carousel
        className="w-full"
        opts={{ loop: true, align: 'center' }}
        setApi={setApi}
        aria-label="Sneaker hero carousel"
      >
        <CarouselContent>
        {heroSlides.map((slide, index) => (
            <CarouselItem key={slide.id}>
              <section
                className="relative text-white py-8 xs:py-10 sm:py-12 md:py-16 h-[400px] xs:h-[450px] sm:h-[500px] md:h-[600px] lg:h-[700px] xl:h-[800px] flex items-center transition-all duration-1200 ease-in-out"
                aria-labelledby={`slide-title-${slide.id}`}
              >
                {/* Background Image with Subtle Zoom */}
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transform transition-transform duration-10000 ease-in-out"
                  style={{
                    backgroundImage: `url(${slide.backgroundImage || '/fallback-image.jpg'})`,
                    transform: `scale(${index === currentSlide ? 1.25 : 1.15})`,
                    willChange: 'transform',
                  }}
                />

                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-85 transition-opacity duration-1200 animate-pulse-glow`}
                ></div>

                {/* Dark Overlay for Contrast */}
                <div className="absolute inset-0 bg-black/45 transition-opacity duration-800"></div>

                {/* Content with Responsive Layout */}
                <div className="relative max-w-[90%] xs:max-w-[85%] sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-8">
                  {/* Text Content */}
                  <div className="lg:w-1/2 text-left space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8 animate-slide-in-left">
                    {/* Small Title */}
                    <div className="inline-block" style={{ animationDelay: '0.1s' }}>
                      <div className="bg-white/10 backdrop-blur-md rounded-full px-3 xs:px-4 py-1 text-xs xs:text-sm font-medium text-white border border-white/20">
                        Featured Collection {new Date().getFullYear()}
                      </div>
                    </div>
                    
                    <h1
                      id={`slide-title-${slide.id}`}
                      className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight"
                    >
                      {slide.title.split(' ').map((word, i, arr) => (
                        <span
                          key={i}
                          className={
                            i === arr.length - 1
                              ? `relative bg-gradient-to-r ${slide.textGradient} bg-clip-text text-transparent`
                              : 'text-white relative'
                          }
                          style={{ 
                            animationDelay: `${i * 0.1}s`,
                            textShadow: i !== arr.length - 1 ? '0 0 60px rgba(255,255,255,0.3)' : 'none'
                          }}
                        >
                          {word}{' '}
                          {i === arr.length - 1 && (
                            <span className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent blur-xl opacity-50"></span>
                          )}
                        </span>
                      ))}
                    </h1>
                    
                    <p
                      className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-100/90 max-w-sm xs:max-w-md sm:max-w-lg animate-slide-in-left font-light"
                      style={{ animationDelay: '0.3s' }}
                    >
                      {slide.subtitle || 'Explore our collection today.'}
                    </p>

                    <div className="flex flex-wrap gap-3 xs:gap-4 items-center" style={{ animationDelay: '0.5s' }}>
                      <Button
                        asChild
                        size="lg"
                        className="group relative bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600 text-white font-semibold py-3 xs:py-4 px-6 xs:px-8 sm:px-10 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 transform hover:scale-105 animate-slide-in-left overflow-hidden text-sm xs:text-base"
                        onClick={() => handleShopNowClick(slide.id, slide.title)}
                        aria-label={`Shop now for ${slide.title}`}
                      >
                        <Link to="/products" className="flex items-center">
                          <span className="relative z-10">Shop Now</span>
                          <ArrowRight className="ml-2 h-4 xs:h-5 w-4 xs:w-5 group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
                          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md text-sm xs:text-base py-3 xs:py-4 px-6 xs:px-8"
                      >
                        Learn More
                      </Button>
                    </div>
                  </div>

                  {/* Floating Sneaker Image */}
                  <div className="lg:w-1/2 relative mt-8 xs:mt-10 sm:mt-12 lg:mt-0">
                    {/* Decorative circles */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%]">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent rotate-45 animate-glow"></div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-transparent -rotate-45 animate-pulse-glow"></div>
                    </div>
                    
                    {/* Sneaker container */}
                    <div className="relative animate-float group">
                      {/* Glow effect */}
                      <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 animate-glow blur-xl"></div>
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      
                      {/* Main image */}
                      <img
                        src={slide.sneakerImage}
                        alt={`Featured sneaker for ${slide.title}`}
                        className="relative w-full max-w-[200px] xs:max-w-[250px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px] mx-auto transform rotate-6 group-hover:rotate-0 transition-transform duration-700 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        style={{
                          filter: 'contrast(1.1) brightness(1.1)',
                        }}
                        srcSet={`
                          ${slide.sneakerImage}?w=200 200w,
                          ${slide.sneakerImage}?w=300 300w,
                          ${slide.sneakerImage}?w=400 400w,
                          ${slide.sneakerImage}?w=500 500w
                        `}
                        sizes="(max-width: 639px) 200px, (max-width: 767px) 250px, (max-width: 1023px) 300px, (max-width: 1279px) 400px, 500px"
                      />
                      
                      {/* Reflection */}
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-transparent to-white/10 blur-sm transform -scale-y-100 opacity-50"></div>
                    </div>
                  </div>
                </div>

                {/* Bottom Fade */}
                <div className="absolute bottom-0 left-0 w-full h-16 xs:h-20 sm:h-24 md:h-32 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-800"></div>
              </section>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Progress Indicators */}
      <div className="absolute bottom-6 xs:bottom-8 sm:bottom-10 md:bottom-12 left-1/2 transform -translate-x-1/2 flex items-center gap-3 xs:gap-4">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            className="group relative"
            onClick={() => api?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          >
            {/* Base circle */}
            <div className={`
              relative w-2 xs:w-3 sm:w-4 h-2 xs:h-3 sm:h-4 rounded-full 
              transition-all duration-500 transform
              ${currentSlide === index ? 'scale-100' : 'scale-75'}
              ${currentSlide === index 
                ? 'bg-gradient-to-r from-red-400 to-blue-400' 
                : 'bg-white/20 group-hover:bg-white/40'
              }
            `}>
              {/* Active slide effects */}
              {currentSlide === index && (
                <>
                  {/* Ping effect */}
                  <span className="absolute inset-0 rounded-full animate-ping bg-gradient-to-r from-red-400/30 to-blue-400/30"></span>
                  {/* Glow effect */}
                  <span className="absolute inset-0 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.7)]"></span>
                </>
              )}
            </div>

            {/* Progress bar between dots */}
            {index < heroSlides.length - 1 && (
              <div className="absolute top-1/2 left-full w-6 xs:w-8 h-0.5 -translate-y-1/2">
                <div className={`
                  h-full bg-white/20
                  ${currentSlide === index ? 'w-full' : 'w-0'}
                  transition-all duration-500
                `}></div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

export default HeroCarousel;