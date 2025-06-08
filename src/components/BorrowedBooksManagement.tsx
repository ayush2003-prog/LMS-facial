
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Calendar, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { databaseService } from "@/services/databaseService";

interface BorrowedBook {
  borrow_id: string;
  book_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  title: string;
  author: string;
  isbn: string;
  borrow_date: string;
  due_date: string;
  penalty_amount: number;
  is_overdue: boolean;
  days_overdue: number;
}

interface BorrowedBooksManagementProps {
  onBookReturned: () => void;
}

export const BorrowedBooksManagement = ({ onBookReturned }: BorrowedBooksManagementProps) => {
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<BorrowedBook | null>(null);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    loadBorrowedBooks();
  }, []);

  const loadBorrowedBooks = async () => {
    try {
      setLoading(true);
      const response = await databaseService.getAllBorrowedBooks() as any;
      if (response?.success && response?.borrowedBooks) {
        setBorrowedBooks(response.borrowedBooks);
      }
    } catch (error) {
      console.error('❌ Failed to load borrowed books:', error);
      toast.error('Failed to load borrowed books');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async () => {
    if (!selectedReturn) return;

    setIsReturning(true);
    try {
      const response = await databaseService.returnBook(selectedReturn.borrow_id) as any;
      if (response?.success) {
        toast.success(`Book returned successfully`);
        setSelectedReturn(null);
        onBookReturned();
        await loadBorrowedBooks();
      } else {
        throw new Error(response?.message || 'Failed to return book');
      }
    } catch (error) {
      console.error('❌ Failed to return book:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to return book');
    } finally {
      setIsReturning(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading borrowed books...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Borrowed Books Management
          </CardTitle>
          <CardDescription>Manage book returns and track borrowing activity</CardDescription>
        </CardHeader>
        <CardContent>
          {borrowedBooks.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No books currently borrowed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Details</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Borrow Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Penalty</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowedBooks.map((book) => (
                    <TableRow key={book.borrow_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{book.title}</p>
                          <p className="text-sm text-gray-600">by {book.author}</p>
                          <p className="text-xs text-gray-500">ISBN: {book.isbn}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{book.student_name}</p>
                          <p className="text-sm text-gray-600">{book.student_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                          {new Date(book.borrow_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                          {new Date(book.due_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {book.is_overdue ? (
                          <Badge variant="destructive" className="flex items-center w-fit">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overdue ({book.days_overdue} days)
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${book.penalty_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{book.penalty_amount || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => setSelectedReturn(book)}
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          Return Book
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Confirmation Dialog */}
      <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Book Return</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this book as returned?
            </DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold">{selectedReturn.title}</h3>
                <p className="text-sm text-gray-600">by {selectedReturn.author}</p>
                <p className="text-sm text-gray-600">Student: {selectedReturn.student_name}</p>
                <p className="text-sm text-gray-600">Due: {new Date(selectedReturn.due_date).toLocaleDateString()}</p>
                {selectedReturn.is_overdue && (
                  <p className="text-sm text-red-600 font-medium">
                    Overdue by {selectedReturn.days_overdue} days
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReturn(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReturnBook}
              disabled={isReturning}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isReturning ? "Processing..." : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
