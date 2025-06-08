
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";
import { toast } from "sonner";
import databaseService from "@/services/databaseService";

interface AdminLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  admin?: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  };
}

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await databaseService.loginAdmin(email, password) as AdminLoginResponse;
      
      if (response.success) {
        // Store authentication token and user data
        localStorage.setItem("authToken", response.token!);
        localStorage.setItem("currentUser", JSON.stringify({
          ...response.admin,
          userType: "admin",
          loginTime: new Date().toISOString()
        }));
        
        toast.success("Admin login successful!");
        navigate("/admin/dashboard");
      } else {
        toast.error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      toast.error(error instanceof Error ? error.message : "Network error. Please ensure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Admin Login
              </CardTitle>
              <CardDescription className="text-gray-600">
                Access the administrative panel with your credentials
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email"
                    className="mt-1"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="mt-1"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In as Admin"}
                </Button>
              </form>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Demo Credentials:</strong><br />
                  Email: admin@gmail.com<br />
                  Password: admin123
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
