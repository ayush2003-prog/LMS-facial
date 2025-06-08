
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";
import { databaseService } from "@/services/databaseService";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  cover_image: string;
  description: string;
  available_quantity: number;
}

interface BorrowBookDialogProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onBookBorrowed: () => void;
}

export const BorrowBookDialog = ({ book, isOpen, onClose, onBookBorrowed }: BorrowBookDialogProps) => {
  const [borrowDays, setBorrowDays] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const borrowDurations = [
    { value: "5", label: "5 days" },
    { value: "10", label: "10 days" },
    { value: "15", label: "15 days" },
    { value: "20", label: "20 days" }
  ];

  const handleBorrowBook = async () => {
    if (!book || !borrowDays) {
      toast.error("Please select a borrowing duration");
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(borrowDays));
      const dueDateString = dueDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

      console.log('📖 Borrowing book:', { bookId: book.id, dueDate: dueDateString });
      
      const response = await databaseService.borrowBook(book.id, dueDateString) as any;
      
      if (response?.success) {
        toast.success(`"${book.title}" borrowed successfully for ${borrowDays} days!`);
        setBorrowDays("");
        onClose();
        onBookBorrowed();
      } else {
        throw new Error(response?.message || 'Failed to borrow book');
      }
    } catch (error) {
      console.error('❌ Failed to borrow book:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to borrow book');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDueDate = (days: string) => {
    if (!days) return "";
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + parseInt(days));
    return dueDate.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Borrow Book
          </DialogTitle>
          <DialogDescription>
            Select the duration for borrowing "{book?.title}"
          </DialogDescription>
        </DialogHeader>

        {book && (
          <div className="space-y-6">
            {/* Book Info */}
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              {book.cover_image && (
                <img
                  src={localStorage.getItem(`book_cover_${book.cover_image}`) || '/placeholder.svg'}
                  alt={book.title}
                  className="w-16 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{book.title}</h3>
                <p className="text-sm text-gray-600">by {book.author}</p>
                <div className="mt-1">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {book.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Available: {book.available_quantity} copies
                </p>
              </div>
            </div>

            {/* Duration Selection */}
            <div className="space-y-3">
              <Label htmlFor="duration">Select Borrowing Duration</Label>
              <Select value={borrowDays} onValueChange={setBorrowDays}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose duration..." />
                </SelectTrigger>
                <SelectContent>
                  {borrowDurations.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {borrowDays && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  <Calendar className="h-4 w-4" />
                  <span>Due date: {calculateDueDate(borrowDays)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleBorrowBook} 
            disabled={!borrowDays || isSubmitting}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isSubmitting ? "Borrowing..." : "Borrow Book"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
