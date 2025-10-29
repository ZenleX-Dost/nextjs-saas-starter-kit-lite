'use client';

import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { DetectionResponse, ExplanationResponse } from '~/types';
import { exportToPDF } from '~/lib/radikal/exportPDF';
import { exportToExcel } from '~/lib/radikal/exportExcel';
import { useUIStore } from '~/store/uiStore';
import { useSettingsStore } from '~/store/settingsStore';

interface ExportButtonProps {
  imageName: string;
  imageUrl: string;
  detectionResult: DetectionResponse;
  explanationResult?: ExplanationResponse;
  format?: 'pdf' | 'excel' | 'both';
  variant?: 'primary' | 'secondary';
}

const ExportButton: React.FC<ExportButtonProps> = ({
  imageName,
  imageUrl,
  detectionResult,
  explanationResult,
  format,
  variant = 'secondary',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useUIStore();
  const { settings } = useSettingsStore();

  const exportFormat = format || settings.defaultExportFormat;

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (exportFormat === 'pdf' || exportFormat === 'both') {
        await exportToPDF(imageName, imageUrl, detectionResult, explanationResult, {
          includeHeatmaps: settings.includeHeatmaps,
          includeMetadata: settings.includeMetadata,
          companyName: 'RadiKal',
        });

        addToast({
          type: 'success',
          title: 'PDF Exported',
          message: `Report saved as PDF successfully`,
        });
      }

      if (exportFormat === 'excel' || exportFormat === 'both') {
        exportToExcel(imageName, detectionResult, 'RadiKal');

        addToast({
          type: 'success',
          title: 'Excel Exported',
          message: `Detections exported to Excel successfully`,
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export report. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const buttonClasses =
    variant === 'primary'
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600';

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses}`}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          <span>Export {exportFormat === 'both' ? 'All' : exportFormat.toUpperCase()}</span>
        </>
      )}
    </button>
  );
};

export default ExportButton;
