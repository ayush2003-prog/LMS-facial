
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Search, User, Edit, Eye, AlertTriangle, BookOpen, Mail, Phone, Calendar, Download, UserCheck, UserX } from "lucide-react";
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

interface BorrowedBook {
  id: string;
  collegeId: string;
  title: string;
  author: string;
  borrowDate: string;
  dueDate: string;
  isOverdue: boolean;
}

export const EnhancedStudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
    loadBorrowedBooks();
  }, []);

  const loadStudents = () => {
    const studentsData = JSON.parse(localStorage.getItem("students") || "[]");
    const enhancedStudents = studentsData.map((student: any) => ({
      ...student,
      id: student.collegeId,
      totalBorrowed: student.totalBorrowed || 0,
      totalReturned: student.totalReturned || 0,
      penaltyAmount: student.penaltyAmount || 0,
      registrationDate: student.registrationDate || new Date().toISOString(),
      isActive: student.isActive !== undefined ? student.isActive : true
    }));
    setStudents(enhancedStudents);
  };

  const loadBorrowedBooks = () => {
    const borrowedData = JSON.parse(localStorage.getItem("borrowedBooks") || "[]");
    setBorrowedBooks(borrowedData);
  };

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!studentToDelete) return;

    // Remove student from students list
    const updatedStudents = students.filter(s => s.collegeId !== studentToDelete.collegeId);
    setStudents(updatedStudents);
    localStorage.setItem("students", JSON.stringify(updatedStudents));

    // Remove student's borrowed books
    const updatedBorrowedBooks = borrowedBooks.filter(book => book.collegeId !== studentToDelete.collegeId);
    setBorrowedBooks(updatedBorrowedBooks);
    localStorage.setItem("borrowedBooks", JSON.stringify(updatedBorrowedBooks));

    // Remove student's favorites
    localStorage.removeItem(`favorites_${studentToDelete.collegeId}`);

    toast.success(`Student ${studentToDelete.fullName} has been removed successfully`);
    setIsDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  const toggleStudentStatus = (student: Student) => {
    const updatedStudents = students.map(s => 
      s.collegeId === student.collegeId 
        ? { ...s, isActive: !s.isActive }
        : s
    );
    setStudents(updatedStudents);
    localStorage.setItem("students", JSON.stringify(updatedStudents));
    toast.success(`Student ${student.fullName} has been ${student.isActive ? 'deactivated' : 'activated'}`);
  };

  const exportStudentData = () => {
    const dataToExport = students.map(student => ({
      "College ID": student.collegeId,
      "Full Name": student.fullName,
      "Email": student.email,
      "Course": student.course,
      "Total Borrowed": student.totalBorrowed,
      "Total Returned": student.totalReturned,
      "Penalty Amount": student.penaltyAmount,
      "Registration Date": new Date(student.registrationDate).toLocaleDateString(),
      "Status": student.isActive ? "Active" : "Inactive",
      "Currently Borrowed": borrowedBooks.filter(book => book.collegeId === student.collegeId).length
    }));

    const csvContent = [
      Object.keys(dataToExport[0]).join(","),
      ...dataToExport.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Student data exported successfully");
  };

  const viewStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.collegeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse === "All" || student.course === selectedCourse;
    
    return matchesSearch && matchesCourse;
  });

  const courses = [...new Set(students.map(s => s.course))];
  const totalPenalties = students.reduce((sum, student) => sum + student.penaltyAmount, 0);
  const activeStudents = students.filter(s => s.isActive).length;
  const studentsWithOverdueBooks = students.filter(student => 
    borrowedBooks.some(book => book.collegeId === student.collegeId && book.isOverdue)
  ).length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-800">{students.length}</p>
                <p className="text-sm text-blue-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-800">{activeStudents}</p>
                <p className="text-sm text-green-600">Active Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-800">{studentsWithOverdueBooks}</p>
                <p className="text-sm text-red-600">With Overdue Books</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-800">₹{totalPenalties}</p>
                <p className="text-sm text-purple-600">Total Penalties</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Management Card */}
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Student Management
              </CardTitle>
              <CardDescription>Manage all registered students</CardDescription>
            </div>
            <Button
              onClick={exportStudentData}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, college ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-2 border-blue-100 focus:border-blue-300 rounded-xl"
              />
            </div>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-48 border-2 border-blue-100 focus:border-blue-300 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Students List */}
          <div className="space-y-4">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No students found</p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const studentBorrowedBooks = borrowedBooks.filter(book => book.collegeId === student.collegeId);
                const hasOverdueBooks = studentBorrowedBooks.some(book => book.isOverdue);
                
                return (
                  <Card key={student.collegeId} className={`transition-all duration-200 ${hasOverdueBooks ? 'border-l-4 border-l-red-500 bg-red-50' : 'border-l-4 border-l-blue-500 bg-blue-50'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                                <span>{student.fullName}</span>
                                <Badge variant={student.isActive ? "default" : "secondary"}>
                                  {student.isActive ? "Active" : "Inactive"}
                                </Badge>
                                {hasOverdueBooks && (
                                  <Badge variant="destructive">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Overdue
                                  </Badge>
                                )}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>{student.collegeId}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{student.email}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <BookOpen className="h-3 w-3" />
                                  <span>{student.course}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div className="bg-white/50 p-2 rounded">
                              <span className="text-gray-600">Borrowed:</span>
                              <span className="ml-1 font-medium">{student.totalBorrowed}</span>
                            </div>
                            <div className="bg-white/50 p-2 rounded">
                              <span className="text-gray-600">Returned:</span>
                              <span className="ml-1 font-medium">{student.totalReturned}</span>
                            </div>
                            <div className="bg-white/50 p-2 rounded">
                              <span className="text-gray-600">Current:</span>
                              <span className="ml-1 font-medium">{studentBorrowedBooks.length}</span>
                            </div>
                            <div className="bg-white/50 p-2 rounded">
                              <span className="text-gray-600">Penalty:</span>
                              <span className={`ml-1 font-medium ${student.penaltyAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{student.penaltyAmount}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewStudentDetails(student)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStudentStatus(student)}
                            className={student.isActive ? "text-orange-600 border-orange-200 hover:bg-orange-50" : "text-green-600 border-green-200 hover:bg-green-50"}
                          >
                            {student.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteStudent(student)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>Complete information about the student</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Personal Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedStudent.fullName}</p>
                    <p><span className="font-medium">College ID:</span> {selectedStudent.collegeId}</p>
                    <p><span className="font-medium">Email:</span> {selectedStudent.email}</p>
                    <p><span className="font-medium">Course:</span> {selectedStudent.course}</p>
                    <p><span className="font-medium">Status:</span> 
                      <Badge variant={selectedStudent.isActive ? "default" : "secondary"} className="ml-2">
                        {selectedStudent.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Library Statistics</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Total Borrowed:</span> {selectedStudent.totalBorrowed}</p>
                    <p><span className="font-medium">Total Returned:</span> {selectedStudent.totalReturned}</p>
                    <p><span className="font-medium">Currently Borrowed:</span> {borrowedBooks.filter(book => book.collegeId === selectedStudent.collegeId).length}</p>
                    <p><span className="font-medium">Penalty Amount:</span> 
                      <span className={selectedStudent.penaltyAmount > 0 ? 'text-red-600 ml-1' : 'text-green-600 ml-1'}>
                        ₹{selectedStudent.penaltyAmount}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Currently Borrowed Books</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {borrowedBooks.filter(book => book.collegeId === selectedStudent.collegeId).map((book) => (
                    <div key={book.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{book.title}</p>
                        <p className="text-xs text-gray-600">by {book.author}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={book.isOverdue ? "destructive" : "default"} className="text-xs">
                          Due: {new Date(book.dueDate).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {borrowedBooks.filter(book => book.collegeId === selectedStudent.collegeId).length === 0 && (
                    <p className="text-gray-500 text-sm">No books currently borrowed</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {studentToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-red-800">{studentToDelete.fullName}</p>
                <p className="text-sm text-red-600">College ID: {studentToDelete.collegeId}</p>
                <p className="text-sm text-red-600">Email: {studentToDelete.email}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Student
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
