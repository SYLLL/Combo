import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Figma, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  ExternalLink,
  Loader2
} from 'lucide-react';
import FigmaService, { FigmaComplianceReport, FigmaComplianceViolation } from '@/lib/figma';

interface FigmaIntegrationProps {
  onComplianceReport?: (report: FigmaComplianceReport) => void;
}

export const FigmaIntegration: React.FC<FigmaIntegrationProps> = ({ onComplianceReport }) => {
  const [figmaToken, setFigmaToken] = useState('');
  const [fileId, setFileId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [complianceReport, setComplianceReport] = useState<FigmaComplianceReport | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(true);

  const extractFileIdFromUrl = (url: string): string => {
    const match = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
    return match ? match[1] : '';
  };

  const handleAnalyze = async () => {
    if (!figmaToken.trim()) {
      setError('Please enter your Figma access token');
      return;
    }

    if (!fileId.trim()) {
      setError('Please enter a Figma file ID or URL');
      return;
    }

    setLoading(true);
    setError('');
    setComplianceReport(null);

    try {
      const extractedFileId = extractFileIdFromUrl(fileId) || fileId;
      
      console.log('Analyzing Figma file:', extractedFileId);
      
      // Use server-side analysis
      const response = await fetch('/api/figma/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          figmaToken,
          fileId: extractedFileId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      setComplianceReport(data.report);
      onComplianceReport?.(data.report);
      setShowTokenInput(false);
    } catch (err: any) {
      console.error('Figma analysis error:', err);
      setError(err.message || 'Failed to analyze Figma file');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accessibility': return '♿';
      case 'design_system': return '🎨';
      case 'brand_guidelines': return '🏷️';
      case 'legal': return '⚖️';
      case 'technical': return '⚙️';
      default: return '📋';
    }
  };

  const openFigmaFile = () => {
    if (complianceReport) {
      const extractedFileId = extractFileIdFromUrl(fileId) || fileId;
      window.open(`https://www.figma.com/file/${extractedFileId}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Figma className="h-5 w-5" />
            Figma Design Compliance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showTokenInput && (
            <div className="space-y-4">
              <div>
                <label htmlFor="figma-token" className="text-sm font-medium text-foreground mb-2 block">
                  Figma Access Token
                </label>
                <Input
                  id="figma-token"
                  type="password"
                  value={figmaToken}
                  onChange={(e) => setFigmaToken(e.target.value)}
                  placeholder="Enter your Figma personal access token"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get your token from{' '}
                  <a 
                    href="https://www.figma.com/developers/api#access-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Figma Developer Settings
                  </a>
                </p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="figma-file" className="text-sm font-medium text-foreground mb-2 block">
              Figma File ID or URL
            </label>
            <Input
              id="figma-file"
              value={fileId}
              onChange={(e) => setFileId(e.target.value)}
              placeholder="Enter Figma file ID or paste file URL"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Example: https://www.figma.com/file/ABC123DEF456/My-Design-File
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={loading || !figmaToken.trim() || !fileId.trim()}
            className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Design Compliance...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Analyze Figma File
              </div>
            )}
          </Button>

          {showTokenInput && (
            <Button
              variant="outline"
              onClick={() => setShowTokenInput(false)}
              className="w-full"
            >
              I already have a token configured
            </Button>
          )}
        </CardContent>
      </Card>

      {complianceReport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Compliance Analysis Results
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={openFigmaFile}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in Figma
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {complianceReport.summary.totalViolations}
                </div>
                <div className="text-sm text-gray-600">Total Issues</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {complianceReport.summary.criticalCount}
                </div>
                <div className="text-sm text-red-600">Critical</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {complianceReport.summary.highCount}
                </div>
                <div className="text-sm text-orange-600">High</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {complianceReport.summary.mediumCount}
                </div>
                <div className="text-sm text-yellow-600">Medium</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {complianceReport.summary.lowCount}
                </div>
                <div className="text-sm text-blue-600">Low</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">
                  {complianceReport.summary.accessibilityIssues}
                </div>
                <div className="text-xs text-blue-600">♿ Accessibility</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-600">
                  {complianceReport.summary.designSystemIssues}
                </div>
                <div className="text-xs text-purple-600">🎨 Design System</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">
                  {complianceReport.summary.brandGuidelineIssues}
                </div>
                <div className="text-xs text-green-600">🏷️ Brand</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-semibold text-red-600">
                  {complianceReport.summary.legalIssues}
                </div>
                <div className="text-xs text-red-600">⚖️ Legal</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-600">
                  {complianceReport.summary.technicalIssues}
                </div>
                <div className="text-xs text-gray-600">⚙️ Technical</div>
              </div>
            </div>

            {/* Violations List */}
            {complianceReport.violations.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Detailed Violations</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {complianceReport.violations.map((violation, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(violation.type)}</span>
                          <span className="font-medium">{violation.element}</span>
                        </div>
                        <Badge className={getSeverityColor(violation.severity)}>
                          {violation.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{violation.description}</p>
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        <p className="text-sm font-medium text-blue-800 mb-1">Recommendation:</p>
                        <p className="text-sm text-blue-700">{violation.recommendation}</p>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Rule: {violation.rule} | Node ID: {violation.figmaNodeId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-600 mb-2">No Violations Found!</h3>
                <p className="text-gray-600">Your Figma design meets all compliance requirements.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FigmaIntegration;
