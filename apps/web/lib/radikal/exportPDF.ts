import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DetectionResponse, ExplanationResponse, ExplanationHeatmap } from '~/types';
import { format } from 'date-fns';

export interface ExportOptions {
  includeHeatmaps: boolean;
  includeMetadata: boolean;
  companyName?: string;
}

export const exportToPDF = async (
  imageName: string,
  imageUrl: string,
  detectionResult: DetectionResponse,
  explanationResult?: ExplanationResponse,
  options: ExportOptions = { includeHeatmaps: true, includeMetadata: true }
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  pdf.setFontSize(20);
  pdf.setTextColor(37, 99, 235); // Blue
  pdf.text(options.companyName || 'RadiKal', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Weld Defect Detection Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Metadata
  if (options.includeMetadata) {
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${format(new Date(), 'PPpp')}`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Image: ${imageName}`, 20, yPosition);
    yPosition += 10;
  }

  // Summary Section
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Detection Summary', 20, yPosition);
  yPosition += 8;

  const summaryData = [
    ['Total Detections', detectionResult.detections.length.toString()],
    ['Mean Uncertainty', detectionResult.mean_uncertainty ? (detectionResult.mean_uncertainty * 100).toFixed(1) + '%' : 'N/A'],
    ['Processed By', detectionResult.processed_by || detectionResult.model_version],
    ['Timestamp', format(new Date(detectionResult.timestamp), 'PPpp')],
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 20, right: 20 },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Detections Table
  if (detectionResult.detections.length > 0) {
    pdf.setFontSize(14);
    pdf.text('Detected Defects', 20, yPosition);
    yPosition += 8;

    const detectionsData = detectionResult.detections.map((det, idx) => [
      `#${idx + 1}`,
      det.class_name || `Class ${det.label}`,
      (det.confidence * 100).toFixed(1) + '%',
      det.severity || 'unknown',
      det.bbox ? `[${det.bbox.map(b => b.toFixed(0)).join(', ')}]` : `[${det.x1},${det.y1},${det.x2},${det.y2}]`,
    ]);

    autoTable(pdf, {
      startY: yPosition,
      head: [['#', 'Type', 'Confidence', 'Severity', 'Bounding Box']],
      body: detectionsData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 20, right: 20 },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 15;
  }

  // Add new page if needed
  if (yPosition > pageHeight - 40) {
    pdf.addPage();
    yPosition = 20;
  }

  // Original Image
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    const imgWidth = 170;
    const imgHeight = (img.height / img.width) * imgWidth;

    pdf.setFontSize(14);
    pdf.text('Analyzed Image', 20, yPosition);
    yPosition += 10;

    pdf.addImage(img, 'PNG', 20, yPosition, imgWidth, imgHeight);
    yPosition += imgHeight + 15;
  } catch (error) {
    console.error('Error adding image to PDF:', error);
  }

  // XAI Heatmaps
  if (options.includeHeatmaps && explanationResult) {
    pdf.addPage();
    yPosition = 20;

    pdf.setFontSize(14);
    pdf.text('Explainability Analysis', 20, yPosition);
    yPosition += 10;

    const methods = ['gradcam', 'lime', 'shap', 'saliency'] as const;
    let row = 0;

    for (const method of methods) {
      const heatmap = explanationResult.explanations.find((h: ExplanationHeatmap) => h.method === method);
      if (heatmap) {
        try {
          const heatmapImg = new Image();
          heatmapImg.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            heatmapImg.onload = resolve;
            heatmapImg.onerror = reject;
            heatmapImg.src = `data:image/png;base64,${heatmap.heatmap_base64}`;
          });

          const imgWidth = 80;
          const imgHeight = (heatmapImg.height / heatmapImg.width) * imgWidth;
          const xPos = 20 + (row % 2) * 90;
          const yPos = yPosition + Math.floor(row / 2) * 90;

          pdf.setFontSize(10);
          pdf.text(method.toUpperCase(), xPos, yPos);
          pdf.addImage(heatmapImg, 'PNG', xPos, yPos + 5, imgWidth, imgHeight);
          
          row++;
        } catch (error) {
          console.error(`Error adding ${method} heatmap:`, error);
        }
      }
    }
  }

  // Footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${totalPages} | RadiKal AI-Powered Weld Inspection`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save
  pdf.save(`radikal-report-${imageName.replace(/\.[^/.]+$/, '')}-${Date.now()}.pdf`);
};

export default exportToPDF;
