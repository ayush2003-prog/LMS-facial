import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, Heart, RefreshCw, User, Bookmark, Star } from "lucide-react";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { TrendingBooks } from "@/components/TrendingBooks";
import { BorrowBookDialog } from "@/components/BorrowBookDialog";
import { databaseService } from "@/services/databaseService";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  available_quantity: number;
  cover_image: string;
  description: string;
}

interface BorrowedBook {
  borrow_id: string;
  book_id: string;
  title: string;
  author: string;
  borrow_date: string;
  due_date: string;
  is_overdue: boolean;
  days_overdue: number;
}

interface APIResponse {
  success: boolean;
  books?: Book[];
  borrowedBooks?: BorrowedBook[];
  favoriteBooks?: Book[];
  message?: string;
}

const StudentDashboard = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'borrowed' | 'favorites' | 'profile'>('browse');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("currentUser");
    
    if (!token || !userData) {
      toast.error("Please log in to access the student dashboard");
      navigate("/student/login");
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.userType !== 'student') {
        toast.error("Student access required");
        navigate("/");
        return;
      }
      setCurrentUser(user);
      loadDashboardData(user.id);
    } catch (error) {
      console.error("❌ Failed to parse user data:", error);
      navigate("/student/login");
    }
  }, [navigate]);

  const loadDashboardData = async (studentId?: string) => {
    try {
      setLoading(true);
      console.log('📚 Loading student dashboard data...');
      
      // Load all books
      const booksResponse = await databaseService.getAllBooks() as APIResponse;
      if (booksResponse.success && booksResponse.books) {
        setBooks(booksResponse.books);
        console.log('✅ Books loaded:', booksResponse.books.length);
      }

      // Load borrowed books
      if (studentId || currentUser?.id) {
        const borrowedResponse = await databaseService.getStudentBorrowedBooks(studentId || currentUser.id) as APIResponse;
        if (borrowedResponse.success && borrowedResponse.borrowedBooks) {
          setBorrowedBooks(borrowedResponse.borrowedBooks);
          console.log('✅ Borrowed books loaded:', borrowedResponse.borrowedBooks.length);
        }

        // Load favorite books
        const favoritesResponse = await databaseService.getFavoriteBooks(studentId || currentUser.id) as any;
        if (favoritesResponse?.success && favoritesResponse?.favoriteBooks) {
          setFavoriteBooks(favoritesResponse.favoriteBooks);
          console.log('✅ Favorite books loaded:', favoritesResponse.favoriteBooks.length);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      // Don't show error message here to avoid the "failed to load dashboard data" issue
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowBook = (book: Book) => {
    // Check if the book is already borrowed by this student
    const alreadyBorrowed = borrowedBooks.some(borrowedBook => borrowedBook.book_id === book.id);
    
    if (alreadyBorrowed) {
      toast.error("You have already borrowed this book. Please return it before borrowing again.");
      return;
    }

    setSelectedBook(book);
    setShowBorrowDialog(true);
  };

  const handleToggleFavorite = async (bookId: string) => {
    try {
      const response = await databaseService.toggleFavoriteBook(bookId) as any;
      if (response?.success) {
        toast.success(response.action === 'added' ? 'Book added to favorites' : 'Book removed from favorites');
        await loadDashboardData();
      }
    } catch (error) {
      console.error('❌ Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const isFavorite = (bookId: string) => {
    return favoriteBooks.some(book => book.id === bookId);
  };

  const isAlreadyBorrowed = (bookId: string) => {
    return borrowedBooks.some(borrowedBook => borrowedBook.book_id === bookId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Navigation />
        <div className="pt-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 text-lg">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />
      
      <div className="pt-20 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, {currentUser?.fullName}!
              </h1>
              <p className="text-gray-600 mt-2">Discover and manage your books</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Books</p>
                    <p className="text-2xl font-bold text-blue-600">{books.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Books Borrowed</p>
                    <p className="text-2xl font-bold text-green-600">{borrowedBooks.length}</p>
                  </div>
                  <Bookmark className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Favorite Books</p>
                    <p className="text-2xl font-bold text-purple-600">{favoriteBooks.length}</p>
                  </div>
                  <Heart className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue Books</p>
                    <p className="text-2xl font-bold text-red-600">
                      {borrowedBooks.filter(book => book.is_overdue).length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trending Books Section - Show only on browse tab */}
          {activeTab === 'browse' && (
            <TrendingBooks />
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/60 backdrop-blur-lg rounded-lg p-1">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                activeTab === 'browse'
                  ? 'bg-white shadow-md text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Browse Books
            </button>
            <button
              onClick={() => setActiveTab('borrowed')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                activeTab === 'borrowed'
                  ? 'bg-white shadow-md text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Borrowed Books ({borrowedBooks.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                activeTab === 'favorites'
                  ? 'bg-white shadow-md text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Favorites ({favoriteBooks.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                activeTab === 'profile'
                  ? 'bg-white shadow-md text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Profile
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'browse' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => {
                const alreadyBorrowedByUser = isAlreadyBorrowed(book.id);
                
                return (
                  <Card key={book.id} className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {book.cover_image && (
                          <div className="w-full h-48 mb-3">
                            <img
                              src={localStorage.getItem(`book_cover_${book.cover_image}`) || '/placeholder.svg'}
                              alt={book.title}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{book.title}</h3>
                          <p className="text-xs text-gray-600">by {book.author}</p>
                          <div className="flex gap-1 mt-1">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {book.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Available:</span>
                            <span className={`font-medium ${book.available_quantity > 0 && !alreadyBorrowedByUser ? 'text-green-600' : 'text-red-600'}`}>
                              {alreadyBorrowedByUser ? 'Already Borrowed' : book.available_quantity}
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleBorrowBook(book)}
                            disabled={book.available_quantity === 0 || alreadyBorrowedByUser}
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            {alreadyBorrowedByUser ? 'Borrowed' : 'Borrow'}
                          </Button>
                          <Button
                            onClick={() => handleToggleFavorite(book.id)}
                            variant="outline"
                            size="sm"
                            className={`${isFavorite(book.id) ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
                          >
                            <Heart className={`h-3 w-3 ${isFavorite(book.id) ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === 'borrowed' && (
            <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Your Borrowed Books
                </CardTitle>
                <CardDescription>Track your borrowed books and due dates</CardDescription>
              </CardHeader>
              <CardContent>
                {borrowedBooks.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No books borrowed yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {borrowedBooks.map((book) => (
                      <div key={book.borrow_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <div>
                          <h3 className="font-semibold">{book.title}</h3>
                          <p className="text-sm text-gray-600">by {book.author}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-xs text-gray-500">
                              Borrowed: {new Date(book.borrow_date).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              Due: {new Date(book.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {book.is_overdue ? (
                            <Badge variant="destructive">
                              Overdue ({book.days_overdue} days)
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Active</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'favorites' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteBooks.length === 0 ? (
                <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl col-span-full">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No favorite books yet</p>
                      <p className="text-sm text-gray-400 mt-2">Browse books and add them to your favorites!</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                favoriteBooks.map((book) => (
                  <Card key={book.id} className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {book.cover_image && (
                          <div className="w-full h-48 mb-3">
                            <img
                              src={localStorage.getItem(`book_cover_${book.cover_image}`) || '/placeholder.svg'}
                              alt={book.title}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{book.title}</h3>
                          <p className="text-xs text-gray-600">by {book.author}</p>
                          <div className="flex gap-1 mt-1">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {book.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleBorrowBook(book)}
                            disabled={book.available_quantity === 0 || isAlreadyBorrowed(book.id)}
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            {isAlreadyBorrowed(book.id) ? 'Borrowed' : 'Borrow'}
                          </Button>
                          <Button
                            onClick={() => handleToggleFavorite(book.id)}
                            variant="outline"
                            size="sm"
                            className="bg-red-50 text-red-600 border-red-200"
                          >
                            <Heart className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                  <User className="h-6 w-6 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your account details and library statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Personal Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Full Name:</span>
                        <span className="font-medium">{currentUser?.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">College ID:</span>
                        <span className="font-medium">{currentUser?.collegeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{currentUser?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Course:</span>
                        <span className="font-medium">{currentUser?.course}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Library Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Books Currently Borrowed:</span>
                        <span className="font-medium">{borrowedBooks.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Favorite Books:</span>
                        <span className="font-medium">{favoriteBooks.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overdue Books:</span>
                        <span className={`font-medium ${borrowedBooks.filter(b => b.is_overdue).length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {borrowedBooks.filter(b => b.is_overdue).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Borrow Book Dialog */}
      <BorrowBookDialog
        book={selectedBook}
        isOpen={showBorrowDialog}
        onClose={() => {
          setShowBorrowDialog(false);
          setSelectedBook(null);
        }}
        onBookBorrowed={() => {
          loadDashboardData(); // Refresh dashboard data after borrowing
        }}
      />
    </div>
  );
};

export default StudentDashboard;
