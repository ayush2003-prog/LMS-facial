import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { databaseService } from "@/services/databaseService";

interface Student {
  id: number;
  college_id: string;
  full_name: string;
  email: string;
  course: string;
  total_borrowed: number;
  total_returned: number;
  penalty_amount: number;
  registration_date: string;
  is_active: boolean;
  currently_borrowed: number;
  overdue_books: number;
}

interface StudentResponse {
  success: boolean;
  message?: string;
  students?: Student[];
}

interface StudentStatusResponse {
  success: boolean;
  message?: string;
}

export const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log('📚 Loading students from database...');
      const response = await databaseService.getAllStudents() as StudentResponse;
      if (response.success) {
        setStudents(response.students || []);
        console.log('✅ Students loaded successfully:', response.students?.length);
      } else {
        throw new Error(response.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('❌ Failed to load students:', error);
      toast.error('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadStudents();
      toast.success('Student list refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh students:', error);
      toast.error('Failed to refresh student list');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStudentStatus = async (student: Student) => {
    try {
      console.log('👨‍🎓 Toggling student status:', student.id);
      const response = await databaseService.toggleStudentStatus(student.id.toString()) as StudentStatusResponse;
      
      if (response.success) {
        // Update local state
        setStudents(prev => prev.map(s => 
          s.id === student.id 
            ? { ...s, is_active: !s.is_active }
            : s
        ));
        
        const newStatus = !student.is_active ? 'activated' : 'deactivated';
        toast.success(`Student ${student.full_name} has been ${newStatus} successfully`);
      } else {
        throw new Error(response.message || 'Failed to update student status');
      }
    } catch (error) {
      console.error('❌ Failed to toggle student status:', error);
      toast.error('Failed to update student status. Please try again.');
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Student Management
          </CardTitle>
          <CardDescription>Loading student data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <RefreshCw className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 text-lg">Loading students...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Student Management
            </CardTitle>
            <CardDescription>Manage registered students and their library activities</CardDescription>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="bg-white/50 hover:bg-white/70"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No students registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Card key={student.id} className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <h3 className="font-bold text-gray-900">{student.full_name}</h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {student.course}
                          </Badge>
                          <Badge 
                            variant={student.is_active ? "default" : "destructive"}
                            className={student.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                          >
                            {student.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <User className="h-5 w-5 text-blue-500" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/50 p-2 rounded">
                        <span className="text-gray-600">College ID:</span>
                        <span className="font-medium block">{student.college_id}</span>
                      </div>
                      <div className="bg-white/50 p-2 rounded">
                        <span className="text-gray-600">Currently Borrowed:</span>
                        <span className="font-medium block">{student.currently_borrowed || 0}</span>
                      </div>
                      <div className="bg-white/50 p-2 rounded">
                        <span className="text-gray-600">Total Borrowed:</span>
                        <span className="font-medium block">{student.total_borrowed || 0}</span>
                      </div>
                      <div className="bg-white/50 p-2 rounded">
                        <span className="text-gray-600">Total Returned:</span>
                        <span className="font-medium block">{student.total_returned || 0}</span>
                      </div>
                      <div className="bg-white/50 p-2 rounded">
                        <span className="text-gray-600">Penalty:</span>
                        <span className={`font-medium block ${(student.penalty_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{student.penalty_amount || 0}
                        </span>
                      </div>
                      <div className="bg-white/50 p-2 rounded">
                        <span className="text-gray-600">Overdue Books:</span>
                        <span className={`font-medium block ${(student.overdue_books || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {student.overdue_books || 0}
                        </span>
                      </div>
                    </div>
                    
                    {((student.penalty_amount || 0) > 0 || (student.overdue_books || 0) > 0) && (
                      <Badge variant="destructive" className="w-full justify-center py-2">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {(student.penalty_amount || 0) > 0 && (student.overdue_books || 0) > 0 
                          ? 'Has Penalties & Overdue Books'
                          : (student.penalty_amount || 0) > 0 
                            ? 'Has Outstanding Penalties'
                            : 'Has Overdue Books'
                        }
                      </Badge>
                    )}
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleToggleStudentStatus(student)}
                        variant={student.is_active ? "destructive" : "default"}
                        className={`w-full ${
                          student.is_active 
                            ? 'bg-orange-600 hover:bg-orange-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white border-0 shadow-md hover:shadow-lg transition-all duration-200`}
                      >
                        {student.is_active ? 'Deactivate Student' : 'Activate Student'}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full border-gray-300 hover:bg-gray-50"
                            disabled={!student.is_active}
                          >
                            View Details
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white/95 backdrop-blur-lg border shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-blue-600 text-xl font-bold">Student Details</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-700">
                              Complete information for {student.full_name}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                              <h3 className="font-bold text-blue-800">{student.full_name}</h3>
                              <p className="text-sm text-blue-600">College ID: {student.college_id}</p>
                              <p className="text-sm text-blue-600">Email: {student.email}</p>
                              <p className="text-sm text-blue-600">Course: {student.course}</p>
                              <p className="text-sm text-blue-600">
                                Registered: {new Date(student.registration_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-blue-600">
                                Status: <span className={student.is_active ? 'text-green-600' : 'text-red-600'}>
                                  {student.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="text-gray-600 text-sm">Currently Borrowed:</span>
                                <span className="font-bold block text-lg">{student.currently_borrowed || 0}</span>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="text-gray-600 text-sm">Total Borrowed:</span>
                                <span className="font-bold block text-lg">{student.total_borrowed || 0}</span>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="text-gray-600 text-sm">Total Returned:</span>
                                <span className="font-bold block text-lg">{student.total_returned || 0}</span>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="text-gray-600 text-sm">Overdue Books:</span>
                                <span className={`font-bold block text-lg ${(student.overdue_books || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {student.overdue_books || 0}
                                </span>
                              </div>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-yellow-800">Total Penalties:</span>
                                <span className={`font-bold text-xl ${(student.penalty_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  ₹{student.penalty_amount || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-300 hover:bg-gray-50">
                              Close
                            </AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
