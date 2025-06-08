
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Download, TrendingUp, BookOpen, Users, AlertTriangle, Calendar } from "lucide-react";
import { toast } from "sonner";
import { databaseService } from "@/services/databaseService";

interface ReportData {
  totalBooks: number;
  totalStudents: number;
  booksIssued: number;
  overdueBooks: number;
  totalPenalties: number;
  categoryDistribution: { category: string; count: number }[];
  weeklyBorrowingTrend: { week: string; date: string; borrowed: number; returned: number }[];
  topBorrowedBooks: { title: string; author: string; borrowCount: number }[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#8dd1e1', '#d084d0'];

export const LibraryReport = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Loading library report data...');
      
      const response = await databaseService.getLibraryReport() as any;
      console.log('📊 Raw report response:', response);
      
      if (response?.success && response?.reportData) {
        // Safely process the data with fallbacks
        const transformedData: ReportData = {
          totalBooks: response.reportData.totalBooks || 0,
          totalStudents: response.reportData.totalStudents || 0,
          booksIssued: response.reportData.booksIssued || 0,
          overdueBooks: response.reportData.overdueBooks || 0,
          totalPenalties: response.reportData.totalPenalties || 0,
          categoryDistribution: Array.isArray(response.reportData.categoryDistribution) 
            ? response.reportData.categoryDistribution 
            : [],
          weeklyBorrowingTrend: Array.isArray(response.reportData.weeklyBorrowingTrend)
            ? response.reportData.weeklyBorrowingTrend.map((item: any, index: number) => ({
                week: item.week || `Week ${index + 1}`,
                date: item.date || new Date().toISOString().split('T')[0],
                borrowed: item.borrowed || 0,
                returned: item.returned || 0
              }))
            : [],
          topBorrowedBooks: Array.isArray(response.reportData.topBorrowedBooks)
            ? response.reportData.topBorrowedBooks
            : []
        };
        
        setReportData(transformedData);
        console.log('✅ Library report data processed successfully:', transformedData);
      } else {
        console.warn('⚠️ Invalid response format, using fallback data');
        // Use fallback data if API fails
        setReportData({
          totalBooks: 0,
          totalStudents: 0,
          booksIssued: 0,
          overdueBooks: 0,
          totalPenalties: 0,
          categoryDistribution: [],
          weeklyBorrowingTrend: [],
          topBorrowedBooks: []
        });
      }
    } catch (error) {
      console.error('❌ Failed to load report data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load report data');
      
      // Fallback to basic data structure to prevent white page
      setReportData({
        totalBooks: 0,
        totalStudents: 0,
        booksIssued: 0,
        overdueBooks: 0,
        totalPenalties: 0,
        categoryDistribution: [],
        weeklyBorrowingTrend: [],
        topBorrowedBooks: []
      });
      
      toast.error('Failed to load library report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await databaseService.downloadLibraryReport() as any;
      if (response?.success) {
        if (response.reportUrl && response.reportUrl !== '#') {
          // Create a temporary link to download the report
          const link = document.createElement('a');
          link.href = response.reportUrl;
          link.download = `library-report-${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Report downloaded successfully');
        } else {
          toast.info(response.message || 'Report download feature coming soon');
        }
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('❌ Failed to download report:', error);
      toast.error('Failed to download report');
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">Generating library report...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error loading report: {error}</p>
            <Button onClick={loadReportData} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reportData) {
    return (
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No report data available</p>
            <Button onClick={loadReportData} variant="outline" className="mt-4">
              Reload Report
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Download Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Library Report
          </h2>
          <p className="text-gray-600">Comprehensive analytics and insights</p>
        </div>
        <Button
          onClick={downloadReport}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Books</p>
                <p className="text-xl font-bold text-purple-600">{reportData.totalBooks}</p>
              </div>
              <BookOpen className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Active Students</p>
                <p className="text-xl font-bold text-blue-600">{reportData.totalStudents}</p>
              </div>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Books Issued</p>
                <p className="text-xl font-bold text-green-600">{reportData.booksIssued}</p>
              </div>
              <Calendar className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Overdue</p>
                <p className="text-xl font-bold text-red-600">{reportData.overdueBooks}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Penalties</p>
                <p className="text-xl font-bold text-orange-600">₹{reportData.totalPenalties}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Pie Chart */}
        <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Book Categories Distribution</CardTitle>
            <CardDescription>Books categorized by genre</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.categoryDistribution && reportData.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, count, percent }) => `${category}: ${count} (${(percent * 100).toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {reportData.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} books`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No category data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Borrowing Trend */}
        <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Borrowing & Returns</CardTitle>
            <CardDescription>Weekly trend of book transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.weeklyBorrowingTrend && reportData.weeklyBorrowingTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.weeklyBorrowingTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="borrowed" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Borrowed" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="returned" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Returned" 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No borrowing trend data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Borrowed Books */}
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">Most Popular Books</CardTitle>
          <CardDescription>Top 10 most borrowed books</CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.topBorrowedBooks && reportData.topBorrowedBooks.length > 0 ? (
            <div className="space-y-4">
              {reportData.topBorrowedBooks.slice(0, 10).map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{book.title}</p>
                      <p className="text-sm text-gray-600">by {book.author}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{book.borrowCount}</p>
                    <p className="text-xs text-gray-500">times borrowed</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No borrowing data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
