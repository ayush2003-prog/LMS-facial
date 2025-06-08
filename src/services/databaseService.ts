const API_BASE_URL = 'http://localhost:3001/api';

interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class DatabaseService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      console.log(`📡 Making request to: ${API_BASE_URL}${endpoint}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: this.getAuthHeaders(),
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);
      console.log(`📡 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 Response data:', data);
      return data;
    } catch (error) {
      console.error(`❌ Request failed for ${endpoint}:`, error);
       if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please ensure the backend is running on http://localhost:3001');
      }
      throw error;
    }
  }

  // Health check with detailed error reporting
  async healthCheck() {
    try {
      const response = await this.makeRequest('/health');
      console.log('✅ Health check successful:', response);
      return response;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw new Error('Backend server is not responding. Please start the server with "npm start" in the backend directory.');
    }
  }

  // Student Authentication
  async registerStudent(studentData: {
    collegeId: string;
    fullName: string;
    email: string;
    course: string;
    password: string;
  }) {
     try {
      console.log('📝 Registering student:', { ...studentData, password: '[HIDDEN]' });
      return this.makeRequest('/students/register', {
        method: 'POST',
        body: JSON.stringify(studentData)
      });
    } catch (error) {
      console.error('❌ Student registration failed:', error);
      throw error;
    }
  }

  async loginStudent(email: string, password: string) {
    try {
      console.log('🔐 Student login attempt for:', email);
      return this.makeRequest('/students/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } catch (error) {
      console.error('❌ Student login failed:', error);
      throw error;
    }
  }

  // Admin Authentication
  async loginAdmin(email: string, password: string) {
    try {
      console.log('👨‍💼 Admin login attempt for:', email);
      return this.makeRequest('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } catch (error) {
      console.error('❌ Admin login failed:', error);
      throw error;
    }
  }

  // Books Management
  async getAllBooks() {
    try {
      console.log('📚 Fetching all books');
      return this.makeRequest('/books');
    } catch (error) {
      console.error('❌ Failed to fetch books:', error);
      throw error;
    }
  }

  async getTrendingBooks() {
    try {
      console.log('📈 Fetching trending books');
      return this.makeRequest('/books/trending');
    } catch (error) {
      console.error('❌ Failed to fetch trending books:', error);
      throw error;
    }
  }

  async addBook(bookData: {
    title: string;
    author: string;
    category: string;
    isbn: string;
    coverImage?: string;
    description?: string;
    totalQuantity: number;
  }) {
    try {
      console.log('📚 Adding new book:', bookData.title);
      return this.makeRequest('/books', {
        method: 'POST',
        body: JSON.stringify(bookData)
      });
    } catch (error) {
      console.error('❌ Failed to add book:', error);
      throw error;
    }
  }

  async updateBook(bookId: string, bookData: {
    title: string;
    author: string;
    category: string;
    isbn: string;
    coverImage?: string;
    description?: string;
    totalQuantity: number;
  }) {
    try {
      console.log('📚 Updating book:', bookId);
      return this.makeRequest(`/books/${bookId}`, {
        method: 'PUT',
        body: JSON.stringify(bookData)
      });
    } catch (error) {
      console.error('❌ Failed to update book:', error);
      throw error;
    }
  }

  async deleteBook(bookId: string) {
    try {
      console.log('🗑️ Deleting book:', bookId);
      return this.makeRequest(`/books/${bookId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('❌ Failed to delete book:', error);
      throw error;
    }
  }

  // Borrowing Management
  async borrowBook(bookId: string, dueDate: string) {
    try {
      console.log('📖 Borrowing book:', { bookId, dueDate });
      return this.makeRequest('/borrow', {
        method: 'POST',
        body: JSON.stringify({ bookId, dueDate })
      });
    } catch (error) {
      console.error('❌ Failed to borrow book:', error);
      throw error;
    }
  }

  async returnBook(borrowId: string) {
    try {
      console.log('📖 Returning book:', borrowId);
      return this.makeRequest(`/borrow/${borrowId}/return`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('❌ Failed to return book:', error);
      throw error;
    }
  }

  async getStudentBorrowedBooks(studentId: string) {
    try {
      console.log('📖 Fetching borrowed books for student:', studentId);
      return this.makeRequest(`/borrow/student/${studentId}`);
    } catch (error) {
      console.error('❌ Failed to fetch borrowed books:', error);
      throw error;
    }
  }

  async getBorrowHistory(studentId: string) {
    try {
      console.log('📖 Fetching borrow history for student:', studentId);
      return this.makeRequest(`/borrow/history/${studentId}`);
    } catch (error) {
      console.error('❌ Failed to fetch borrow history:', error);
      throw error;
    }
  }

  // Admin Operations
  async getAllStudents() {
    try {
      console.log('👨‍🎓 Fetching all students');
      return this.makeRequest('/admin/students');
    } catch (error) {
      console.error('❌ Failed to fetch students:', error);
      throw error;
    }
  }

  async toggleStudentStatus(studentId: string) {
    try {
      console.log('👨‍🎓 Toggling student status:', studentId);
      return this.makeRequest(`/admin/students/${studentId}/toggle-status`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('❌ Failed to toggle student status:', error);
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      console.log('📊 Fetching dashboard statistics');
      return this.makeRequest('/admin/dashboard/stats');
    } catch (error) {
      console.error('❌ Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  async getAllBorrowedBooks() {
    try {
      console.log('📖 Fetching all borrowed books');
      return this.makeRequest('/admin/borrowed-books');
    } catch (error) {
      console.error('❌ Failed to fetch borrowed books:', error);
      throw error;
    }
  }

  async getPenalties() {
    try {
      console.log('💰 Fetching penalty information');
      return this.makeRequest('/admin/penalties');
    } catch (error) {
      console.error('❌ Failed to fetch penalties:', error);
      throw error;
    }
  }

  async clearPenalty(studentId: string) {
    try {
      console.log('💰 Clearing penalty for student:', studentId);
      return this.makeRequest(`/admin/penalties/${studentId}/clear`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('❌ Failed to clear penalty:', error);
      throw error;
    }
  }

  async getLibraryReport() {
    try {
      console.log('📊 Fetching library report data');
      const response = await this.makeRequest('/admin/reports/library');
      console.log('📊 Library report response:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch library report:', error);
      throw error;
    }
  }

  async downloadLibraryReport() {
    try {
      console.log('📥 Downloading library report');
      return this.makeRequest('/admin/reports/download');
    } catch (error) {
      console.error('❌ Failed to download library report:', error);
      throw error;
    }
  }

  // Favorites Management
  async toggleFavoriteBook(bookId: string) {
    try {
      console.log('⭐ Toggling favorite book:', bookId);
      const response = await this.makeRequest('/students/favorites/toggle', {
        method: 'POST',
        body: JSON.stringify({ bookId })
      });
      console.log('⭐ Toggle favorite response:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to toggle favorite book:', error);
      throw error;
    }
  }

  async getFavoriteBooks(studentId: string) {
    try {
      console.log('⭐ Fetching favorite books for student:', studentId);
      const response = await this.makeRequest(`/students/${studentId}/favorites`);
      console.log('⭐ Favorite books response:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch favorite books:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
