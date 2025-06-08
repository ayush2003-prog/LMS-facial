
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
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

interface BookManagementProps {
  books: Book[];
  onBookUpdated: () => void;
  onBookDeleted: (bookId: string, bookTitle: string) => void;
}

export const BookManagement = ({ books, onBookUpdated, onBookDeleted }: BookManagementProps) => {
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "Fiction", "Non-Fiction", "Science", "Technology", "History",
    "Biography", "Mystery", "Romance", "Fantasy", "Horror",
    "Self-Help", "Business", "Education", "Health", "Travel"
  ];

  const handleEditBook = async (bookData: any) => {
    if (!editingBook) return;

    setIsSubmitting(true);
    try {
      const response = await databaseService.updateBook(editingBook.id, bookData) as any;
      if (response?.success) {
        toast.success(`"${bookData.title}" updated successfully!`);
        setEditingBook(null);
        onBookUpdated();
      } else {
        throw new Error(response?.message || 'Failed to update book');
      }
    } catch (error) {
      console.error('❌ Failed to update book:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="bg-gradient-to-br from-white to-purple-50 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="space-y-3">
                {book.cover_image && (
                  <div className="w-full h-48 mb-3">
                    <img
                      src={localStorage.getItem(`book_cover_${book.cover_image}`) || '/placeholder.svg'}
                      alt={book.title}
                      className="w-full h-full object-cover rounded cursor-pointer"
                      onClick={() => setViewingBook(book)}
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
                
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ISBN:</span>
                    <span className="font-medium">{book.isbn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{book.total_quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available:</span>
                    <span className={`font-medium ${book.available_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {book.available_quantity}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => setViewingBook(book)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => setEditingBook(book)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => onBookDeleted(book.id, book.title)}
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Book Dialog */}
      {editingBook && (
        <Dialog open={!!editingBook} onOpenChange={() => setEditingBook(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Book</DialogTitle>
              <DialogDescription>Update book details and quantities</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleEditBook({
                title: formData.get('title'),
                author: formData.get('author'),
                category: formData.get('category'),
                isbn: formData.get('isbn'),
                description: formData.get('description'),
                totalQuantity: parseInt(formData.get('totalQuantity') as string),
                coverImage: editingBook.cover_image
              });
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingBook.title}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      name="author"
                      defaultValue={editingBook.author}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue={editingBook.category} disabled={isSubmitting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalQuantity">Total Quantity</Label>
                    <Input
                      id="totalQuantity"
                      name="totalQuantity"
                      type="number"
                      min="1"
                      defaultValue={editingBook.total_quantity}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    name="isbn"
                    defaultValue={editingBook.isbn}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingBook.description}
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setEditingBook(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Book"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* View Book Dialog */}
      {viewingBook && (
        <Dialog open={!!viewingBook} onOpenChange={() => setViewingBook(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewingBook.title}</DialogTitle>
              <DialogDescription>by {viewingBook.author}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {viewingBook.cover_image && (
                <div className="w-full h-64">
                  <img
                    src={localStorage.getItem(`book_cover_${viewingBook.cover_image}`) || '/placeholder.svg'}
                    alt={viewingBook.title}
                    className="w-full h-full object-contain rounded"
                  />
                </div>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{viewingBook.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ISBN:</span>
                  <span className="font-medium">{viewingBook.isbn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Quantity:</span>
                  <span className="font-medium">{viewingBook.total_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium">{viewingBook.available_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date Added:</span>
                  <span className="font-medium">{new Date(viewingBook.date_added).toLocaleDateString()}</span>
                </div>
              </div>
              
              {viewingBook.description && (
                <div>
                  <Label>Description:</Label>
                  <p className="text-sm text-gray-600 mt-1">{viewingBook.description}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setViewingBook(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
