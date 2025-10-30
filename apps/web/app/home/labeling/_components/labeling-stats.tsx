/**
 * Labeling Stats - Display statistics about labeling progress
 */

import { CheckCircle, AlertTriangle, Package, TrendingUp } from 'lucide-react';
import { CustomDefectType } from '~/types/custom-defects';

interface LabelingStatsProps {
  defectTypes: CustomDefectType[];
}

export function LabelingStats({ defectTypes }: LabelingStatsProps) {
  const totalSamples = defectTypes.reduce((sum, type) => sum + type.current_sample_count, 0);
  const readyTypes = defectTypes.filter(type => type.current_sample_count >= type.min_samples_required);
  const needMoreTypes = defectTypes.filter(type => type.current_sample_count < type.min_samples_required);
  const avgProgress = defectTypes.length > 0
    ? defectTypes.reduce((sum, type) => sum + (type.current_sample_count / type.min_samples_required), 0) / defectTypes.length
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <Package className="h-5 w-5 text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">{defectTypes.length}</span>
        </div>
        <div className="text-sm text-muted-foreground">Defect Types</div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <span className="text-2xl font-bold text-purple-600">{totalSamples}</span>
        </div>
        <div className="text-sm text-muted-foreground">Total Samples</div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-2xl font-bold text-green-600">{readyTypes.length}</span>
        </div>
        <div className="text-sm text-muted-foreground">Ready to Train</div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <span className="text-2xl font-bold text-orange-600">{needMoreTypes.length}</span>
        </div>
        <div className="text-sm text-muted-foreground">Need More Samples</div>
      </div>
    </div>
  );
}
