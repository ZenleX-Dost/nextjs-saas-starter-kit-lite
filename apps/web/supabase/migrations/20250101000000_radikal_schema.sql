/*
 * -------------------------------------------------------
 * RadiKal XAI Quality Control Schema
 * This migration adds all RadiKal-specific tables to Supabase
 * -------------------------------------------------------
 */

-- Create analyses table
CREATE TABLE IF NOT EXISTS public.analyses (
    id VARCHAR(255) PRIMARY KEY,
    image_name VARCHAR(500) NOT NULL,
    image_path VARCHAR(1000) NOT NULL,
    predicted_class VARCHAR(100) NOT NULL,
    confidence FLOAT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES auth.users(id),
    account_id UUID REFERENCES public.accounts(id)
);

COMMENT ON TABLE public.analyses IS 'Stores radiographic image analysis results';

-- Create detections table
CREATE TABLE IF NOT EXISTS public.detections (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(255) NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    defect_type VARCHAR(100) NOT NULL,
    confidence FLOAT NOT NULL,
    bbox_x1 FLOAT,
    bbox_y1 FLOAT,
    bbox_x2 FLOAT,
    bbox_y2 FLOAT,
    severity VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.detections IS 'Individual defect detections within analyses';

-- Create explanations table
CREATE TABLE IF NOT EXISTS public.explanations (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(255) NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL,
    heatmap_path VARCHAR(1000),
    feature_importance JSONB,
    confidence_breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.explanations IS 'XAI explanations for analysis results';

-- Create system_metrics table
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metric_type VARCHAR(100) NOT NULL,
    value FLOAT NOT NULL,
    metadata JSONB
);

COMMENT ON TABLE public.system_metrics IS 'System performance and accuracy metrics';

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(255) NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    corrected_class VARCHAR(100),
    corrected_confidence FLOAT
);

COMMENT ON TABLE public.reviews IS 'Human review queue for AI predictions';

-- Create review_annotations table
CREATE TABLE IF NOT EXISTS public.review_annotations (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    annotation_type VARCHAR(50) NOT NULL,
    coordinates JSONB,
    label VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.review_annotations IS 'Annotations added during review process';

-- Create compliance_certificates table
CREATE TABLE IF NOT EXISTS public.compliance_certificates (
    id SERIAL PRIMARY KEY,
    analysis_id VARCHAR(255) NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    standard VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    pdf_path VARCHAR(1000),
    metadata JSONB
);

COMMENT ON TABLE public.compliance_certificates IS 'Compliance certification documents';

-- Create operator_performance table
CREATE TABLE IF NOT EXISTS public.operator_performance (
    id SERIAL PRIMARY KEY,
    operator_id UUID NOT NULL REFERENCES auth.users(id),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_analyses INTEGER DEFAULT 0,
    accuracy_rate FLOAT,
    avg_processing_time FLOAT,
    defects_found INTEGER DEFAULT 0,
    false_positives INTEGER DEFAULT 0,
    false_negatives INTEGER DEFAULT 0
);

COMMENT ON TABLE public.operator_performance IS 'Operator performance tracking';

-- Create custom_defect_types table
CREATE TABLE IF NOT EXISTS public.custom_defect_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    target_sample_count INTEGER DEFAULT 100,
    current_sample_count INTEGER DEFAULT 0,
    requires_retraining BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    account_id UUID REFERENCES public.accounts(id)
);

COMMENT ON TABLE public.custom_defect_types IS 'User-defined custom defect categories';

-- Create training_samples table
CREATE TABLE IF NOT EXISTS public.training_samples (
    id SERIAL PRIMARY KEY,
    defect_type_id INTEGER NOT NULL REFERENCES public.custom_defect_types(id) ON DELETE CASCADE,
    image_path VARCHAR(1000) NOT NULL,
    image_name VARCHAR(500) NOT NULL,
    bbox_x FLOAT,
    bbox_y FLOAT,
    bbox_width FLOAT,
    bbox_height FLOAT,
    is_augmented BOOLEAN DEFAULT FALSE,
    source VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE public.training_samples IS 'Labeled training data for custom defects';

-- Create model_versions table
CREATE TABLE IF NOT EXISTS public.model_versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    defect_type_id INTEGER NOT NULL REFERENCES public.custom_defect_types(id) ON DELETE CASCADE,
    model_path VARCHAR(1000) NOT NULL,
    accuracy FLOAT,
    precision_score FLOAT,
    recall FLOAT,
    f1_score FLOAT,
    training_samples_count INTEGER,
    validation_samples_count INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.model_versions IS 'Trained model versions with metrics';

-- Create training_datasets table
CREATE TABLE IF NOT EXISTS public.training_datasets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    defect_type_id INTEGER NOT NULL REFERENCES public.custom_defect_types(id) ON DELETE CASCADE,
    split_ratio FLOAT DEFAULT 0.8,
    train_count INTEGER DEFAULT 0,
    val_count INTEGER DEFAULT 0,
    test_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.training_datasets IS 'Dataset splits for training';

-- Create training_jobs table
CREATE TABLE IF NOT EXISTS public.training_jobs (
    id SERIAL PRIMARY KEY,
    defect_type_id INTEGER NOT NULL REFERENCES public.custom_defect_types(id) ON DELETE CASCADE,
    dataset_id INTEGER NOT NULL REFERENCES public.training_datasets(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    progress FLOAT DEFAULT 0.0,
    current_epoch INTEGER DEFAULT 0,
    total_epochs INTEGER DEFAULT 50,
    current_loss FLOAT,
    best_accuracy FLOAT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    config JSONB
);

COMMENT ON TABLE public.training_jobs IS 'Training job tracking and progress';

-- Create active_learning_queue table
CREATE TABLE IF NOT EXISTS public.active_learning_queue (
    id SERIAL PRIMARY KEY,
    defect_type_id INTEGER NOT NULL REFERENCES public.custom_defect_types(id) ON DELETE CASCADE,
    image_path VARCHAR(1000) NOT NULL,
    image_name VARCHAR(500) NOT NULL,
    prediction VARCHAR(100),
    confidence FLOAT,
    uncertainty_score FLOAT,
    diversity_score FLOAT,
    priority_score FLOAT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE public.active_learning_queue IS 'Active learning suggestions for labeling';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_account_id ON public.analyses(account_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_detections_analysis_id ON public.detections(analysis_id);
CREATE INDEX IF NOT EXISTS idx_explanations_analysis_id ON public.explanations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_reviews_analysis_id ON public.reviews(analysis_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_annotations_review_id ON public.review_annotations(review_id);
CREATE INDEX IF NOT EXISTS idx_custom_defects_account_id ON public.custom_defect_types(account_id);
CREATE INDEX IF NOT EXISTS idx_training_samples_defect_type ON public.training_samples(defect_type_id);
CREATE INDEX IF NOT EXISTS idx_model_versions_defect_type ON public.model_versions(defect_type_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_defect_type ON public.training_jobs(defect_type_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON public.training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_active_learning_defect_type ON public.active_learning_queue(defect_type_id);
CREATE INDEX IF NOT EXISTS idx_active_learning_status ON public.active_learning_queue(status);

-- Enable RLS on RadiKal tables
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_defect_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_learning_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analyses
CREATE POLICY analyses_select_policy ON public.analyses
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        account_id IN (
            SELECT account_id FROM public.accounts WHERE id = auth.uid()
        )
    );

CREATE POLICY analyses_insert_policy ON public.analyses
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY analyses_update_policy ON public.analyses
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for custom_defect_types
CREATE POLICY custom_defects_select_policy ON public.custom_defect_types
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid() OR
        account_id IN (
            SELECT account_id FROM public.accounts WHERE id = auth.uid()
        )
    );

CREATE POLICY custom_defects_insert_policy ON public.custom_defect_types
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY custom_defects_update_policy ON public.custom_defect_types
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY custom_defects_delete_policy ON public.custom_defect_types
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Service role has full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
