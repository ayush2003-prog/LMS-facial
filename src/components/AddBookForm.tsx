
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, BookPlus } from "lucide-react";
import { toast } from "sonner";
import { databaseService } from "@/services/databaseService";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  totalQuantity: number;
  availableQuantity: number;
  coverImage: string;
  description: string;
}

interface AddBookFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAdded: () => void;
}

interface BookResponse {
  success: boolean;
  message?: string;
  bookId?: number;
}

export const AddBookForm = ({ isOpen, onClose, onBookAdded }: AddBookFormProps) => {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    isbn: "",
    quantity: "1",
    description: "",
    coverImage: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "Fiction",
    "Non-Fiction", 
    "Science",
    "Technology",
    "History",
    "Biography",
    "Mystery",
    "Romance",
    "Fantasy",
    "Horror",
    "Self-Help",
    "Business",
    "Education",
    "Health",
    "Travel"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        const imageName = `${Date.now()}_${file.name}`;
        
        // Store image data in localStorage with unique key
        localStorage.setItem(`book_cover_${imageName}`, imageData);
        
        // Store only the image name in form data
        setFormData(prev => ({ ...prev, coverImage: imageName }));
        console.log('📸 Image stored in localStorage with name:', imageName);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      category: "",
      isbn: "",
      quantity: "1",
      description: "",
      coverImage: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author || !formData.category || !formData.isbn) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseInt(formData.quantity) < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📚 Adding book to database:', formData.title);
      
      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        category: formData.category,
        isbn: formData.isbn.trim(),
        coverImage: formData.coverImage, // Only the image name, not the full data
        description: formData.description.trim(),
        totalQuantity: parseInt(formData.quantity)
      };

      const response = await databaseService.addBook(bookData) as BookResponse;

      if (response.success) {
        toast.success(`"${formData.title}" has been added to the library successfully!`);
        
        // Reset form and close dialog
        resetForm();
        onClose();
        
        // Trigger parent component to refresh data
        onBookAdded();
        
        console.log('✅ Book added successfully with ID:', response.bookId);
      } else {
        throw new Error(response.message || 'Failed to add book');
      }
    } catch (error) {
      console.error('❌ Failed to add book:', error);
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          toast.error("A book with this ISBN already exists");
        } else if (error.message.includes('Backend server')) {
          toast.error("Cannot connect to server. Please ensure the backend is running.");
        } else {
          toast.error(error.message || "Failed to add book. Please try again.");
        }
      } else {
        toast.error("Failed to add book. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BookPlus className="h-5 w-5" />
            <span>Add New Book</span>
          </DialogTitle>
          <DialogDescription>
            Enter book details to add to the library inventory
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter book title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                placeholder="Enter author name"
                value={formData.author}
                onChange={(e) => handleInputChange("author", e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange("category", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN *</Label>
            <Input
              id="isbn"
              placeholder="Enter ISBN number"
              value={formData.isbn}
              onChange={(e) => handleInputChange("isbn", e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter book description (optional)"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Book Cover Image</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                  disabled={isSubmitting}
                />
              </div>
              <Button type="button" variant="outline" size="sm" disabled={isSubmitting}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            {formData.coverImage && (
              <div className="mt-2">
                <img
                  src={localStorage.getItem(`book_cover_${formData.coverImage}`) || '/placeholder.svg'}
                  alt="Book cover preview"
                  className="w-24 h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isSubmitting ? "Adding..." : "Add Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
