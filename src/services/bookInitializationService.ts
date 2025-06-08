
export const initializeBooks = () => {
  const existingBooks = localStorage.getItem("books");
  
  if (!existingBooks) {
    // Initialize with empty array - books will be added manually by admin
    const emptyBooks: any[] = [];
    localStorage.setItem("books", JSON.stringify(emptyBooks));
    console.log("Initialized empty books database");
    return emptyBooks;
  }
  
  const books = JSON.parse(existingBooks);
  console.log("Loaded existing books:", books.length);
  return books;
};

export const updateBooksWithNewData = () => {
  // This function can be used to refresh books from the database
  const books = JSON.parse(localStorage.getItem("books") || "[]");
  console.log("Current books in database:", books.length);
  return books;
};
