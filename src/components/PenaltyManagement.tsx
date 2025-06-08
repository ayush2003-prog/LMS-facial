
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, DollarSign, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { databaseService } from "@/services/databaseService";

interface PenaltyRecord {
  student_id: string;
  student_name: string;
  student_email: string;
  college_id: string;
  penalty_amount: number;
  overdue_books: number;
  total_penalty: number;
}

export const PenaltyManagement = () => {
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPenalties();
  }, []);

  const loadPenalties = async () => {
    try {
      setLoading(true);
      const response = await databaseService.getPenalties() as any;
      if (response?.success && response?.penalties) {
        setPenalties(response.penalties);
      }
    } catch (error) {
      console.error('❌ Failed to load penalties:', error);
      toast.error('Failed to load penalty information');
    } finally {
      setLoading(false);
    }
  };

  const handleClearPenalty = async (studentId: string, studentName: string) => {
    try {
      const response = await databaseService.clearPenalty(studentId) as any;
      if (response?.success) {
        toast.success(`Penalty cleared for ${studentName}`);
        await loadPenalties();
      } else {
        throw new Error(response?.message || 'Failed to clear penalty');
      }
    } catch (error) {
      console.error('❌ Failed to clear penalty:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to clear penalty');
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading penalty information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPenalties = penalties.reduce((sum, p) => sum + p.penalty_amount, 0);
  const studentsWithPenalties = penalties.filter(p => p.penalty_amount > 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Penalties</p>
                <p className="text-2xl font-bold text-red-600">₹{totalPenalties}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Students with Penalties</p>
                <p className="text-2xl font-bold text-orange-600">{studentsWithPenalties}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Penalty</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{studentsWithPenalties > 0 ? Math.round(totalPenalties / studentsWithPenalties) : 0}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Penalty Details Table */}
      <Card className="bg-white/60 backdrop-blur-lg border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Penalty Management
          </CardTitle>
          <CardDescription>Track and manage student penalties for overdue books</CardDescription>
        </CardHeader>
        <CardContent>
          {penalties.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">No penalties to display</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Details</TableHead>
                    <TableHead>College ID</TableHead>
                    <TableHead>Overdue Books</TableHead>
                    <TableHead>Penalty Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penalties.map((penalty) => (
                    <TableRow key={penalty.student_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{penalty.student_name}</p>
                          <p className="text-sm text-gray-600">{penalty.student_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{penalty.college_id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                          {penalty.overdue_books}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold text-lg ${penalty.penalty_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{penalty.penalty_amount}
                        </span>
                      </TableCell>
                      <TableCell>
                        {penalty.penalty_amount > 0 ? (
                          <Badge variant="destructive">Outstanding</Badge>
                        ) : (
                          <Badge variant="secondary">Clear</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {penalty.penalty_amount > 0 && (
                          <Button
                            onClick={() => handleClearPenalty(penalty.student_id, penalty.student_name)}
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            Clear Penalty
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
