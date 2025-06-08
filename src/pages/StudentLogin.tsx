
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";
import { toast } from "sonner";
import databaseService from "@/services/databaseService";
import * as faceapi from "face-api.js";

interface StudentLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  student?: {
    id: number;
    collegeId: string;
    fullName: string;
    email: string;
    course: string;
    totalBorrowed: number;
    totalReturned: number;
    penaltyAmount: number;
    registrationDate: string;
    isActive: boolean;
  };
}

const StudentLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFacialAuth, setShowFacialAuth] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await databaseService.loginStudent(email, password) as StudentLoginResponse;
      
      if (response.success) {
        localStorage.setItem("authToken", response.token!);
        localStorage.setItem("currentUser", JSON.stringify({
          ...response.student,
          userType: "student",
          loginTime: new Date().toISOString()
        }));
        
        toast.success("Login successful!");
        navigate("/student/dashboard");
      } else {
        toast.error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Network error. Please ensure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models")
      ]);
      setModelsLoaded(true);
      console.log("Face recognition models loaded");
    } catch (error) {
      console.error("Error loading models:", error);
      toast.error("Failed to load facial recognition models");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadedmetadata', () => {
          setIsCameraReady(true);
        });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Unable to access camera");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraReady(false);
    }
  };

  const handleFacialAuth = async () => {
    if (!modelsLoaded) {
      await loadModels();
    }
    setShowFacialAuth(true);
    await startCamera();
  };

  const authenticateWithFace = async () => {
    if (!videoRef.current || !isCameraReady) return;

    try {
      setIsLoading(true);
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        toast.error("No face detected. Please position your face clearly.");
        setIsLoading(false);
        return;
      }

      const facialData = JSON.parse(localStorage.getItem("facialData") || "[]");
      const currentDescriptor = detections.descriptor;

      let matchedStudent = null;
      let minDistance = Infinity;

      for (const student of facialData) {
        for (const storedDescriptor of student.descriptors) {
          const distance = faceapi.euclideanDistance(currentDescriptor, new Float32Array(storedDescriptor));
          if (distance < 0.6 && distance < minDistance) {
            minDistance = distance;
            matchedStudent = student;
          }
        }
      }

      if (matchedStudent) {
        // Get stored password for the matched student
        const storedUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
        const userAccount = storedUsers.find((user: any) => user.email === matchedStudent.email);
        
        if (userAccount) {
          // Directly login with stored credentials
          const response = await databaseService.loginStudent(matchedStudent.email, userAccount.password) as StudentLoginResponse;
          
          if (response.success) {
            localStorage.setItem("authToken", response.token!);
            localStorage.setItem("currentUser", JSON.stringify({
              ...response.student,
              userType: "student",
              loginTime: new Date().toISOString()
            }));
            
            toast.success("Facial authentication successful!");
            navigate("/student/dashboard");
          } else {
            toast.error("Authentication failed. Please try manual login.");
            setEmail(matchedStudent.email);
            stopCamera();
            setShowFacialAuth(false);
          }
        } else {
          toast.error("Account not found. Please register first.");
        }
      } else {
        toast.error("Face not recognized. Please try again or use email/password login.");
      }
    } catch (error) {
      console.error("Facial authentication error:", error);
      toast.error("Facial authentication failed");
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
                Student Login
              </CardTitle>
              <CardDescription className="text-gray-600">
                Access your library account with your credentials
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {!showFacialAuth ? (
                <>
                  <div className="mb-4 text-center">
                    <Button
                      onClick={handleFacialAuth}
                      className="w-full bg-green-600 hover:bg-green-700 text-white mb-4"
                      disabled={isLoading}
                    >
                      Login with Face Recognition
                    </Button>
                    <div className="text-sm text-gray-500 mb-4">or</div>
                  </div>

                  <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
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
                        placeholder="Enter your password"
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
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-4">Facial Authentication</h3>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full h-64 object-cover rounded-lg bg-gray-900 mb-4"
                    />
                    {!isCameraReady && (
                      <p className="text-gray-600 mb-4">Starting camera...</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={authenticateWithFace}
                      disabled={!isCameraReady || isLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading ? "Authenticating..." : "Authenticate"}
                    </Button>
                    <Button
                      onClick={() => {
                        stopCamera();
                        setShowFacialAuth(false);
                      }}
                      variant="outline"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="text-center mt-4">
                <span className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/student/signup")}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    disabled={isLoading}
                  >
                    Sign Up
                  </button>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
