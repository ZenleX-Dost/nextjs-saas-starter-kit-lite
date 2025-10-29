/**
 * API client for RadiKal backend.
 * 
 * Handles all HTTP requests to the FastAPI backend.
 */

import axios, { AxiosInstance } from 'axios';
import { DetectionResponse as BackendDetectionResponse, Detection } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// YOLOv8 class mapping - Weld Defect Types
const DEFECT_CLASSES: Record<number, string> = {
  0: 'LP',  // Lack of Penetration
  1: 'PO',  // Porosity
  2: 'CR',  // Cracks
  3: 'ND',  // No Defect (clean weld)
};

// Full defect names for display
const DEFECT_FULL_NAMES: Record<number, string> = {
  0: 'Lack of Penetration',
  1: 'Porosity',
  2: 'Cracks',
  3: 'No Defect',
};

class RadiKalAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to all requests (disabled for now)
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Transform backend DetectionBox to frontend Detection format
   */
  private transformDetections(backendResponse: BackendDetectionResponse): any {
    const transformedDetections: Detection[] = backendResponse.detections.map((det, index) => ({
      detection_id: `${backendResponse.image_id}_det_${index}`,
      bbox: [det.x1, det.y1, det.x2, det.y2] as [number, number, number, number],
      confidence: det.confidence,
      class_name: DEFECT_CLASSES[det.label] || `class_${det.label}`,
      severity: det.severity || this.mapConfidenceToSeverity(det.confidence),
      mask_base64: backendResponse.segmentation_masks[index] || null,
      // Keep backend fields too for compatibility
      x1: det.x1,
      y1: det.y1,
      x2: det.x2,
      y2: det.y2,
      label: det.label,
    }));

    return {
      image_id: backendResponse.image_id,
      timestamp: backendResponse.timestamp,
      detections: transformedDetections,
      num_detections: transformedDetections.length,
      mean_uncertainty: 0, // Not provided by YOLOv8
      processed_by: backendResponse.model_version,
      // Keep original backend data
      inference_time_ms: backendResponse.inference_time_ms,
      model_version: backendResponse.model_version,
    };
  }

  /**
   * Map confidence score to severity level
   */
  private mapConfidenceToSeverity(confidence: number): 'critical' | 'high' | 'medium' | 'low' {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/api/xai-qc/health');
    return response.data;
  }

  // Classify defects with YOLOv8 Classification (replaces detection for now)
  async detectDefects(imageFile: File) {
    const formData = new FormData();
    formData.append('file', imageFile);

    // Use classification endpoint (/api/xai-qc/explain) which works correctly
    const response = await this.client.post(
      '/api/xai-qc/explain', // Classification endpoint with correct prefix
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Transform classification response to detection format
    const classificationData = response.data;
    const metadata = classificationData.metadata;
    
    if (!metadata || !metadata.prediction) {
      throw new Error('Invalid response from classification endpoint');
    }

    const prediction = metadata.prediction;
    const isDefect = prediction.class_code !== 'ND'; // Not No Defect
    
    // Create a "detection" from the classification result
    // If it's a defect, create a full-image bounding box
    const detections: Detection[] = isDefect ? [{
      detection_id: `${classificationData.image_id}_cls_0`,
      bbox: [0, 0, 640, 640] as [number, number, number, number], // Full image
      confidence: prediction.confidence,
      class_name: prediction.class_code,
      class_full_name: prediction.class_full_name,
      severity: prediction.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low',
      mask_base64: null,
      x1: 0,
      y1: 0,
      x2: 640,
      y2: 640,
      label: prediction.class_id,
    }] : [];

    return {
      image_id: classificationData.image_id,
      timestamp: classificationData.timestamp,
      detections: detections,
      num_detections: detections.length,
      mean_uncertainty: 1.0 - prediction.confidence,
      processed_by: 'YOLOv8-cls',
      inference_time_ms: classificationData.computation_time_ms || 16,
      model_version: 'yolov8s-cls-1.0.0',
      // Store classification metadata for later use
      _classification_metadata: metadata,
    };
  }

  // Get XAI explanations from classification
  async getExplanations(data: {
    image_id: string;
    detection_id?: string;
    image_base64?: string;
    target_class?: number;
    file?: File; // Accept file directly
  }) {
    // If we have a file, use it directly with /api/xai-qc/explain
    if (data.file) {
      const formData = new FormData();
      formData.append('file', data.file);

      const response = await this.client.post('/api/xai-qc/explain', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    
    // Fallback to old method (not used anymore)
    const requestData = {
      image_id: data.image_id,
      image_base64: data.image_base64,
      target_class: data.target_class,
      methods: ['all'],
    };

    const response = await this.client.post('/api/xai-qc/explain', requestData);
    return response.data;
  }

  // Get metrics
  async getMetrics(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await this.client.get(`/api/xai-qc/metrics?${params.toString()}`);
    return response.data;
  }

  // Export report
  async exportReport(imageIds: string[], format: 'pdf' | 'excel') {
    const response = await this.client.post('/api/xai-qc/export', {
      image_ids: imageIds,
      format: format,
    });
    return response.data;
  }

  // Get calibration status
  async getCalibration() {
    const response = await this.client.get('/api/xai-qc/calibration');
    return response.data;
  }

  // Get analysis history
  async getHistory(page: number = 1, pageSize: number = 20, filters?: {
    status?: string;
    has_defects?: boolean;
  }) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.has_defects !== undefined) params.append('has_defects', filters.has_defects.toString());

    const response = await this.client.get(`/api/xai-qc/history?${params.toString()}`);
    return response.data;
  }

  // Download file
  async downloadFile(url: string) {
    const response = await this.client.get(url, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiClient = new RadiKalAPI();
