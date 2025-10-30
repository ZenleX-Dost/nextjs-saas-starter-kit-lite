/**
 * Active Learning Suggestions - Display AI-recommended images for labeling
 */

import { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';

interface ActiveLearningSuggestionsProps {
  onSelectImage: (imagePath: string, imageId: string, suggestionId: number) => void;
}

interface Suggestion {
  id: number;
  analysis_id: number;
  uncertainty_score: number;
  priority_score: number;
  suggested_defect_types: string[];
  image_path?: string;
}

export function ActiveLearningSuggestions({ onSelectImage }: ActiveLearningSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Implement API call when endpoint is ready
      // const data = await customDefectsAPI.getActiveLearning Suggestions();
      // setSuggestions(data);
      
      // Mock data for now
      setSuggestions([]);
    } catch (err: any) {
      console.error('Failed to load suggestions:', err);
      setError(err.response?.data?.detail || 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border flex items-center justify-center" style={{ minHeight: '500px' }}>
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading smart suggestions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border flex items-center justify-center" style={{ minHeight: '500px' }}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Error Loading Suggestions</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadSuggestions}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border flex flex-col items-center justify-center p-12" style={{ minHeight: '500px' }}>
        <Lightbulb className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Suggestions Available</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Active learning suggestions will appear here after you've performed some analyses.
          The AI will recommend the most informative images to label next.
        </p>
        <div className="text-sm text-muted-foreground text-center space-y-2">
          <p className="flex items-center justify-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Smart recommendations based on uncertainty and diversity
          </p>
          <p>Helps you build a better dataset with fewer labels</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Smart Suggestions
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              AI-recommended images that will improve your model the most
            </p>
          </div>
          <button
            onClick={loadSuggestions}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-[600px] overflow-y-auto">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              if (suggestion.image_path) {
                onSelectImage(suggestion.image_path, `al_${suggestion.id}`, suggestion.id);
              }
            }}
          >
            {suggestion.image_path ? (
              <img
                src={suggestion.image_path}
                alt={`Suggestion ${suggestion.id}`}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <span className="text-muted-foreground">No preview</span>
              </div>
            )}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Priority Score</span>
                <span className="text-lg font-bold text-primary">
                  {(suggestion.priority_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                Uncertainty: {(suggestion.uncertainty_score * 100).toFixed(0)}%
              </div>
              {suggestion.suggested_defect_types.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {suggestion.suggested_defect_types.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
