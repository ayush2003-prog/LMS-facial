
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Star } from "lucide-react";
import { BookRecommendation } from "../services/recommendationService";

interface BookRecommendationsProps {
  recommendations: BookRecommendation[];
  onBookSelect?: (bookIsbn: string) => void;
}

export const BookRecommendations = ({ recommendations, onBookSelect }: BookRecommendationsProps) => {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
          <Star className="h-5 w-5 text-yellow-500" />
          Recommended for You
        </CardTitle>
        <CardDescription className="text-blue-600">
          Books similar to your selection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.book.isbn}
              className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-blue-100 hover:bg-white/90 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{rec.book.title}</h4>
                <p className="text-sm text-gray-600 truncate">by {rec.book.author}</p>
                <p className="text-xs text-blue-600 mt-1">{rec.reason}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {rec.book.category}
                </Badge>
              </div>
              {onBookSelect && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onBookSelect(rec.book.isbn)}
                  className="ml-2 text-xs border-blue-200 hover:bg-blue-50"
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  View
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
