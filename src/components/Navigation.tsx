
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Menu, X, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is logged in (has token in localStorage)
  const isLoggedIn = !!localStorage.getItem("authToken");
  const isStudentDashboard = location.pathname === "/student/dashboard";
  const isAdminDashboard = location.pathname === "/admin/dashboard";
  const isDashboard = isStudentDashboard || isAdminDashboard;

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Student Login", path: "/student/login" },
    { label: "Admin Login", path: "/admin/login" }
  ];

  const isActive = (path: string) => {
    if (path.startsWith("#")) return false;
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SmartLibrary</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {!isDashboard && navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  isActive(item.path) 
                    ? "text-blue-600" 
                    : "text-gray-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {isDashboard && isLoggedIn ? (
              <Button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            ) : !isDashboard && (
              <Link to="/student/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Sign Up
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              {!isDashboard && navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 py-2 ${
                    isActive(item.path) 
                      ? "text-blue-600" 
                      : "text-gray-600"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {isDashboard && isLoggedIn ? (
                <Button 
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white w-full flex items-center justify-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              ) : !isDashboard && (
                <Link to="/student/signup" onClick={() => setIsMenuOpen(false)}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                    Sign Up
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
