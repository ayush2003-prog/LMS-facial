import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/Navigation";
import { toast } from "sonner";
import databaseService from "@/services/databaseService";

interface StudentRegistrationResponse {
  success: boolean;
  message: string;
  studentId?: number;
}

const StudentSignup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    collegeId: "",
    course: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const courses = [
    "Computer Science",
    "Information Technology",
    "Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Business Administration",
    "Economics",
    "English Literature",
    "Mathematics",
    "Physics"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    
    if (!formData.collegeId.trim()) {
      toast.error("College ID is required");
      return false;
    }
    
    if (!formData.course) {
      toast.error("Please select a course");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      console.log("Submitting registration data:", {
        collegeId: formData.collegeId,
        fullName: formData.fullName,
        email: formData.email,
        course: formData.course
      });

      const response = await databaseService.registerStudent({
        collegeId: formData.collegeId,
        fullName: formData.fullName,
        email: formData.email,
        course: formData.course,
        password: formData.password
      }) as StudentRegistrationResponse;

      console.log("Registration response:", response);

      if (response.success) {
        // Store pending student data for facial registration
        localStorage.setItem("pendingStudent", JSON.stringify({
          ...formData,
          studentId: response.studentId
        }));
        
        toast.success("Registration successful! Please complete facial registration.");
        navigate("/student/facial-registration");
      } else {
        toast.error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error instanceof Error ? error.message : "Network error. Please ensure the backend server is running on http://localhost:3001");
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
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Student Registration
              </CardTitle>
              <CardDescription className="text-gray-600">
                Create your account to access the library system
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="collegeId">College ID</Label>
                  <Input
                    id="collegeId"
                    type="text"
                    value={formData.collegeId}
                    onChange={(e) => handleInputChange("collegeId", e.target.value)}
                    placeholder="Enter your college ID"
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="course">Course</Label>
                  <Select 
                    value={formData.course} 
                    onValueChange={(value) => handleInputChange("course", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Create a password"
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Confirm your password"
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                
                <div className="text-center mt-4">
                  <span className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/student/login")}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Sign In
                    </button>
                  </span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentSignup;
