
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Settings, LogOut, BookOpen, Calendar, AlertTriangle, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  collegeId: string;
  fullName: string;
  email: string;
  course: string;
  totalBorrowed: number;
  totalReturned: number;
  penaltyAmount: number;
  registrationDate: string;
  isActive: boolean;
}

interface ProfileDropdownProps {
  student: Student;
  onLogout: () => void;
}

export const ProfileDropdown = ({ student, onLogout }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    setShowProfileDialog(true);
    setIsOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          className="flex items-center space-x-2 hover:bg-blue-50"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900">{student.fullName}</p>
            <p className="text-xs text-gray-500">{student.collegeId}</p>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-xl border z-50">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{student.fullName}</h3>
                  <p className="text-sm text-gray-600">{student.email}</p>
                  <p className="text-xs text-gray-500">ID: {student.collegeId}</p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-blue-50"
                onClick={handleProfileClick}
              >
                <User className="h-4 w-4 mr-3" />
                View Profile
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-blue-50"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to settings if you have a settings page
                }}
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </Button>
              
              <div className="border-t border-gray-100 my-2"></div>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Details Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Student Profile</span>
            </DialogTitle>
            <DialogDescription>
              View your account details and library statistics
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{student.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">College ID:</span>
                    <span className="font-medium">{student.collegeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{student.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium">{student.course}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registration Date:</span>
                    <span className="font-medium">
                      {new Date(student.registrationDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={student.isActive ? "default" : "destructive"}>
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Library Statistics */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Library Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-gray-900">{student.totalBorrowed || 0}</p>
                    <p className="text-xs text-gray-600">Total Borrowed</p>
                  </div>
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <Calendar className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-gray-900">{student.totalReturned || 0}</p>
                    <p className="text-xs text-gray-600">Total Returned</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Penalty Information */}
            {student.penaltyAmount > 0 && (
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h4 className="font-semibold text-red-900">Outstanding Penalties</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">₹{student.penaltyAmount}</p>
                      <p className="text-xs text-red-500">Please clear dues</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
