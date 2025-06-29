import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Search, ShoppingCart, Heart, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavBadgeProps {
  count: number;
  highlight: boolean;
  icon: React.ReactNode;
  href: string;
  gradient: string;
  hoverColor: string;
  ringColor: string;
}

const NavBadge: React.FC<NavBadgeProps> = ({
  count,
  highlight,
  icon,
  href,
  gradient,
  hoverColor,
  ringColor,
}) => {
  return (
    <Link to={href} className="relative group" aria-label={`Go to ${href === '/cart' ? 'cart' : 'wishlist'}`}>
      <div
        className={`p-2.5 xs:p-3 rounded-full transition-colors duration-300 ${
          highlight ? hoverColor : `group-hover:${hoverColor} group-hover:bg-gray-200/80`
        } backdrop-blur-sm`}
      >
        {icon}
      </div>
      {count > 0 && (
        <div
          className={`absolute -top-1.5 -right-1.5 ${gradient} text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-2 shadow-[0_2px_8px_rgba(0,0,0,0.2)] transform transition-all duration-300 ${
            highlight
              ? `scale-110 ring-2 ${ringColor} ring-opacity-50`
              : 'scale-100'
          }`}
        >
          {count > 99 ? '99+' : count}
        </div>
      )}
    </Link>
  );
};

const Navbar = () => {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const { items: cartItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartHighlight, setCartHighlight] = useState(false);
  const [wishlistHighlight, setWishlistHighlight] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    AOS.init({
      duration: 600,
      once: true,
      easing: 'ease-out-cubic',
      delay: 50,
    });
  }, []);

  React.useEffect(() => {
    if (totalItems > 0) {
      setCartHighlight(true);
      const timer = setTimeout(() => setCartHighlight(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  React.useEffect(() => {
    if (wishlistItems.length > 0) {
      setWishlistHighlight(true);
      const timer = setTimeout(() => setWishlistHighlight(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [wishlistItems.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 border-b border-gray-200/50 backdrop-blur-md" data-aos="fade-down">
      <div className="container mx-auto px-4 xs:px-5 sm:px-6">
        <div className="flex items-center justify-between h-14 xs:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" aria-label="Go to homepage">
            <div className="px-3 xs:px-3.5 py-1.5 font-bold text-lg xs:text-xl tracking-tight transition-shadow duration-300">
              <img src="/kicksintel-logo-removebg.png" className='h-16 w-auto' alt="Kicks Intel" />
            </div>
          </Link>

          {/* Desktop Search Bar and NavBadges */}
          <div className="hidden md:flex items-center space-x-3 xs:space-x-4">
            <div className="flex-1 max-w-md lg:max-w-lg xl:max-w-2xl mx-4 xs:mx-6">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-10 border-gray-200/50 rounded-full py-1.5 text-sm bg-gray-50 focus:ring-indigo-500 focus:border-indigo-600 transition-colors duration-300"
                  aria-label="Search products"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1.5 top-1/2 transform -translate-y-1/2 hover:bg-gray-100/50"
                  aria-label="Submit search"
                >
                  <Search className="h-4 w-4 text-gray-500" />
                </Button>
              </form>
            </div>
            <CurrencySwitcher />
            <NavBadge
              count={wishlistItems.length}
              highlight={wishlistHighlight}
              icon={<Heart className="h-5 w-5 text-gray-600" />}
              href="/wishlist"
              gradient="bg-gradient-to-r from-red-500 to-pink-600"
              hoverColor="text-red-600"
              ringColor="ring-red-400"
            />
            <NavBadge
              count={totalItems}
              highlight={cartHighlight}
              icon={<ShoppingCart className="h-5 w-5 text-gray-600" />}
              href="/cart"
              gradient="bg-gradient-to-r from-indigo-600 to-purple-600"
              hoverColor="text-indigo-600"
              ringColor="ring-indigo-400"
            />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-gray-200/80 backdrop-blur-sm"
                    aria-label="User menu"
                  >
                    <User className="h-5 w-5 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg bg-white/95 backdrop-blur-sm">
                  {user && (
                    <DropdownMenuItem className="font-semibold text-gray-900 px-3 py-1.5">
                      {user.name}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => navigate('/profile')}
                    className="px-3 py-1.5 hover:bg-gray-100/80"
                  >
                    Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => navigate('/admin/dashboard')}
                      className="px-3 py-1.5 hover:bg-gray-100/80"
                    >
                      KicksIntel Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="px-3 py-1.5 hover:bg-gray-100/80 text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="rounded-full px-3 py-1 text-sm font-semibold hover:bg-gray-200/80 backdrop-blur-sm"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-3 py-1 text-sm font-semibold shadow-sm hover:shadow-md"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            <NavBadge
              count={wishlistItems.length}
              highlight={wishlistHighlight}
              icon={<Heart className="h-6 w-6 text-gray-600" />}
              href="/wishlist"
              gradient="bg-gradient-to-r from-red-500 to-pink-600"
              hoverColor="text-red-600"
              ringColor="ring-red-400"
            />
            <NavBadge
              count={totalItems}
              highlight={cartHighlight}
              icon={<ShoppingCart className="h-6 w-6 text-gray-600" />}
              href="/cart"
              gradient="bg-gradient-to-r from-indigo-600 to-purple-600"
              hoverColor="text-indigo-600"
              ringColor="ring-indigo-400"
            />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-200/80 backdrop-blur-sm"
                  aria-label="Open mobile menu"
                >
                  <Menu className="h-6 w-6 text-gray-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] xs:w-[300px] bg-white/95 backdrop-blur-md rounded-l-2xl border-l border-gray-200/50">
                <div className="flex flex-col space-y-6 mt-6 px-4 xs:px-5">
                  {/* Mobile Search Bar */}
                  <form onSubmit={handleSearch} className="relative">
                    <Input
                      type="search"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-12 border-gray-200/50 rounded-full py-2.5 text-base bg-gray-50 focus:ring-indigo-500 focus:border-indigo-600 shadow-sm transition-colors duration-300"
                      aria-label="Search products"
                    />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 hover:bg-gray-100/50"
                      aria-label="Submit search"
                    >
                      <Search className="h-5 w-5 text-gray-500" />
                    </Button>
                  </form>

                  {/* Currency Switcher */}
                  <div>
                    <CurrencySwitcher />
                  </div>

                  {/* Mobile Menu Links */}
                  <div className="space-y-4">
                    {isAuthenticated ? (
                      <>
                        {user && (
                          <div className="font-semibold text-gray-900 text-base border-b border-gray-200/50 pb-2">
                            {user.name}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigate('/profile');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full justify-start text-base font-medium hover:bg-gray-100/80 rounded-lg py-2 transition-colors duration-200"
                        >
                          Profile
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              navigate('/admin/dashboard');
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full justify-start text-base font-medium hover:bg-gray-100/80 rounded-lg py-2 transition-colors duration-200"
                          >
                            KicksIntel Dashboard
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className="w-full justify-start text-red-600 text-base font-medium hover:bg-red-100/50 rounded-lg py-2 transition-colors duration-200"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigate('/login');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full justify-start text-base font-medium hover:bg-gray-100/80 rounded-lg py-2 transition-colors duration-200"
                        >
                          Login
                        </Button>
                        <Button
                          onClick={() => {
                            navigate('/register');
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base font-medium py-2 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          Sign Up
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;