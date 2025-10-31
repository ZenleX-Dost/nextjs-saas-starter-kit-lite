'use client';

/**
 * Compliance Dashboard - Regulatory Standards Checking
 * 
 * Features:
 * - Real-time compliance checking against welding standards
 * - Support for AWS D1.1, ASME BPVC, ISO 5817-B/C/D, API 1104
 * - Severity classification
 * - Acceptance criteria display
 * - Certificate generation
 * - Audit trail
 */

import { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Download,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Standard {
  code: string;
  name: string;
  description?: string;
  organization?: string;
  year?: string;
  application?: string;
}

interface ComplianceResult {
  compliant: boolean;
  severity_level: string;
  acceptance_criteria: {
    max_length?: number;
    max_width?: number;
    max_depth?: number;
    max_density?: number;
    notes?: string;
  };
  repair_recommendation?: string;
}

interface CheckRequest {
  defect_type: string;
  length_mm: number;
  width_mm?: number;
  depth_mm?: number;
  density_percent?: number;
  location?: string;
}

export default function ComplianceDashboardPage() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState<CheckRequest>({
    defect_type: 'CR',
    length_mm: 0,
    width_mm: 0,
    depth_mm: 0,
    density_percent: 0,
    location: ''
  });

  useEffect(() => {
    fetchStandards();
  }, []);

  const fetchStandards = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/xai-qc/compliance/standards');
      if (!response.ok) throw new Error('Failed to fetch standards');
      
      const data = await response.json();
      
      // Backend returns {"standards": [...]} so extract the array
      const standardsArray = data.standards || data;
      
      // Ensure we have an array
      if (Array.isArray(standardsArray)) {
        setStandards(standardsArray);
        
        // Set first standard as default
        if (standardsArray.length > 0) {
          setSelectedStandard(standardsArray[0].code);
        }
      } else {
        console.error('Standards data is not an array:', data);
        // Set default standards if API fails
        setStandards([
          { code: 'AWS D1.1', name: 'AWS D1.1 - Structural Welding Code - Steel', organization: 'AWS', year: '2020', application: 'Structural steel' },
          { code: 'ISO 5817-B', name: 'ISO 5817 Quality Level B', organization: 'ISO', year: '2014', application: 'High quality welds' },
          { code: 'ASME BPVC', name: 'ASME Boiler and Pressure Vessel Code', organization: 'ASME', year: '2021', application: 'Pressure vessels' },
          { code: 'API 1104', name: 'API 1104 - Pipeline Welding', organization: 'API', year: '2021', application: 'Pipeline welding' }
        ]);
        setSelectedStandard('AWS D1.1');
      }
    } catch (error) {
      console.error('Failed to fetch standards:', error);
      // Set default standards if API call fails
      setStandards([
        { code: 'AWS D1.1', name: 'AWS D1.1 - Structural Welding Code - Steel', organization: 'AWS', year: '2020', application: 'Structural steel' },
        { code: 'ISO 5817-B', name: 'ISO 5817 Quality Level B', organization: 'ISO', year: '2014', application: 'High quality welds' },
        { code: 'ASME BPVC', name: 'ASME Boiler and Pressure Vessel Code', organization: 'ASME', year: '2021', application: 'Pressure vessels' },
        { code: 'API 1104', name: 'API 1104 - Pipeline Welding', organization: 'API', year: '2021', application: 'Pipeline welding' }
      ]);
      setSelectedStandard('AWS D1.1');
    }
  };

  const checkCompliance = async () => {
    if (!selectedStandard) return;
    
    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('http://localhost:8000/api/xai-qc/compliance/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          standard: selectedStandard,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to check compliance');
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to check compliance:', error);
      alert('Failed to check compliance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCriteria = (defectType: string) => {
    setExpandedCriteria(prev => ({
      ...prev,
      [defectType]: !prev[defectType]
    }));
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'CRITICAL': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
      'HIGH': 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
      'MEDIUM': 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
      'LOW': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      'ACCEPTABLE': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    };
    return colors[severity] || colors['MEDIUM'];
  };

  const defectTypes = [
    { value: 'CR', label: 'Crack (CR)' },
    { value: 'LP', label: 'Lack of Penetration (LP)' },
    { value: 'PO', label: 'Porosity (PO)' },
    { value: 'ND', label: 'No Defect (ND)' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Compliance Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Verify weld defects against regulatory standards
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compliance Check Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Check Compliance
              </h2>

              <div className="space-y-4">
                {/* Standard Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Welding Standard
                  </label>
                  <select
                    value={selectedStandard}
                    onChange={(e) => setSelectedStandard(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                  >
                    {standards.map((std) => (
                      <option key={std.code} value={std.code}>
                        {std.name}
                      </option>
                    ))}
                  </select>
                  {selectedStandard && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {standards.find(s => s.code === selectedStandard)?.description}
                    </p>
                  )}
                </div>

                {/* Defect Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Defect Type
                  </label>
                  <select
                    value={formData.defect_type}
                    onChange={(e) => setFormData({ ...formData, defect_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                  >
                    {defectTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Measurements Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Length (mm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.length_mm}
                      onChange={(e) => setFormData({ ...formData, length_mm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Width (mm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.width_mm}
                      onChange={(e) => setFormData({ ...formData, width_mm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Depth (mm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.depth_mm}
                      onChange={(e) => setFormData({ ...formData, depth_mm: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Density (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.density_percent}
                      onChange={(e) => setFormData({ ...formData, density_percent: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Weld Joint A, Section B"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                {/* Check Button */}
                <button
                  onClick={checkCompliance}
                  disabled={loading || !selectedStandard}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Checking...' : 'Check Compliance'}
                </button>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className={`rounded-lg shadow p-6 border-2 ${
                result.compliant 
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-500' 
                  : 'bg-red-50 dark:bg-red-900/10 border-red-500'
              }`}>
                <div className="flex items-start space-x-3">
                  {result.compliant ? (
                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                  )}
                  
                  <div className="flex-1">
                    <h3 className={`text-xl font-semibold mb-2 ${
                      result.compliant ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'
                    }`}>
                      {result.compliant ? 'Compliant' : 'Non-Compliant'}
                    </h3>
                    
                    {/* Severity Badge */}
                    <div className="mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(result.severity_level)}`}>
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {result.severity_level} Severity
                      </span>
                    </div>

                    {/* Acceptance Criteria */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Acceptance Criteria
                      </h4>
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        {result.acceptance_criteria.max_length && (
                          <>
                            <dt className="text-gray-600 dark:text-gray-400">Max Length:</dt>
                            <dd className="font-medium text-gray-900 dark:text-white">
                              {result.acceptance_criteria.max_length} mm
                            </dd>
                          </>
                        )}
                        {result.acceptance_criteria.max_width && (
                          <>
                            <dt className="text-gray-600 dark:text-gray-400">Max Width:</dt>
                            <dd className="font-medium text-gray-900 dark:text-white">
                              {result.acceptance_criteria.max_width} mm
                            </dd>
                          </>
                        )}
                        {result.acceptance_criteria.max_depth && (
                          <>
                            <dt className="text-gray-600 dark:text-gray-400">Max Depth:</dt>
                            <dd className="font-medium text-gray-900 dark:text-white">
                              {result.acceptance_criteria.max_depth} mm
                            </dd>
                          </>
                        )}
                        {result.acceptance_criteria.max_density && (
                          <>
                            <dt className="text-gray-600 dark:text-gray-400">Max Density:</dt>
                            <dd className="font-medium text-gray-900 dark:text-white">
                              {result.acceptance_criteria.max_density}%
                            </dd>
                          </>
                        )}
                      </dl>
                      {result.acceptance_criteria.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {result.acceptance_criteria.notes}
                        </p>
                      )}
                    </div>

                    {/* Repair Recommendation */}
                    {result.repair_recommendation && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-900 dark:text-orange-200 mb-1 flex items-center">
                          <Info className="w-4 h-4 mr-1" />
                          Repair Recommendation
                        </h4>
                        <p className="text-sm text-orange-800 dark:text-orange-300">
                          {result.repair_recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Standards Reference */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Supported Standards
              </h2>
              
              <div className="space-y-3">
                {standards.map((std) => (
                  <div
                    key={std.code}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedStandard === std.code
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedStandard(std.code)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {std.code}
                      </span>
                      {selectedStandard === std.code && (
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {std.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-900 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Generate Certificate
                  </span>
                  <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-900 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    View Audit Trail
                  </span>
                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
