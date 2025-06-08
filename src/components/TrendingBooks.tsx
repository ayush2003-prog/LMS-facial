
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Heart, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";
import { databaseService } from "@/services/databaseService";
import { BorrowBookDialog } from "./BorrowBookDialog";

interface TrendingBook {
  id: string;
  title: string;
  author: string;
  category: string;
  cover_image: string;
  description: string;
  borrow_count: number;
}

export const TrendingBooks = () => {
  const [trendingBooks, setTrendingBooks] = useState<TrendingBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);

  useEffect(() => {
    loadTrendingBooks();
  }, []);

  const loadTrendingBooks = async () => {
    try {
      setLoading(true);
      console.log('📈 Loading trending books...');
      
      const response = await databaseService.getTrendingBooks() as any;
      if (response.success && response.books) {
        setTrendingBooks(response.books);
        console.log('✅ Trending books loaded:', response.books.length);
      }
    } catch (error) {
      console.error('❌ Failed to load trending books:', error);
      toast.error('Failed to load trending books');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowBook = (book: TrendingBook) => {
    const bookWithAvailableQuantity = {
      ...book,
      available_quantity: 1 // This would normally come from the API
    };
    setSelectedBook(bookWithAvailableQuantity);
    setShowBorrowDialog(true);
  };

  const handleToggleFavorite = async (bookId: string) => {
    try {
      const response = await databaseService.toggleFavoriteBook(bookId) as any;
      if (response.success) {
        toast.success(response.message);
      }
    } catch (error) {
      console.error('❌ Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Trending Books
          </CardTitle>
          <CardDescription>Most borrowed books by students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading trending books...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Trending Books
          </CardTitle>
          <CardDescription>Most borrowed books by students</CardDescription>
        </CardHeader>
        <CardContent>
          {trendingBooks.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No trending books available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trendingBooks.slice(0, 5).map((book, index) => (
                <div
                  key={book.id}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                  </div>
                  
                  {book.cover_image && (
                    <div className="w-12 h-16 flex-shrink-0">
                      <img
                        src={localStorage.getItem(`book_cover_${book.cover_image}`) || '/placeholder.svg'}
                        alt={book.title}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{book.title}</h4>
                    <p className="text-sm text-gray-600 truncate">by {book.author}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {book.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        <span>{book.borrow_count} borrowed</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleToggleFavorite(book.id)}
                      variant="outline"
                      size="sm"
                      className="w-9 h-9 p-0"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleBorrowBook(book)}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Borrow
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BorrowBookDialog
        book={selectedBook}
        isOpen={showBorrowDialog}
        onClose={() => {
          setShowBorrowDialog(false);
          setSelectedBook(null);
        }}
        onBookBorrowed={() => {
          loadTrendingBooks(); // Refresh trending books after borrowing
        }}
      />
    </>
  );
};
