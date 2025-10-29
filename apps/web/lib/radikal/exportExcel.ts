import * as XLSX from 'xlsx';
import { DetectionResponse } from '~/types';
import { format } from 'date-fns';

export const exportToExcel = (
  imageName: string,
  detectionResult: DetectionResponse,
  companyName: string = 'RadiKal'
) => {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['RadiKal Weld Defect Detection Report'],
    [''],
    ['Company', companyName],
    ['Generated', format(new Date(), 'PPpp')],
    ['Image', imageName],
    [''],
    ['Summary Statistics'],
    ['Total Detections', detectionResult.detections.length],
    ['Mean Uncertainty', detectionResult.mean_uncertainty ? (detectionResult.mean_uncertainty * 100).toFixed(2) + '%' : 'N/A'],
    ['Processed By', detectionResult.processed_by || detectionResult.model_version],
    ['Timestamp', format(new Date(detectionResult.timestamp), 'PPpp')],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Style the header
  summarySheet['A1'].s = {
    font: { bold: true, sz: 16, color: { rgb: '2563EB' } },
    alignment: { horizontal: 'center' },
  };

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Detections Sheet
  if (detectionResult.detections.length > 0) {
    const detectionsData = [
      ['Detection #', 'ID', 'Type', 'Confidence (%)', 'Severity', 'X1', 'Y1', 'X2', 'Y2'],
      ...detectionResult.detections.map((det, idx) => [
        idx + 1,
        det.detection_id || `det-${idx}`,
        det.class_name || `Class ${det.label}`,
        (det.confidence * 100).toFixed(2),
        det.severity || 'unknown',
        det.bbox ? det.bbox[0] : det.x1,
        det.bbox ? det.bbox[1] : det.y1,
        det.bbox ? det.bbox[2] : det.x2,
        det.bbox ? det.bbox[3] : det.y2,
      ]),
    ];

    const detectionsSheet = XLSX.utils.aoa_to_sheet(detectionsData);
    XLSX.utils.book_append_sheet(workbook, detectionsSheet, 'Detections');

    // Severity Analysis Sheet
    const severityCounts = detectionResult.detections.reduce(
      (acc, det) => {
        const severity = det.severity || 'unknown';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const severityData = [
      ['Severity', 'Count', 'Percentage'],
      ...Object.entries(severityCounts).map(([severity, count]) => [
        severity.charAt(0).toUpperCase() + severity.slice(1),
        count,
        ((count / detectionResult.detections.length) * 100).toFixed(2) + '%',
      ]),
    ];

    const severitySheet = XLSX.utils.aoa_to_sheet(severityData);
    XLSX.utils.book_append_sheet(workbook, severitySheet, 'Severity Analysis');

    // Defect Type Analysis Sheet
    const typeCounts = detectionResult.detections.reduce(
      (acc, det) => {
        const className = det.class_name || `Class ${det.label}`;
        acc[className] = (acc[className] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const typeData = [
      ['Defect Type', 'Count', 'Percentage'],
      ...Object.entries(typeCounts).map(([type, count]) => [
        type,
        count,
        ((count / detectionResult.detections.length) * 100).toFixed(2) + '%',
      ]),
    ];

    const typeSheet = XLSX.utils.aoa_to_sheet(typeData);
    XLSX.utils.book_append_sheet(workbook, typeSheet, 'Type Analysis');
  }

  // Write file
  XLSX.writeFile(
    workbook,
    `radikal-detections-${imageName.replace(/\.[^/.]+$/, '')}-${Date.now()}.xlsx`
  );
};

export default exportToExcel;
