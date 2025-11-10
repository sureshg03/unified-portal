import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, ArrowLeft, Search, AlertCircle, Compass, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-purple-50 to-purple-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Floating Shapes */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-purple-400/20 to-purple-400/20"
            style={{
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 text-center">
        {/* 404 Illustration */}
        <div className="mb-8 relative">
          <div className="inline-block relative">
            {/* Animated 404 Text */}
            <h1 className="text-[140px] sm:text-[200px] font-black leading-none bg-gradient-to-br from-purple-600 via-purple-600 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl animate-bounce-slow">
              404
            </h1>
            
            {/* Floating Icons */}
            <div className="absolute -top-8 -left-8 animate-float">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl rotate-12">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="absolute -top-4 -right-12 animate-float-delayed">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                <Compass className="w-7 h-7 text-white" />
              </div>
            </div>
            
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 animate-float-slow">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-500 rounded-xl flex items-center justify-center shadow-2xl -rotate-12">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>

         
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-10 space-y-5">
          <h2 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-purple-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
            Oops! Page Not Found
          </h2>
        
        </div>

        {/* Search Bar */}
        <Card className="max-w-2xl mx-auto mb-12 p-3 bg-white/90 backdrop-blur-2xl border border-purple-200/50 shadow-2xl rounded-2xl hover:shadow-purple-200/50 transition-all duration-300">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
              <Input
                type="text"
                placeholder="Search for what you're looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-4 py-7 text-lg border-0 focus-visible:ring-2 focus-visible:ring-purple-300 bg-transparent rounded-xl font-medium placeholder:text-gray-400"
              />
            </div>
            <Button 
              type="submit"
              className="h-14 px-10 bg-gradient-to-r from-purple-600 via-purple-600 to-purple-600 hover:from-purple-900 hover:via-purple-900 hover:to-purple-900 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
            >
              Search
            </Button>
          </form>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link to="/" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full px-10 py-7 text-lg font-bold bg-gradient-to-r from-purple-600 via-purple-600 to-purple-600 hover:from-purple-900 hover:via-purple-900 hover:to-purple-900 text-white shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 group rounded-xl"
            >
              <Home className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-16 p-8 bg-gradient-to-br from-white/80 to-purple-50/80 backdrop-blur-2xl rounded-3xl border border-purple-200/50 shadow-2xl max-w-2xl mx-auto hover:shadow-purple-200/50 transition-all duration-300">
          <p className="text-gray-700 mb-3 text-lg font-medium">
            <span className="font-bold text-transparent bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text">Need help?</span> If you believe this is an error, please contact support.
          </p>
          <p className="text-sm text-gray-500 font-medium">
            Error Code: 404 - Page Not Found • LSC Portal
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-5deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translate(-50%, 0px) rotate(-12deg); }
          50% { transform: translate(-50%, -15px) rotate(-8deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
