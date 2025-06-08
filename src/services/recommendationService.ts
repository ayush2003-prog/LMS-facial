
export interface BookData {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  coverImage: string;
  description: string;
  totalQuantity: number;
  availableQuantity: number;
}

export interface BookRecommendation {
  book: BookData;
  reason: string;
  score: number;
}

export const getBookRecommendations = (borrowedBook: BookData, allBooks: BookData[] = []): BookRecommendation[] => {
  const recommendations: BookRecommendation[] = [];
  
  // Filter out the borrowed book
  const availableBooks = allBooks.filter(book => book.isbn !== borrowedBook.isbn);
  
  if (availableBooks.length === 0) {
    return recommendations;
  }
  
  // Category-based recommendations (same category)
  const sameCategory = availableBooks
    .filter(book => book.category === borrowedBook.category)
    .slice(0, 3)
    .map(book => ({
      book,
      reason: `Similar to "${borrowedBook.title}" - Same category: ${book.category}`,
      score: 0.8
    }));
  
  recommendations.push(...sameCategory);
  
  // Author-based recommendations (same author)
  const sameAuthor = availableBooks
    .filter(book => book.author === borrowedBook.author)
    .slice(0, 2)
    .map(book => ({
      book,
      reason: `More books by ${book.author}`,
      score: 0.9
    }));
  
  recommendations.push(...sameAuthor);
  
  // Popular books in fiction categories
  if (borrowedBook.category === 'Fiction' || borrowedBook.category === 'Science Fiction' || borrowedBook.category === 'Fantasy') {
    const popularFiction = availableBooks
      .filter(book => ['Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Romance'].includes(book.category))
      .slice(0, 2)
      .map(book => ({
        book,
        reason: `Popular in ${book.category}`,
        score: 0.7
      }));
    
    recommendations.push(...popularFiction);
  }
  
  // Non-fiction recommendations
  if (borrowedBook.category === 'Biography' || borrowedBook.category === 'History' || borrowedBook.category === 'Science') {
    const relatedNonFiction = availableBooks
      .filter(book => ['Biography', 'History', 'Science', 'Self-Help', 'Philosophy'].includes(book.category))
      .slice(0, 2)
      .map(book => ({
        book,
        reason: `Educational reading like "${borrowedBook.title}"`,
        score: 0.75
      }));
    
    recommendations.push(...relatedNonFiction);
  }
  
  // Remove duplicates and sort by score
  const uniqueRecommendations = recommendations
    .filter((rec, index, arr) => arr.findIndex(r => r.book.isbn === rec.book.isbn) === index)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Limit to 5 recommendations
  
  return uniqueRecommendations;
};

// Get trending books by category
export const getTrendingBooks = (allBooks: BookData[] = [], category?: string, limit: number = 6): BookData[] => {
  let books = allBooks;
  
  if (category) {
    books = books.filter(book => book.category === category);
  }
  
  // Sort by availability and return top books
  return books
    .filter(book => book.availableQuantity > 0)
    .slice(0, limit);
};

// Get books by category
export const getBooksByCategory = (allBooks: BookData[] = [], category: string): BookData[] => {
  return allBooks.filter(book => book.category === category);
};

// Get all categories
export const getAllCategories = (allBooks: BookData[] = []): string[] => {
  const categories = [...new Set(allBooks.map(book => book.category))];
  return categories.sort();
};
