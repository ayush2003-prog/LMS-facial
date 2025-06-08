
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Search, Lock, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";

const Index = () => {
  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
      title: "Smart Book Management",
      description: "Efficiently manage your library's book inventory with real-time tracking and availability status."
    },
    {
      icon: <Lock className="h-8 w-8 text-blue-600" />,
      title: "Facial Authentication",
      description: "Secure access using advanced facial recognition technology for enhanced security and convenience."
    },
    {
      icon: <Search className="h-8 w-8 text-blue-600" />,
      title: "Advanced Search",
      description: "Find books quickly with powerful search capabilities by title, author, category, and more."
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Student Management",
      description: "Comprehensive student registration and management system for educational institutions."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Smart Library
            <span className="block text-blue-600">Management System</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Revolutionary library management with facial authentication technology. 
            Secure, efficient, and user-friendly platform for modern educational institutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/student/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                Get Started as Student
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg">
                Admin Access
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our System?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of library management with cutting-edge features designed for the modern world.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-blue-50 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            About Our System
          </h2>
          <p className="text-lg leading-relaxed mb-8 opacity-90">
            Our Smart Library Management System revolutionizes how educational institutions 
            manage their libraries. With advanced facial recognition technology, students can 
            securely access their accounts without passwords, while administrators maintain 
            complete control over inventory and user management.
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">99.9%</div>
              <div className="opacity-90">Recognition Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="opacity-90">System Availability</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="opacity-90">Secure Authentication</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Get In Touch
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Have questions about our library management system? We're here to help.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4 mx-auto w-fit p-3 bg-blue-50 rounded-full">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600">amitylibrary@gmail.com</p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4 mx-auto w-fit p-3 bg-green-50 rounded-full">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
                <p className="text-gray-600">7303-789-789</p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4 mx-auto w-fit p-3 bg-purple-50 rounded-full">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
                <p className="text-gray-600">3rd Floor, Clock Tower, Amity University Lucknow</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Smart Library Management System</h3>
          <p className="text-gray-400 mb-6">
            Empowering education through innovative technology solutions.
          </p>
          <div className="text-gray-400 text-sm">
            © 2024 Smart Library Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
