
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { toast } from "sonner";
import * as faceapi from "face-api.js";

const FacialRegistration = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedSamples, setCapturedSamples] = useState<Float32Array[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    try {
      console.log("Loading face-api.js models...");
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models")
      ]);
      
      console.log("Models loaded successfully");
      setIsLoading(false);
      startCamera();
    } catch (error) {
      console.error("Error loading models:", error);
      toast.error("Failed to load facial recognition models. Please refresh the page.");
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
          console.log("Camera ready");
        });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Unable to access camera. Please ensure camera permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const captureFacialData = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    
    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        toast.error("No face detected. Please position your face clearly in the camera.");
        setIsCapturing(false);
        return;
      }

      const descriptor = detections.descriptor;
      setCapturedSamples(prev => [...prev, descriptor]);
      
      const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      canvasRef.current.width = displaySize.width;
      canvasRef.current.height = displaySize.height;
      
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, displaySize.width, displaySize.height);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
      }

      toast.success(`Sample ${capturedSamples.length + 1} captured successfully!`);
      
      if (capturedSamples.length + 1 >= 3) {
        setTimeout(() => saveFacialData([...capturedSamples, descriptor]), 1000);
      }
    } catch (error) {
      console.error("Error capturing facial data:", error);
      toast.error("Failed to capture facial data. Please try again.");
    }
    
    setIsCapturing(false);
  };

  const saveFacialData = async (samples: Float32Array[]) => {
    try {
      const pendingStudent = localStorage.getItem("pendingStudent");
      if (!pendingStudent) {
        toast.error("No pending registration found. Please sign up again.");
        navigate("/student/signup");
        return;
      }

      const studentData = JSON.parse(pendingStudent);
      
      // Save facial data
      const facialData = {
        email: studentData.email,
        collegeId: studentData.collegeId,
        descriptors: samples.map(sample => Array.from(sample)),
        registrationDate: new Date().toISOString()
      };

      const existingFacialData = JSON.parse(localStorage.getItem("facialData") || "[]");
      existingFacialData.push(facialData);
      localStorage.setItem("facialData", JSON.stringify(existingFacialData));

      // Store user credentials for automatic login
      const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      registeredUsers.push({
        email: studentData.email,
        password: studentData.password,
        collegeId: studentData.collegeId
      });
      localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));

      localStorage.removeItem("pendingStudent");

      toast.success("Facial registration completed successfully!");
      navigate("/student/login");
    } catch (error) {
      console.error("Error saving facial data:", error);
      toast.error("Failed to save facial data. Please try again.");
    }
  };

  const retakeCapture = () => {
    setCapturedSamples([]);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96 text-center">
          <CardContent className="pt-6">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading facial recognition system...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Facial Registration
              </CardTitle>
              <CardDescription className="text-gray-600">
                Complete your registration by capturing facial recognition data.
                We need 3 clear samples for accurate authentication.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-80 object-cover rounded-lg bg-gray-900"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-80 rounded-lg"
                />
                {!isCameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                    <p className="text-white">Starting camera...</p>
                  </div>
                )}
              </div>

              <div className="text-center space-y-4">
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3].map((sample) => (
                    <div
                      key={sample}
                      className={`w-4 h-4 rounded-full ${
                        capturedSamples.length >= sample
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
                
                <p className="text-sm text-gray-600">
                  Samples captured: {capturedSamples.length} / 3
                </p>

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={captureFacialData}
                    disabled={!isCameraReady || isCapturing || capturedSamples.length >= 3}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isCapturing ? "Capturing..." : "Capture Sample"}
                  </Button>
                  
                  {capturedSamples.length > 0 && capturedSamples.length < 3 && (
                    <Button
                      onClick={retakeCapture}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      Retake All
                    </Button>
                  )}
                </div>

                {capturedSamples.length >= 3 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      ✓ All samples captured successfully!
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Your facial data is being processed and saved...
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Tips for better registration:</strong>
                </p>
                <ul className="text-blue-700 text-sm mt-2 space-y-1">
                  <li>• Ensure good lighting on your face</li>
                  <li>• Look directly at the camera</li>
                  <li>• Keep your face centered in the frame</li>
                  <li>• Avoid wearing glasses or hats if possible</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FacialRegistration;
