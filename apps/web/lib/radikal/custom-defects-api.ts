/**
 * API client for Custom Defect Types feature
 */

import axios, { AxiosInstance } from 'axios';
import {
  CustomDefectType,
  CustomDefectTypeCreate,
  CustomDefectTypeUpdate,
  TrainingSample,
  ModelVersion,
  TrainingJob,
  TrainingDataset,
  DefectStatistics,
} from '~/types/custom-defects';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class CustomDefectsAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 60000, // 60 seconds for training operations
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ==================== Custom Defect Types ====================

  /**
   * Get all custom defect types
   */
  async getCustomDefectTypes(activeOnly = false): Promise<CustomDefectType[]> {
    const response = await this.client.get('/api/xai-qc/custom-defects/types', {
      params: { active_only: activeOnly },
    });
    return response.data;
  }

  /**
   * Get a single custom defect type by ID
   */
  async getCustomDefectType(id: number): Promise<CustomDefectType> {
    const response = await this.client.get(`/api/xai-qc/custom-defects/types/${id}`);
    return response.data;
  }

  /**
   * Create a new custom defect type
   */
  async createCustomDefectType(data: CustomDefectTypeCreate): Promise<CustomDefectType> {
    const response = await this.client.post('/api/xai-qc/custom-defects/types', data);
    return response.data;
  }

  /**
   * Update an existing custom defect type
   */
  async updateCustomDefectType(
    id: number,
    data: CustomDefectTypeUpdate
  ): Promise<CustomDefectType> {
    const response = await this.client.patch(`/api/xai-qc/custom-defects/types/${id}`, data);
    return response.data;
  }

  /**
   * Delete a custom defect type
   */
  async deleteCustomDefectType(id: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/api/xai-qc/custom-defects/types/${id}`);
    return response.data;
  }

  // ==================== Training Samples ====================

  /**
   * Get training samples (optionally filtered by defect type)
   */
  async getTrainingSamples(defectTypeId?: number): Promise<TrainingSample[]> {
    const response = await this.client.get('/api/xai-qc/custom-defects/samples', {
      params: defectTypeId ? { defect_type_id: defectTypeId } : {},
    });
    return response.data;
  }

  /**
   * Get a single training sample by ID
   */
  async getTrainingSample(id: number): Promise<TrainingSample> {
    const response = await this.client.get(`/api/xai-qc/custom-defects/samples/${id}`);
    return response.data;
  }

  /**
   * Add a new training sample
   */
  async addTrainingSample(data: FormData): Promise<TrainingSample> {
    const response = await this.client.post('/api/xai-qc/custom-defects/samples', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Delete a training sample
   */
  async deleteTrainingSample(id: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/api/xai-qc/custom-defects/samples/${id}`);
    return response.data;
  }

  // ==================== Training & Models ====================

  /**
   * Start training with custom defect types
   */
  async startTraining(config?: {
    epochs?: number;
    batch_size?: number;
    learning_rate?: number;
    auto_deploy?: boolean;
  }): Promise<{ job_id: number; message: string }> {
    const response = await this.client.post('/api/xai-qc/custom-defects/train', config || {});
    return response.data;
  }

  /**
   * Get all training jobs
   */
  async getTrainingJobs(limit = 50): Promise<TrainingJob[]> {
    const response = await this.client.get('/api/xai-qc/custom-defects/training-jobs', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get a single training job by ID
   */
  async getTrainingJob(id: number): Promise<TrainingJob> {
    const response = await this.client.get(`/api/xai-qc/custom-defects/training-jobs/${id}`);
    return response.data;
  }

  /**
   * Get real-time training progress
   */
  async getTrainingProgress(id: number): Promise<{
    status: string;
    progress_percent: number;
    current_epoch: number;
    total_epochs: number;
    latest_train_loss: number;
    latest_val_loss: number;
    latest_accuracy: number;
    gpu_utilization_percent?: number;
  }> {
    const response = await this.client.get(
      `/api/xai-qc/custom-defects/training-jobs/${id}/progress`
    );
    return response.data;
  }

  /**
   * Cancel a running training job
   */
  async cancelTrainingJob(id: number): Promise<{ message: string }> {
    const response = await this.client.post(
      `/api/xai-qc/custom-defects/training-jobs/${id}/cancel`
    );
    return response.data;
  }

  /**
   * Get all model versions
   */
  async getModelVersions(): Promise<ModelVersion[]> {
    const response = await this.client.get('/api/xai-qc/custom-defects/models');
    return response.data;
  }

  /**
   * Get a single model version by ID
   */
  async getModelVersion(id: number): Promise<ModelVersion> {
    const response = await this.client.get(`/api/xai-qc/custom-defects/models/${id}`);
    return response.data;
  }

  /**
   * Get the currently active model
   */
  async getActiveModel(): Promise<ModelVersion> {
    const response = await this.client.get('/api/xai-qc/custom-defects/models/active/current');
    return response.data;
  }

  /**
   * Deploy a model version
   */
  async deployModel(modelVersionId: number, reason?: string): Promise<{ message: string }> {
    const response = await this.client.post('/api/xai-qc/custom-defects/models/deploy', {
      model_version_id: modelVersionId,
      reason,
    });
    return response.data;
  }

  /**
   * Rollback to a previous model version
   */
  async rollbackModel(modelVersionId: number, reason: string): Promise<{ message: string }> {
    const response = await this.client.post('/api/xai-qc/custom-defects/models/rollback', {
      model_version_id: modelVersionId,
      reason,
    });
    return response.data;
  }

  // ==================== Datasets ====================

  /**
   * Get all training datasets
   */
  async getTrainingDatasets(): Promise<TrainingDataset[]> {
    const response = await this.client.get('/api/xai-qc/custom-defects/datasets');
    return response.data;
  }

  /**
   * Get a single training dataset by ID
   */
  async getTrainingDataset(id: number): Promise<TrainingDataset> {
    const response = await this.client.get(`/api/xai-qc/custom-defects/datasets/${id}`);
    return response.data;
  }

  /**
   * Create a new training dataset snapshot
   */
  async createTrainingDataset(name: string): Promise<TrainingDataset> {
    const response = await this.client.post('/api/xai-qc/custom-defects/datasets', { name });
    return response.data;
  }

  // ==================== Statistics ====================

  /**
   * Get statistics about custom defect types
   */
  async getStatistics(): Promise<DefectStatistics> {
    const response = await this.client.get('/api/xai-qc/custom-defects/stats/summary');
    return response.data;
  }
}

// Singleton instance
export const customDefectsAPI = new CustomDefectsAPI();
