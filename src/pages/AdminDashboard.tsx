
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, AlertTriangle, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { AddBookForm } from "@/components/AddBookForm";
import { StudentManagement } from "@/components/StudentManagement";
import { BookManagement } from "@/components/BookManagement";
import { BorrowedBooksManagement } from "@/components/BorrowedBooksManagement";
import { PenaltyManagement } from "@/components/PenaltyManagement";
import { LibraryReport } from "@/components/LibraryReport";
import { databaseService } from "@/services/databaseService";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  total_quantity: number;
  available_quantity: number;
  cover_image: string;
  description: string;
  date_added: string;
}

interface DashboardStats {
  totalBooks: number;
  totalStudents: number;
  totalBorrowed: number;
  totalOverdue: number;
}

interface APIResponse {
  success: boolean;
  books?: Book[];
  stats?: DashboardStats;
  message?: string;
}

const AdminDashboard = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalStudents: 0,
    totalBorrowed: 0,
    totalOverdue: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'borrowed' | 'students' | 'penalties' | 'reports'>('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("currentUser");
    
    if (!token || !userData) {
      toast.error("Please log in to access the admin dashboard");
      navigate("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.userType !== 'admin') {
        toast.error("Admin access required");
        navigate("/");
        return;
      }
      setCurrentUser(user);
      loadDashboardData();
    } catch (error) {
      console.error("❌ Failed to parse user data:", error);
      navigate("/admin/login");
    }
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading admin dashboard data...');
      
      // Load dashboard statistics
      const statsResponse = await databaseService.getDashboardStats() as APIResponse;
      if (statsResponse.success && statsResponse.stats) {
        setStats(statsResponse.stats);
        console.log('✅ Dashboard stats loaded:', statsResponse.stats);
      }

      // Load all books
      const booksResponse = await databaseService.getAllBooks() as APIResponse;
      if (booksResponse.success && booksResponse.books) {
        setBooks(booksResponse.books);
        console.log('✅ Books loaded:', booksResponse.books.length);
      }
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh dashboard:', error);
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  const handleBookAdded = async () => {
    console.log('📚 Book added, refreshing dashboard data...');
    await loadDashboardData();
  };

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting book:', bookId);
      const response = await databaseService.deleteBook(bookId) as APIResponse;
      
      if (response.success) {
        toast.success(`"${bookTitle}" has been deleted successfully`);
        await loadDashboardData(); // Refresh the books list
      } else {
        throw new Error(response.message || 'Failed to delete book');
      }
    } catch (error) {
      console.error('❌ Failed to delete book:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete book');
    }
  };

  // Calculate available books properly
  const calculateAvailableBooks = () => {
    return books.reduce((total, book) => total + book.available_quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <Navigation />
        <div className="pt-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <RefreshCw className="h-16 w-16 text-purple-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 text-lg">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      <div className="pt-20 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Manage library operations and resources</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="bg-white/50 hover:bg-white/70"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowAddBook(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/60 backdrop-blur-lg rounded-lg p-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-4 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-white shadow-md text-purple-600 font-medium'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('books')}
              className={`flex-1 py-2 px-4 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'books'
                  ? 'bg-white shadow-md text-purple-600 font-medium'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Books ({books.length})
            </button>
            <button
              onClick={() => setActiveTab('borrowed')}
              className={`flex-1 py-2 px-4 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'borrowed'
                  ? 'bg-white shadow-md text-purple-600 font-medium'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Borrowed Books
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 py-2 px-4 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'students'
                  ? 'bg-white shadow-md text-purple-600 font-medium'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Students ({stats.totalStudents})
            </button>
            <button
              onClick={() => setActiveTab('penalties')}
              className={`flex-1 py-2 px-4 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'penalties'
                  ? 'bg-white shadow-md text-purple-600 font-medium'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Penalties
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-2 px-4 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-white shadow-md text-purple-600 font-medium'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Reports
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Books</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.totalBooks}</p>
                      </div>
                      <BookOpen className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Students</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Books Issued</p>
                        <p className="text-2xl font-bold text-green-600">{stats.totalBorrowed}</p>
                      </div>
                      <BookOpen className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Overdue Books</p>
                        <p className="text-2xl font-bold text-red-600">{stats.totalOverdue}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Library Overview */}
              <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Library Overview
                  </CardTitle>
                  <CardDescription>Quick summary of library operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Book Statistics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Books in Library:</span>
                          <span className="font-medium">{stats.totalBooks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Currently Borrowed:</span>
                          <span className="font-medium">{stats.totalBorrowed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Available Books:</span>
                          <span className="font-medium">{calculateAvailableBooks()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Student Activity</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Active Students:</span>
                          <span className="font-medium">{stats.totalStudents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Overdue Returns:</span>
                          <span className={`font-medium ${stats.totalOverdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {stats.totalOverdue}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'books' && (
            <BookManagement 
              books={books} 
              onBookUpdated={handleBookAdded} 
              onBookDeleted={handleDeleteBook}
            />
          )}

          {activeTab === 'borrowed' && (
            <BorrowedBooksManagement onBookReturned={handleBookAdded} />
          )}

          {activeTab === 'students' && <StudentManagement />}

          {activeTab === 'penalties' && <PenaltyManagement />}

          {activeTab === 'reports' && <LibraryReport />}
        </div>
      </div>

      {/* Add Book Dialog */}
      <AddBookForm
        isOpen={showAddBook}
        onClose={() => setShowAddBook(false)}
        onBookAdded={handleBookAdded}
      />
    </div>
  );
};

export default AdminDashboard;
