/**
 * TypeScript types for Custom Defect Types feature
 */

export interface CustomDefectType {
  id: number;
  name: string;
  code: string;
  description?: string;
  severity_default: 'low' | 'medium' | 'high' | 'critical';
  expected_features?: Record<string, any>;
  color?: string;
  is_active: boolean;
  requires_retraining: boolean;
  min_samples_required: number;
  current_sample_count: number;
  compliance_standards?: string[];
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface CustomDefectTypeCreate {
  name: string;
  code: string;
  description?: string;
  severity_default: 'low' | 'medium' | 'high' | 'critical';
  expected_features?: Record<string, any>;
  color?: string;
  min_samples_required?: number;
  compliance_standards?: string[];
}

export interface CustomDefectTypeUpdate {
  name?: string;
  code?: string;
  description?: string;
  severity_default?: 'low' | 'medium' | 'high' | 'critical';
  expected_features?: Record<string, any>;
  color?: string;
  is_active?: boolean;
  min_samples_required?: number;
  compliance_standards?: string[];
}

export interface TrainingSample {
  id: number;
  defect_type_id: number;
  image_path: string;
  image_id?: string;
  annotations?: Record<string, any>;
  annotation_format: string;
  source: 'manual' | 'review' | 'active_learning';
  quality_score?: number;
  used_in_training: boolean;
  training_set?: 'train' | 'val' | 'test';
  labeled_by?: number;
  verified_by?: number;
  created_at: string;
}

export interface ModelVersion {
  id: number;
  version_number: string;
  model_name: string;
  model_path: string;
  base_model: string;
  training_dataset_id?: number;
  classes: string[];
  num_classes: number;
  custom_classes?: string[];
  is_active: boolean;
  deployment_status: 'training' | 'validating' | 'deployed' | 'archived' | 'failed';
  precision?: number;
  recall?: number;
  f1_score?: number;
  confusion_matrix?: number[][];
  created_at: string;
  deployed_at?: string;
  archived_at?: string;
  created_by?: number;
}

export interface TrainingJob {
  id: number;
  model_version_id: number;
  job_type: 'initial' | 'retraining' | 'fine_tuning';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress_percent: number;
  current_epoch?: number;
  total_epochs?: number;
  latest_train_loss?: number;
  latest_val_loss?: number;
  latest_accuracy?: number;
  training_history?: Array<{
    epoch: number;
    train_loss: number;
    val_loss: number;
    accuracy: number;
  }>;
  gpu_utilization_percent?: number;
  memory_usage_gb?: number;
  error_message?: string;
  error_traceback?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface TrainingDataset {
  id: number;
  name: string;
  dataset_path: string;
  total_images: number;
  train_images: number;
  val_images: number;
  test_images: number;
  class_distribution: Record<string, number>;
  includes_custom_types: boolean;
  custom_types_included?: number[];
  created_at: string;
  created_by?: number;
}

export interface DefectStatistics {
  total_custom_types: number;
  active_custom_types: number;
  total_training_samples: number;
  avg_samples_per_type: number;
  types_needing_samples: number;
  types_ready_for_training: number;
}
