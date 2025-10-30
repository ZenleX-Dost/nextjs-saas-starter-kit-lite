/**
 * Image Canvas - Interactive canvas for drawing bounding boxes
 */

import { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { CustomDefectType } from '~/types/custom-defects';

interface ImageCanvasProps {
  imagePath: string;
  annotations: Array<{
    bbox: [number, number, number, number];
    class_id: number;
    class_name: string;
  }>;
  selectedClassId: number | null;
  defectTypes: CustomDefectType[];
  onAddAnnotation: (bbox: [number, number, number, number]) => void;
  onRemoveAnnotation: (index: number) => void;
}

export function ImageCanvas({
  imagePath,
  annotations,
  selectedClassId,
  defectTypes,
  onAddAnnotation,
  onRemoveAnnotation,
}: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<[number, number, number, number] | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = imagePath;
    img.onload = () => {
      setImage(img);
      // Fit image to canvas
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const scaleX = containerWidth / img.width;
        const scaleY = containerHeight / img.height;
        const newScale = Math.min(scaleX, scaleY, 1) * 0.9; // 90% to leave margin
        setScale(newScale);
        setOffset({ x: 0, y: 0 });
      }
    };
  }, [imagePath]);

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (canvas.width - scaledWidth) / 2 + offset.x;
    const y = (canvas.height - scaledHeight) / 2 + offset.y;
    
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);

    // Draw annotations
    annotations.forEach((annotation, index) => {
      const defectType = defectTypes.find(t => t.id === annotation.class_id);
      const color = defectType?.color || '#3b82f6';
      
      const [x1, y1, x2, y2] = annotation.bbox;
      const boxX = x + (x1 * scaledWidth);
      const boxY = y + (y1 * scaledHeight);
      const boxWidth = (x2 - x1) * scaledWidth;
      const boxHeight = (y2 - y1) * scaledHeight;

      // Draw box
      ctx.strokeStyle = color;
      ctx.lineWidth = hoveredIndex === index ? 3 : 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      // Draw label background
      const labelText = annotation.class_name;
      ctx.font = '14px sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillStyle = color;
      ctx.fillRect(boxX, boxY - 22, textWidth + 10, 22);

      // Draw label text
      ctx.fillStyle = 'white';
      ctx.fillText(labelText, boxX + 5, boxY - 6);
    });

    // Draw current drawing box
    if (isDrawing && drawStart && currentBox) {
      const [x1, y1, x2, y2] = currentBox;
      const boxX = x + (x1 * scaledWidth);
      const boxY = y + (y1 * scaledHeight);
      const boxWidth = (x2 - x1) * scaledWidth;
      const boxHeight = (y2 - y1) * scaledHeight;

      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      ctx.setLineDash([]);
    }
  }, [image, scale, offset, annotations, isDrawing, currentBox, hoveredIndex, defectTypes]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !image) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (canvas.width - scaledWidth) / 2 + offset.x;
    const y = (canvas.height - scaledHeight) / 2 + offset.y;

    // Convert to normalized coordinates (0-1)
    const normalizedX = (mouseX - x) / scaledWidth;
    const normalizedY = (mouseY - y) / scaledHeight;

    // Clamp to image bounds
    return {
      x: Math.max(0, Math.min(1, normalizedX)),
      y: Math.max(0, Math.min(1, normalizedY)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedClassId) {
      alert('Please select a defect class first');
      return;
    }

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setDrawStart(coords);
    setCurrentBox([coords.x, coords.y, coords.x, coords.y]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    setCurrentBox([
      Math.min(drawStart.x, coords.x),
      Math.min(drawStart.y, coords.y),
      Math.max(drawStart.x, coords.x),
      Math.max(drawStart.y, coords.y),
    ]);

    // Check hover on existing annotations
    const hoveredIdx = annotations.findIndex((ann) => {
      const [x1, y1, x2, y2] = ann.bbox;
      return coords.x >= x1 && coords.x <= x2 && coords.y >= y1 && coords.y <= y2;
    });
    setHoveredIndex(hoveredIdx >= 0 ? hoveredIdx : null);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) {
      setIsDrawing(false);
      return;
    }

    const [x1, y1, x2, y2] = currentBox;
    const width = x2 - x1;
    const height = y2 - y1;

    // Only add if box has minimum size (0.5% of image)
    if (width > 0.005 && height > 0.005) {
      onAddAnnotation(currentBox);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentBox(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredIndex !== null) {
      if (e.ctrlKey || e.metaKey) {
        // Remove annotation on Ctrl+Click
        onRemoveAnnotation(hoveredIndex);
      }
    }
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.1));
  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="text-sm text-muted-foreground">
          Click and drag to draw bounding boxes • Ctrl+Click to remove
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm font-mono">{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative bg-gray-50 dark:bg-gray-900" style={{ height: '600px' }}>
        <canvas
          ref={canvasRef}
          width={containerRef.current?.clientWidth || 800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          className="cursor-crosshair"
          style={{ display: 'block' }}
        />
        {!image && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading image...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
