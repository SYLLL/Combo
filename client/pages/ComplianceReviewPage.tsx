import { useState, useCallback } from "react";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info,
  Github,
  Scale,
  Figma,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface AnalysisResult {
  status: "pending" | "good" | "questions" | "issues";
  message: string;
  details?: string[];
}

interface SchemaData {
  email: {
    type: string;
    format: string;
  };
  notes: string[];
  suggestions: string[];
  mitigations: string[];
}

interface LegalReview {
  facts: string[];
  notes: string[];
  suggestions: string[];
  mitigations: string[];
}

export default function ComplianceReviewPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [productDescription, setProductDescription] = useState(
    "Adding a daily mode toggle to user profile",
  );
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [githubSearchResults, setGithubSearchResults] = useState<string | null>(null);
  const [codeSnippets, setCodeSnippets] = useState<any[] | null>(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [githubUrlError, setGithubUrlError] = useState('');
  const [settlementFiles, setSettlementFiles] = useState<File[]>([]);
  const [settlementDragActive, setSettlementDragActive] = useState(false);
  const [isUploadingSettlements, setIsUploadingSettlements] = useState(false);
  const [settlementUploadStatus, setSettlementUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaUrlError, setFigmaUrlError] = useState('');
  const [figmaToken, setFigmaToken] = useState('');
  const [figmaAnalysis, setFigmaAnalysis] = useState(null);
  const [isAnalyzingFigma, setIsAnalyzingFigma] = useState(false);
  const [complianceAnalysis, setComplianceAnalysis] = useState(null);
  const [dataFlowAnalysis, setDataFlowAnalysis] = useState(null);
  const [isAnalyzingDataFlow, setIsAnalyzingDataFlow] = useState(false);
  const [enhancedLegalReview, setEnhancedLegalReview] = useState(null);
  const [riskTable, setRiskTable] = useState(null);
  const [editableSchema, setEditableSchema] = useState(`{
  "email": {
    "type": "string",
    "format": "email"
  }
}`);

  // Mock data matching the reference image
  const [analysis] = useState<AnalysisResult>({
    status: "good",
    message: "Good to proceed with the proposed changes",
    details: ["Age-gating changes"],
  });

  const [schemaData] = useState<SchemaData>({
    email: {
      type: "string",
      format: "email",
    },
    notes: ["Is sensitive user_data being stored?"],
    suggestions: ["Beta of the feed (e.g. store email domain only)"],
    mitigations: ["Age-gate for users aged 13 and over"],
  });

  const [legalReview] = useState<LegalReview>({
    facts: [
      "New feature launches email collection page",
      "Asks users to input email address",
    ],
    notes: ["Is sensitive user_data being stored?"],
    suggestions: ["Beta of the feed (e.g. store email domain only)"],
    mitigations: [
      "Age-gate for for user_aged 13 and over",
      "Enable the feature by default but prompt for age verification",
    ],
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const validateGitHubUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty URL is valid (optional field)
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').length >= 3;
    } catch {
      return false;
    }
  };

  const handleGithubUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setGithubUrl(url);
    
    if (url.trim() && !validateGitHubUrl(url)) {
      setGithubUrlError('Please enter a valid GitHub repository URL');
    } else {
      setGithubUrlError('');
    }
  };

  const validateFigmaUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty URL is valid (optional field)
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'www.figma.com' || urlObj.hostname === 'figma.com';
    } catch {
      return false;
    }
  };

  const handleFigmaUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFigmaUrl(url);
    
    if (url.trim() && !validateFigmaUrl(url)) {
      setFigmaUrlError('Please enter a valid Figma URL');
    } else {
      setFigmaUrlError('');
    }
  };

  const handleFigmaAnalysis = async () => {
    if (!figmaUrl.trim() || !figmaToken.trim()) {
      return;
    }

    setIsAnalyzingFigma(true);
    setFigmaAnalysis(null);

    try {
      // Extract file ID from URL
      const fileIdMatch = figmaUrl.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;

      if (!fileId) {
        throw new Error('Invalid Figma file URL');
      }

      console.log('Analyzing Figma file:', fileId);

      // Call the Figma analysis API
      const response = await fetch('/api/figma/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          figmaToken,
          fileId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      setFigmaAnalysis(data.report);
      console.log('Figma analysis completed:', data.report);
      
      // Store Figma analysis in localStorage for use in legal brief generation
      localStorage.setItem('figmaAnalysis', JSON.stringify(data.report));
      
    } catch (error: any) {
      console.error('Figma analysis error:', error);
      setUploadStatus({
        type: 'error',
        message: `Figma analysis failed: ${error.message}`,
      });
    } finally {
      setIsAnalyzingFigma(false);
    }
  };

  const generateLegalBriefPDF = async () => {
    console.log('Generate PDF button clicked from Index page!');
    console.log('Current complianceAnalysis:', complianceAnalysis);
    
    if (!complianceAnalysis) {
      alert('Please generate a legal review first before downloading the brief.\n\nTo generate a legal review:\n1. Upload a requirements document\n2. Click "Generate Legal Review"');
      return;
    }

    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      let yPosition = margin;

      // Title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Product Legal Brief', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Regulations Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. Regulations', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // COPPA
      pdf.setFont('helvetica', 'bold');
      pdf.text('COPPA (Children\'s Online Privacy Protection Act):', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Status: ${complianceAnalysis.coppa?.compliance || 'Unknown'}`, margin + 5, yPosition);
      yPosition += 5;
      
      if (complianceAnalysis.coppa?.issues?.length > 0) {
        pdf.text('Issues:', margin + 5, yPosition);
        yPosition += 5;
        complianceAnalysis.coppa.issues.forEach((issue: string) => {
          pdf.text(`• ${issue}`, margin + 10, yPosition);
          yPosition += 5;
        });
      }

      if (complianceAnalysis.coppa?.recommendations?.length > 0) {
        pdf.text('Recommendations:', margin + 5, yPosition);
        yPosition += 5;
        complianceAnalysis.coppa.recommendations.forEach((rec: string) => {
          pdf.text(`• ${rec}`, margin + 10, yPosition);
          yPosition += 5;
        });
      }

      yPosition += 10;

      // HIPAA
      pdf.setFont('helvetica', 'bold');
      pdf.text('HIPAA (Health Insurance Portability and Accountability Act):', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Status: ${complianceAnalysis.hipaa?.compliance || 'Unknown'}`, margin + 5, yPosition);
      yPosition += 5;
      
      if (complianceAnalysis.hipaa?.issues?.length > 0) {
        pdf.text('Issues:', margin + 5, yPosition);
        yPosition += 5;
        complianceAnalysis.hipaa.issues.forEach((issue: string) => {
          pdf.text(`• ${issue}`, margin + 10, yPosition);
          yPosition += 5;
        });
      }

      if (complianceAnalysis.hipaa?.recommendations?.length > 0) {
        pdf.text('Recommendations:', margin + 5, yPosition);
        yPosition += 5;
        complianceAnalysis.hipaa.recommendations.forEach((rec: string) => {
          pdf.text(`• ${rec}`, margin + 10, yPosition);
          yPosition += 5;
        });
      }

      yPosition += 10;

      // GDPR
      pdf.setFont('helvetica', 'bold');
      pdf.text('GDPR (General Data Protection Regulation):', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Status: ${complianceAnalysis.gdpr?.compliance || 'Unknown'}`, margin + 5, yPosition);
      yPosition += 5;
      
      if (complianceAnalysis.gdpr?.issues?.length > 0) {
        pdf.text('Issues:', margin + 5, yPosition);
        yPosition += 5;
        complianceAnalysis.gdpr.issues.forEach((issue: string) => {
          pdf.text(`• ${issue}`, margin + 10, yPosition);
          yPosition += 5;
        });
      }

      if (complianceAnalysis.gdpr?.recommendations?.length > 0) {
        pdf.text('Recommendations:', margin + 5, yPosition);
        yPosition += 5;
        complianceAnalysis.gdpr.recommendations.forEach((rec: string) => {
          pdf.text(`• ${rec}`, margin + 10, yPosition);
          yPosition += 5;
        });
      }

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Policies Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. Policies', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Privacy Policy
      pdf.setFont('helvetica', 'bold');
      pdf.text('Privacy Policy:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• Data collection practices and user consent mechanisms', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Data processing purposes and legal basis', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• User rights and data subject access procedures', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Third-party data sharing and international transfers', margin + 5, yPosition);
      yPosition += 8;

      // Terms of Service
      pdf.setFont('helvetica', 'bold');
      pdf.text('Terms of Service:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• User responsibilities and prohibited activities', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Service availability and liability limitations', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Intellectual property rights and content ownership', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Dispute resolution and governing law provisions', margin + 5, yPosition);
      yPosition += 10;

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Data Deletion Requirements Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('3. Data Deletion Requirements', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // GDPR Right to Erasure
      pdf.setFont('helvetica', 'bold');
      pdf.text('GDPR Right to Erasure (Article 17):', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• Users have the right to request deletion of their personal data', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Data must be deleted within 30 days of request', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Exceptions apply for legal obligations or legitimate interests', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Backup systems must also be purged of deleted data', margin + 5, yPosition);
      yPosition += 8;

      // COPPA Data Deletion
      pdf.setFont('helvetica', 'bold');
      pdf.text('COPPA Data Deletion Requirements:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• Parents can request deletion of child\'s personal information', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Must provide clear instructions for deletion requests', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Cannot require excessive verification for deletion requests', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Must delete data from all systems and third-party processors', margin + 5, yPosition);
      yPosition += 10;

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // AI Risk Assessment Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('4. AI Risk Assessment', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Algorithmic Bias
      pdf.setFont('helvetica', 'bold');
      pdf.text('Algorithmic Bias and Fairness:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• Risk Level: Medium - Requires ongoing monitoring', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Mitigation: Regular bias testing and diverse training data', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Legal Impact: Potential discrimination claims under civil rights laws', margin + 5, yPosition);
      yPosition += 8;

      // Data Privacy in AI
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data Privacy in AI Processing:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• Risk Level: High - AI systems process large amounts of personal data', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Mitigation: Data minimization, purpose limitation, and consent management', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Legal Impact: GDPR violations can result in fines up to 4% of revenue', margin + 5, yPosition);
      yPosition += 8;

      // Transparency and Explainability
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI Transparency and Explainability:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• Risk Level: Medium - Users have right to understand AI decisions', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Mitigation: Clear documentation and user-friendly explanations', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Legal Impact: GDPR Article 22 requires human oversight of automated decisions', margin + 5, yPosition);
      yPosition += 10;

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Login & Profile Mockup Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('5. Login & Profile Mockup', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Authentication Flow
      pdf.setFont('helvetica', 'bold');
      pdf.text('Authentication Flow Analysis:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• Secure login with email/password authentication', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Profile creation with display name and role assignment', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Session management with automatic timeout', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Secure sign-out with complete session termination', margin + 5, yPosition);
      yPosition += 8;

      // Data Collection Points
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data Collection Points:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• Email address (required for authentication)', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Display name (optional user preference)', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• User role (system-assigned: user/admin)', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Creation timestamp (system-generated)', margin + 5, yPosition);
      yPosition += 8;

      // Privacy Considerations
      pdf.setFont('helvetica', 'bold');
      pdf.text('Privacy Considerations:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• Minimal data collection principle applied', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• User consent obtained during registration', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Data stored securely with encryption', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• User can request data deletion at any time', margin + 5, yPosition);
      yPosition += 10;

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Data Flow Screenshot Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('6. Data Flow Screenshot', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Data Flow Description
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data Flow Analysis:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• User input data flows through secure authentication system', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Third-party integrations (Figma, GitHub) require separate authentication', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Analytics data collected for compliance monitoring', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• All data processing follows GDPR data minimization principles', margin + 5, yPosition);
      yPosition += 8;

      // Data Sources
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data Sources:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• User input data (forms, uploads, preferences)', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Third-party integrations (Figma API, GitHub API)', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Analytics data (usage patterns, compliance metrics)', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• System logs (authentication, errors, performance)', margin + 5, yPosition);
      yPosition += 8;

      // Data Processing
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data Processing:', margin, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text('• AI-powered compliance analysis using Gemini API', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Document parsing and text extraction', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• Figma design analysis for accessibility and legal compliance', margin + 5, yPosition);
      yPosition += 5;
      pdf.text('• GitHub repository scanning for code compliance', margin + 5, yPosition);
      yPosition += 10;

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Figma Design Analysis Section
      if (complianceAnalysis.figmaAnalysis) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('7. Figma Design Analysis', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // Summary
        pdf.setFont('helvetica', 'bold');
        pdf.text('Design Compliance Summary:', margin, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Violations: ${complianceAnalysis.figmaAnalysis.summary.totalViolations}`, margin + 5, yPosition);
        yPosition += 5;
        pdf.text(`Critical Issues: ${complianceAnalysis.figmaAnalysis.summary.criticalCount}`, margin + 5, yPosition);
        yPosition += 5;
        pdf.text(`High Priority Issues: ${complianceAnalysis.figmaAnalysis.summary.highCount}`, margin + 5, yPosition);
        yPosition += 5;
        pdf.text(`Medium Priority Issues: ${complianceAnalysis.figmaAnalysis.summary.mediumCount}`, margin + 5, yPosition);
        yPosition += 5;
        pdf.text(`Low Priority Issues: ${complianceAnalysis.figmaAnalysis.summary.lowCount}`, margin + 5, yPosition);
        yPosition += 8;

        // Violation Categories
        pdf.setFont('helvetica', 'bold');
        pdf.text('Violation Categories:', margin, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`• Accessibility Issues: ${complianceAnalysis.figmaAnalysis.summary.accessibilityIssues}`, margin + 5, yPosition);
        yPosition += 5;
        pdf.text(`• Legal Compliance Issues: ${complianceAnalysis.figmaAnalysis.summary.legalIssues}`, margin + 5, yPosition);
        yPosition += 5;
        pdf.text(`• Design System Issues: ${complianceAnalysis.figmaAnalysis.summary.designSystemIssues}`, margin + 5, yPosition);
        yPosition += 5;
        pdf.text(`• Brand Guidelines Issues: ${complianceAnalysis.figmaAnalysis.summary.brandGuidelineIssues}`, margin + 5, yPosition);
        yPosition += 5;
        pdf.text(`• Technical Issues: ${complianceAnalysis.figmaAnalysis.summary.technicalIssues}`, margin + 5, yPosition);
        yPosition += 8;

        // Legal Implications
        if (complianceAnalysis.figmaAnalysis.legalImplications) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Legal Implications:', margin, yPosition);
          yPosition += 6;
          pdf.setFont('helvetica', 'normal');
          const legalText = complianceAnalysis.figmaAnalysis.legalImplications;
          const splitText = pdf.splitTextToSize(legalText, contentWidth - 10);
          pdf.text(splitText, margin + 5, yPosition);
          yPosition += splitText.length * 5 + 5;
        }

        // Detailed Violations Analysis
        pdf.setFont('helvetica', 'bold');
        pdf.text('Detailed Violations Analysis:', margin, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');

        // Group violations by type
        const violationsByType = complianceAnalysis.figmaAnalysis.violations.reduce((acc: any, violation: any) => {
          if (!acc[violation.type]) {
            acc[violation.type] = [];
          }
          acc[violation.type].push(violation);
          return acc;
        }, {});

        Object.entries(violationsByType).forEach(([type, violations]: [string, any]) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 100) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFont('helvetica', 'bold');
          pdf.text(`${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} Violations (${violations.length}):`, margin + 5, yPosition);
          yPosition += 6;
          pdf.setFont('helvetica', 'normal');

          violations.forEach((violation: any, index: number) => {
            // Check if we need a new page for each violation
            if (yPosition > pageHeight - 60) {
              pdf.addPage();
              yPosition = margin;
            }

            pdf.setFont('helvetica', 'bold');
            pdf.text(`${index + 1}. ${violation.element} (${violation.severity.toUpperCase()})`, margin + 10, yPosition);
            yPosition += 5;
            pdf.setFont('helvetica', 'normal');
            
            pdf.text(`Issue: ${violation.description}`, margin + 15, yPosition);
            yPosition += 5;
            pdf.text(`Recommendation: ${violation.recommendation}`, margin + 15, yPosition);
            yPosition += 5;
            pdf.text(`Rule: ${violation.rule}`, margin + 15, yPosition);
            yPosition += 5;
            pdf.text(`Node ID: ${violation.figmaNodeId}`, margin + 15, yPosition);
            yPosition += 8;
          });
        });

        // Design Recommendations
        if (complianceAnalysis.figmaAnalysis.designRecommendations) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Design Recommendations:', margin, yPosition);
          yPosition += 6;
          pdf.setFont('helvetica', 'normal');

          if (complianceAnalysis.figmaAnalysis.designRecommendations.sections) {
            complianceAnalysis.figmaAnalysis.designRecommendations.sections.forEach((section: any) => {
              // Check if we need a new page
              if (yPosition > pageHeight - 80) {
                pdf.addPage();
                yPosition = margin;
              }

              pdf.setFont('helvetica', 'bold');
              pdf.text(`${section.category} (${section.priority} priority):`, margin + 5, yPosition);
              yPosition += 6;
              pdf.setFont('helvetica', 'normal');
              
              section.recommendations.forEach((rec: string) => {
                pdf.text(`• ${rec}`, margin + 10, yPosition);
                yPosition += 5;
              });
              
              if (section.legalRisk) {
                pdf.setFont('helvetica', 'italic');
                pdf.text(`Legal Risk: ${section.legalRisk}`, margin + 10, yPosition);
                yPosition += 5;
                pdf.setFont('helvetica', 'normal');
              }
              yPosition += 5;
            });
          }

          // Implementation Timeline
          if (complianceAnalysis.figmaAnalysis.designRecommendations.implementationTimeline) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Implementation Timeline:', margin, yPosition);
            yPosition += 6;
            pdf.setFont('helvetica', 'normal');
            const timelineText = complianceAnalysis.figmaAnalysis.designRecommendations.implementationTimeline;
            const splitTimeline = pdf.splitTextToSize(timelineText, contentWidth - 10);
            pdf.text(splitTimeline, margin + 5, yPosition);
            yPosition += splitTimeline.length * 5 + 5;
          }

          // Compliance Checklist
          if (complianceAnalysis.figmaAnalysis.designRecommendations.complianceChecklist) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Compliance Checklist:', margin, yPosition);
            yPosition += 6;
            pdf.setFont('helvetica', 'normal');
            complianceAnalysis.figmaAnalysis.designRecommendations.complianceChecklist.forEach((item: string) => {
              pdf.text(`• ${item}`, margin + 5, yPosition);
              yPosition += 5;
            });
          }
        }

        // Risk Assessment Summary
        pdf.setFont('helvetica', 'bold');
        pdf.text('Risk Assessment Summary:', margin, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');

        const criticalCount = complianceAnalysis.figmaAnalysis.summary.criticalCount;
        const highCount = complianceAnalysis.figmaAnalysis.summary.highCount;
        const totalViolations = complianceAnalysis.figmaAnalysis.summary.totalViolations;

        if (criticalCount > 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`🚨 CRITICAL RISK: ${criticalCount} critical violations require immediate attention`, margin + 5, yPosition);
          yPosition += 6;
          pdf.setFont('helvetica', 'normal');
          pdf.text('• These violations pose immediate legal and accessibility risks', margin + 10, yPosition);
          yPosition += 5;
          pdf.text('• May result in lawsuits, regulatory fines, or user exclusion', margin + 10, yPosition);
          yPosition += 5;
          pdf.text('• Must be addressed before product launch', margin + 10, yPosition);
          yPosition += 8;
        }

        if (highCount > 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`⚠️ HIGH RISK: ${highCount} high-priority violations need prompt resolution`, margin + 5, yPosition);
          yPosition += 6;
          pdf.setFont('helvetica', 'normal');
          pdf.text('• These violations may impact user experience and legal compliance', margin + 10, yPosition);
          yPosition += 5;
          pdf.text('• Should be addressed within 2 weeks', margin + 10, yPosition);
          yPosition += 5;
          pdf.text('• May require design system updates', margin + 10, yPosition);
          yPosition += 8;
        }

        if (totalViolations === 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('✅ LOW RISK: No design compliance violations detected', margin + 5, yPosition);
          yPosition += 6;
          pdf.setFont('helvetica', 'normal');
          pdf.text('• Design appears to meet accessibility and legal standards', margin + 10, yPosition);
          yPosition += 5;
          pdf.text('• Continue monitoring for future design changes', margin + 10, yPosition);
          yPosition += 8;
        }

        // Business Impact Analysis
        pdf.setFont('helvetica', 'bold');
        pdf.text('Business Impact Analysis:', margin, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');

        pdf.text('• Legal Liability: Design violations can result in ADA lawsuits and GDPR fines', margin + 5, yPosition);
        yPosition += 5;
        pdf.text('• User Experience: Accessibility issues exclude users with disabilities', margin + 5, yPosition);
        yPosition += 5;
        pdf.text('• Brand Reputation: Non-compliant designs damage brand credibility', margin + 5, yPosition);
        yPosition += 5;
        pdf.text('• Development Cost: Fixing violations post-launch is 10x more expensive', margin + 5, yPosition);
        yPosition += 5;
        pdf.text('• Market Access: Non-compliant products may be blocked in certain markets', margin + 5, yPosition);
        yPosition += 8;
      } else {
        // Fallback when no Figma analysis is available
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('No Figma design analysis was performed for this review.', margin, yPosition);
        yPosition += 10;
        pdf.text('To include design compliance analysis, please provide a Figma file URL and token during the upload process.', margin, yPosition);
        yPosition += 10;
      }

      // Footer
      yPosition = pageHeight - 20;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('This legal brief was generated automatically based on AI-powered compliance analysis.', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      pdf.text('Please consult with legal professionals for final compliance decisions.', pageWidth / 2, yPosition, { align: 'center' });

      // Save the PDF
      pdf.save('product-legal-brief.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Settlement file handlers
  const handleSettlementDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setSettlementDragActive(true);
    } else if (e.type === "dragleave") {
      setSettlementDragActive(false);
    }
  }, []);

  const handleSettlementDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSettlementDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type === 'application/pdf'
      );
      setSettlementFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleSettlementFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(file => 
        file.type === 'application/pdf'
      );
      setSettlementFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeSettlementFile = (index: number) => {
    setSettlementFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadSettlements = async () => {
    if (settlementFiles.length === 0) {
      return;
    }

    setIsUploadingSettlements(true);
    setSettlementUploadStatus({ type: null, message: '' });

    try {
      const formData = new FormData();
      settlementFiles.forEach((file, index) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload-settlements', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Settlement files uploaded successfully:', result);
        setSettlementUploadStatus({
          type: 'success',
          message: `${result.uploadedCount} settlement files uploaded successfully`
        });
        setSettlementFiles([]); // Clear the files after successful upload
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        console.error('Settlement upload failed:', errorData.message);
        setSettlementUploadStatus({
          type: 'error',
          message: errorData.message || 'Upload failed'
        });
      }
    } catch (error) {
      console.error('Error uploading settlement files:', error);
      setSettlementUploadStatus({
        type: 'error',
        message: 'Network error occurred while uploading settlement files'
      });
    } finally {
      setIsUploadingSettlements(false);
    }
  };


  const handleRequestLegalReview = async () => {
    if (!uploadedFile) {
      return;
    }

    if (githubUrlError || figmaUrlError) {
      setUploadStatus({
        type: 'error',
        message: 'Please fix the URL format before submitting'
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('productDescription', productDescription);
      if (githubUrl.trim()) {
        formData.append('githubUrl', githubUrl.trim());
      }
      if (figmaUrl.trim()) {
        formData.append('figmaUrl', figmaUrl.trim());
      }

      const response = await fetch('/api/upload-requirements', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('File uploaded successfully:', result);
        setUploadStatus({
          type: 'success',
          message: `File uploaded successfully: ${result.filename}`
        });
        
        // Store GitHub search results if available
        if (result.githubSearchResults) {
          setGithubSearchResults(result.githubSearchResults);
        }
        
        // Store code snippets if available
        if (result.codeSnippets) {
          setCodeSnippets(result.codeSnippets);
        }
        
        // Store compliance analysis if available
        if (result.complianceAnalysis) {
          // Merge figmaAnalysis into complianceAnalysis if it exists
          const mergedComplianceAnalysis = {
            ...result.complianceAnalysis,
            ...(result.figmaAnalysis && { figmaAnalysis: result.figmaAnalysis })
          };
          
          // Also check localStorage for Figma analysis from Index.tsx
          const storedFigmaAnalysis = localStorage.getItem('figmaAnalysis');
          if (storedFigmaAnalysis && !mergedComplianceAnalysis.figmaAnalysis) {
            try {
              const parsedFigmaAnalysis = JSON.parse(storedFigmaAnalysis);
              mergedComplianceAnalysis.figmaAnalysis = parsedFigmaAnalysis;
              console.log('Included Figma analysis from localStorage:', parsedFigmaAnalysis);
            } catch (error) {
              console.error('Error parsing stored Figma analysis:', error);
            }
          }
          
          setComplianceAnalysis(mergedComplianceAnalysis);
          console.log('Compliance analysis set:', mergedComplianceAnalysis);
          
          // Generate enhanced legal review with compliance assessments
          console.log('🔍 Compliance Analysis for Enhanced Review:', mergedComplianceAnalysis);
          const enhancedReview = generateEnhancedLegalReview(mergedComplianceAnalysis, productDescription, editableSchema);
          console.log('📋 Generated Enhanced Legal Review:', enhancedReview);
          setEnhancedLegalReview(enhancedReview);
          
          // Generate risk table
          const riskTableData = generateRiskTable(mergedComplianceAnalysis, result.codeSnippets || [], result.githubSearchResults || '');
          console.log('🚨 Generated Risk Table:', riskTableData);
          setRiskTable(riskTableData);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        console.error('Upload failed:', errorData.message);
        setUploadStatus({
          type: 'error',
          message: errorData.message || 'Upload failed'
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus({
        type: 'error',
        message: 'Network error occurred while uploading file'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const generateEnhancedLegalReview = (complianceAnalysis: any, productDescription: string, schemaJson: string) => {
    // Parse the schema
    let parsedSchema;
    try {
      parsedSchema = JSON.parse(schemaJson);
    } catch (error) {
      parsedSchema = { email: { type: "string", format: "email" } };
    }

    const facts = [];
    const notes = [];
    const suggestions = [];
    const mitigations = [];

    // COPPA Assessment
    if (complianceAnalysis?.coppa) {
      const coppaStatus = complianceAnalysis.coppa.compliance || 'Under Review';
      facts.push(`COPPA Compliance Assessment: ${coppaStatus}`);
      
      if (complianceAnalysis.coppa.issues && complianceAnalysis.coppa.issues.length > 0) {
        complianceAnalysis.coppa.issues.forEach((issue: string) => {
          notes.push(`COPPA Issue: ${issue}`);
        });
      }
      
      if (complianceAnalysis.coppa.recommendations && complianceAnalysis.coppa.recommendations.length > 0) {
        complianceAnalysis.coppa.recommendations.forEach((rec: string) => {
          suggestions.push(`COPPA: ${rec}`);
        });
      }
    }

    // HIPAA Assessment
    if (complianceAnalysis?.hipaa) {
      const hipaaStatus = complianceAnalysis.hipaa.compliance || 'Under Review';
      facts.push(`HIPAA Compliance Assessment: ${hipaaStatus}`);
      
      if (complianceAnalysis.hipaa.issues && complianceAnalysis.hipaa.issues.length > 0) {
        complianceAnalysis.hipaa.issues.forEach((issue: string) => {
          notes.push(`HIPAA Issue: ${issue}`);
        });
      }
      
      if (complianceAnalysis.hipaa.recommendations && complianceAnalysis.hipaa.recommendations.length > 0) {
        complianceAnalysis.hipaa.recommendations.forEach((rec: string) => {
          suggestions.push(`HIPAA: ${rec}`);
        });
      }
    }

    // GDPR Assessment
    if (complianceAnalysis?.gdpr) {
      const gdprStatus = complianceAnalysis.gdpr.compliance || 'Under Review';
      facts.push(`GDPR Compliance Assessment: ${gdprStatus}`);
      
      if (complianceAnalysis.gdpr.issues && complianceAnalysis.gdpr.issues.length > 0) {
        complianceAnalysis.gdpr.issues.forEach((issue: string) => {
          notes.push(`GDPR Issue: ${issue}`);
        });
      }
      
      if (complianceAnalysis.gdpr.recommendations && complianceAnalysis.gdpr.recommendations.length > 0) {
        complianceAnalysis.gdpr.recommendations.forEach((rec: string) => {
          suggestions.push(`GDPR: ${rec}`);
        });
      }
    }

    // AI Risk Assessment
    if (complianceAnalysis?.aiRisk) {
      facts.push(`AI Risk Assessment: ${complianceAnalysis.aiRisk.overallRisk || 'Medium'}`);
      facts.push(`AI bias risk: ${complianceAnalysis.aiRisk.biasRisk || 'Medium'}`);
      facts.push(`AI transparency: ${complianceAnalysis.aiRisk.transparencyLevel || 'Partial'}`);
      
      if (complianceAnalysis.aiRisk.recommendations) {
        complianceAnalysis.aiRisk.recommendations.forEach((rec: string) => {
          suggestions.push(`AI Risk: ${rec}`);
        });
      }
      
      if (complianceAnalysis.aiRisk.mitigations) {
        complianceAnalysis.aiRisk.mitigations.forEach((mit: string) => {
          mitigations.push(`AI: ${mit}`);
        });
      }
    } else {
      // Generate basic AI risk assessment based on product description
      const hasAIKeywords = /ai|artificial intelligence|machine learning|ml|algorithm|automated|bot/i.test(productDescription);
      if (hasAIKeywords) {
        facts.push('AI Risk Assessment: AI/ML components detected in product description');
        notes.push('AI Risk: Potential bias, transparency, and accountability concerns');
        suggestions.push('AI Risk: Implement AI governance framework and bias testing');
        mitigations.push('AI: Regular AI model auditing and human oversight required');
      }
    }

    // Schema-based assessments
    if (parsedSchema && typeof parsedSchema === 'object') {
      const hasEmail = parsedSchema.email || Object.keys(parsedSchema).some(key => key.toLowerCase().includes('email'));
      const hasPersonalData = Object.keys(parsedSchema).some(key => 
        key.toLowerCase().includes('name') || 
        key.toLowerCase().includes('phone') || 
        key.toLowerCase().includes('address')
      );

      if (hasEmail) {
        facts.push('Personal Data Collection: Email addresses identified in API schema');
        notes.push('Privacy Note: Email collection requires consent and data protection measures');
        suggestions.push('Privacy: Implement email validation and opt-in consent mechanisms');
        mitigations.push('Privacy: Encrypt email data and implement data retention policies');
      }

      if (hasPersonalData) {
        facts.push('Personal Data Collection: Additional personal information fields identified');
        notes.push('Privacy Note: Personal data processing requires GDPR/CCPA compliance');
        suggestions.push('Privacy: Implement comprehensive data protection measures');
        mitigations.push('Privacy: Regular privacy impact assessments and data minimization');
      }
    }

    // Product-specific facts
    facts.push(`Product Description: ${productDescription}`);
    facts.push(`Analysis Date: ${new Date().toLocaleDateString()}`);

    // General compliance notes
    notes.push('Compliance Note: Regular legal review recommended as product evolves');
    notes.push('Compliance Note: Consider jurisdiction-specific requirements based on user base');

    // General suggestions
    suggestions.push('General: Implement privacy by design principles');
    suggestions.push('General: Regular compliance training for development team');
    suggestions.push('General: Maintain comprehensive audit logs');

    // General mitigations
    mitigations.push('General: Implement comprehensive data protection framework');
    mitigations.push('General: Regular third-party security assessments');
    mitigations.push('General: User-friendly privacy controls and transparency');

    return {
      facts,
      notes,
      suggestions,
      mitigations,
      complianceSummary: {
        coppa: complianceAnalysis?.coppa?.compliance || 'Not assessed',
        hipaa: complianceAnalysis?.hipaa?.compliance || 'Not assessed',
        gdpr: complianceAnalysis?.gdpr?.compliance || 'Not assessed',
        aiRisk: complianceAnalysis?.aiRisk?.overallRisk || 'Not assessed'
      }
    };
  };

  const generateRiskTable = (complianceAnalysis: any, codeSnippets: any[], githubSearchResults: string) => {
    const risks = [];
    let riskIdCounter = 1;

    // Generate risks from COPPA compliance issues
    if (complianceAnalysis?.coppa?.issues) {
      complianceAnalysis.coppa.issues.forEach((issue: string, index: number) => {
        risks.push({
          risk_id: `COPPA-${riskIdCounter.toString().padStart(3, '0')}`,
          risk_status: 'OPEN',
          regulation: 'COPPA',
          severity: 'HIGH',
          description: issue,
          evidence: generateCodeEvidence(codeSnippets, githubSearchResults, 'COPPA', issue),
          recommendation: complianceAnalysis.coppa.recommendations?.[index] || 'Implement COPPA compliance measures'
        });
        riskIdCounter++;
      });
    }

    // Generate risks from HIPAA compliance issues
    if (complianceAnalysis?.hipaa?.issues) {
      complianceAnalysis.hipaa.issues.forEach((issue: string, index: number) => {
        risks.push({
          risk_id: `HIPAA-${riskIdCounter.toString().padStart(3, '0')}`,
          risk_status: 'OPEN',
          regulation: 'HIPAA',
          severity: 'HIGH',
          description: issue,
          evidence: generateCodeEvidence(codeSnippets, githubSearchResults, 'HIPAA', issue),
          recommendation: complianceAnalysis.hipaa.recommendations?.[index] || 'Implement HIPAA compliance measures'
        });
        riskIdCounter++;
      });
    }

    // Generate risks from GDPR compliance issues
    if (complianceAnalysis?.gdpr?.issues) {
      complianceAnalysis.gdpr.issues.forEach((issue: string, index: number) => {
        risks.push({
          risk_id: `GDPR-${riskIdCounter.toString().padStart(3, '0')}`,
          risk_status: 'OPEN',
          regulation: 'GDPR',
          severity: 'HIGH',
          description: issue,
          evidence: generateCodeEvidence(codeSnippets, githubSearchResults, 'GDPR', issue),
          recommendation: complianceAnalysis.gdpr.recommendations?.[index] || 'Implement GDPR compliance measures'
        });
        riskIdCounter++;
      });
    }

    // Generate risks from code snippets analysis
    if (codeSnippets && codeSnippets.length > 0) {
      codeSnippets.forEach((snippet: any, index: number) => {
        if (snippet.content) {
          risks.push({
            risk_id: `CODE-${riskIdCounter.toString().padStart(3, '0')}`,
            risk_status: 'OPEN',
            regulation: 'GENERAL',
            severity: 'MEDIUM',
            description: `Potential security issue in ${snippet.file || 'code file'}`,
            evidence: [
              {
                type: 'code_snippet',
                file: snippet.file || 'Unknown file',
                lines: snippet.lines || 'Unknown lines',
                content: snippet.content.substring(0, 200) + (snippet.content.length > 200 ? '...' : '')
              }
            ],
            recommendation: 'Review and secure the identified code section'
          });
          riskIdCounter++;
        }
      });
    }

    // Generate risks from GitHub search results
    if (githubSearchResults && githubSearchResults.length > 0) {
      const searchLines = githubSearchResults.split('\n').slice(0, 10); // Take first 10 lines
      if (searchLines.length > 0) {
        risks.push({
          risk_id: `GITHUB-${riskIdCounter.toString().padStart(3, '0')}`,
          risk_status: 'OPEN',
          regulation: 'GENERAL',
          severity: 'MEDIUM',
          description: 'Potential issues identified in GitHub repository analysis',
          evidence: [
            {
              type: 'repository_analysis',
              file: 'Repository Analysis',
              lines: 'Multiple files',
              content: searchLines.join('\n').substring(0, 300) + '...'
            }
          ],
          recommendation: 'Review repository for compliance and security issues'
        });
        riskIdCounter++;
      }
    }

    return {
      total_risks: risks.length,
      open_risks: risks.filter(r => r.risk_status === 'OPEN').length,
      resolved_risks: risks.filter(r => r.risk_status === 'RESOLVED').length,
      risks: risks
    };
  };

  const generateCodeEvidence = (codeSnippets: any[], githubSearchResults: string, regulation: string, issue: string) => {
    const evidence = [];

    // Add relevant code snippets
    if (codeSnippets && codeSnippets.length > 0) {
      codeSnippets.slice(0, 2).forEach((snippet: any) => {
        if (snippet.content) {
          evidence.push({
            type: 'code_snippet',
            file: snippet.file || 'Unknown file',
            lines: snippet.lines || 'Unknown lines',
            content: snippet.content.substring(0, 200) + (snippet.content.length > 200 ? '...' : '')
          });
        }
      });
    }

    // Add GitHub search results if available
    if (githubSearchResults && githubSearchResults.length > 0) {
      const relevantLines = githubSearchResults.split('\n').slice(0, 3);
      evidence.push({
        type: 'repository_context',
        file: 'Repository Analysis',
        lines: 'Search results',
        content: relevantLines.join('\n').substring(0, 200) + '...'
      });
    }

    // If no evidence found, create a generic one
    if (evidence.length === 0) {
      evidence.push({
        type: 'analysis_note',
        file: 'Compliance Analysis',
        lines: 'N/A',
        content: `Issue identified through ${regulation} compliance analysis: ${issue.substring(0, 150)}...`
      });
    }

    return evidence;
  };

  const handleAnalyzeDataFlow = async () => {
    setIsAnalyzingDataFlow(true);
    
    try {
      // Parse the editable schema
      let parsedSchema;
      try {
        parsedSchema = JSON.parse(editableSchema);
      } catch (error) {
        console.error('Invalid JSON schema:', error);
        parsedSchema = { email: { type: "string", format: "email" } };
      }

      // Collect all available data for analysis
      const analysisData = {
        productDescription,
        schemaData: parsedSchema,
        legalReview,
        githubSearchResults,
        codeSnippets,
        figmaAnalysis,
        complianceAnalysis,
        uploadedFile: uploadedFile ? {
          name: uploadedFile.name,
          size: uploadedFile.size,
          type: uploadedFile.type
        } : null
      };

      // Send data to server for analysis
      const response = await fetch('/api/analyze-data-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (response.ok) {
        const result = await response.json();
        setDataFlowAnalysis(result);
        console.log('Data flow analysis completed:', result);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Analysis failed' }));
        console.error('Data flow analysis failed:', errorData);
        // Fallback to client-side analysis
        const fallbackAnalysis = generateDataFlowAnalysis(analysisData);
        setDataFlowAnalysis(fallbackAnalysis);
      }
    } catch (error) {
      console.error('Error analyzing data flow:', error);
      // Fallback to client-side analysis
      let parsedSchema;
      try {
        parsedSchema = JSON.parse(editableSchema);
      } catch (error) {
        console.error('Invalid JSON schema:', error);
        parsedSchema = { email: { type: "string", format: "email" } };
      }

      const analysisData = {
        productDescription,
        schemaData: parsedSchema,
        legalReview,
        githubSearchResults,
        codeSnippets,
        figmaAnalysis,
        complianceAnalysis,
        uploadedFile: uploadedFile ? {
          name: uploadedFile.name,
          size: uploadedFile.size,
          type: uploadedFile.type
        } : null
      };
      const fallbackAnalysis = generateDataFlowAnalysis(analysisData);
      setDataFlowAnalysis(fallbackAnalysis);
    } finally {
      setIsAnalyzingDataFlow(false);
    }
  };

  const generateDataFlowAnalysis = (data: any) => {
    // Generate data flow analysis based on available data
    const dataFlow = {
      nodes: [],
      edges: [],
      privacyImplications: [],
      complianceRisks: [],
      recommendations: []
    };

    // Add user input node
    dataFlow.nodes.push({
      id: 'user-input',
      label: 'User Input',
      type: 'source',
      dataTypes: ['email', 'profile_data', 'preferences']
    });

    // Add authentication node
    dataFlow.nodes.push({
      id: 'auth',
      label: 'Authentication System',
      type: 'process',
      dataTypes: ['credentials', 'session_tokens']
    });

    // Add main application node
    dataFlow.nodes.push({
      id: 'app',
      label: 'Main Application',
      type: 'process',
      dataTypes: ['user_data', 'application_state']
    });

    // Add storage node
    dataFlow.nodes.push({
      id: 'storage',
      label: 'Data Storage',
      type: 'storage',
      dataTypes: ['persistent_data', 'user_profiles']
    });

    // Add third-party integrations
    if (data.githubSearchResults || data.codeSnippets) {
      dataFlow.nodes.push({
        id: 'github',
        label: 'GitHub API',
        type: 'external',
        dataTypes: ['code_data', 'repository_info']
      });
    }

    if (data.figmaAnalysis) {
      dataFlow.nodes.push({
        id: 'figma',
        label: 'Figma API',
        type: 'external',
        dataTypes: ['design_data', 'component_info']
      });
    }

    // Add edges
    dataFlow.edges.push({
      from: 'user-input',
      to: 'auth',
      label: 'User credentials',
      dataTypes: ['email', 'password']
    });

    dataFlow.edges.push({
      from: 'auth',
      to: 'app',
      label: 'Authenticated session',
      dataTypes: ['session_token', 'user_id']
    });

    dataFlow.edges.push({
      from: 'app',
      to: 'storage',
      label: 'User data persistence',
      dataTypes: ['profile_data', 'preferences']
    });

    if (data.githubSearchResults || data.codeSnippets) {
      dataFlow.edges.push({
        from: 'app',
        to: 'github',
        label: 'Code analysis',
        dataTypes: ['repository_url', 'code_snippets']
      });
    }

    if (data.figmaAnalysis) {
      dataFlow.edges.push({
        from: 'app',
        to: 'figma',
        label: 'Design analysis',
        dataTypes: ['figma_url', 'design_components']
      });
    }

    // Analyze privacy implications
    if (data.schemaData?.email) {
      dataFlow.privacyImplications.push({
        type: 'PII Collection',
        severity: 'high',
        description: 'Email addresses are collected and stored',
        regulation: 'GDPR, CCPA, COPPA'
      });
    }

    // Analyze other fields in the schema
    if (data.schemaData && typeof data.schemaData === 'object') {
      Object.keys(data.schemaData).forEach(fieldName => {
        if (fieldName !== 'email' && data.schemaData[fieldName]) {
          const field = data.schemaData[fieldName];
          if (field.type === 'string' && (field.format === 'email' || fieldName.toLowerCase().includes('email'))) {
            dataFlow.privacyImplications.push({
              type: 'PII Collection',
              severity: 'high',
              description: `${fieldName} field contains email addresses`,
              regulation: 'GDPR, CCPA, COPPA'
            });
          } else if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('address')) {
            dataFlow.privacyImplications.push({
              type: 'PII Collection',
              severity: 'medium',
              description: `${fieldName} field may contain personal information`,
              regulation: 'GDPR, CCPA'
            });
          }
        }
      });
    }

    if (data.legalReview?.facts?.some((fact: string) => fact.includes('email'))) {
      dataFlow.privacyImplications.push({
        type: 'Data Processing',
        severity: 'medium',
        description: 'Email data is processed for feature functionality',
        regulation: 'GDPR Article 6'
      });
    }

    // Analyze compliance risks
    if (data.complianceAnalysis?.coppa) {
      dataFlow.complianceRisks.push({
        type: 'COPPA Compliance',
        severity: 'high',
        description: 'Age verification required for users under 13',
        mitigation: 'Implement age-gating mechanism'
      });
    }

    if (data.complianceAnalysis?.gdpr) {
      dataFlow.complianceRisks.push({
        type: 'GDPR Compliance',
        severity: 'high',
        description: 'Data subject rights and consent management required',
        mitigation: 'Implement consent management system'
      });
    }

    // Generate recommendations
    dataFlow.recommendations.push({
      type: 'Data Minimization',
      priority: 'high',
      description: 'Only collect necessary data for core functionality',
      implementation: 'Review data collection points and remove unnecessary fields'
    });

    dataFlow.recommendations.push({
      type: 'Encryption',
      priority: 'high',
      description: 'Encrypt sensitive data in transit and at rest',
      implementation: 'Implement TLS for data transmission and AES-256 for storage'
    });

    dataFlow.recommendations.push({
      type: 'Access Controls',
      priority: 'medium',
      description: 'Implement proper access controls for data access',
      implementation: 'Use role-based access control (RBAC) and audit logging'
    });

    return {
      success: true,
      dataFlow,
      summary: {
        totalNodes: dataFlow.nodes.length,
        totalEdges: dataFlow.edges.length,
        privacyImplications: dataFlow.privacyImplications.length,
        complianceRisks: dataFlow.complianceRisks.length,
        recommendations: dataFlow.recommendations.length
      }
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 sm:px-6 py-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Combo AI
        </h1>
        <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
          Streamline product requirements review and compliance analysis
        </p>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Launch Compliance Section */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Launch Compliance
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Submit your product requirements for evaluation and advice.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Product description
                </label>
                <Textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>



              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Product requirements doc
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-accent/50"
                      : "border-muted-foreground/30 hover:border-muted-foreground/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileInput}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    {uploadedFile ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Drag and drop file or click to select
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, or TXT files
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub Repository URL (Optional)
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="url"
                      placeholder="https://github.com/username/repository"
                      value={githubUrl}
                      onChange={handleGithubUrlChange}
                      className={`text-sm ${githubUrlError ? 'border-red-500' : ''}`}
                    />
                    {githubUrl && !githubUrlError && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {githubUrlError ? (
                    <p className="text-xs text-red-500">{githubUrlError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Paste your GitHub repository URL to provide code context for the review
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                  <Figma className="h-4 w-4" />
                  Figma Design URL (Optional)
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="url"
                      placeholder="https://www.figma.com/file/..."
                      value={figmaUrl}
                      onChange={handleFigmaUrlChange}
                      className={`text-sm ${figmaUrlError ? 'border-red-500' : ''}`}
                    />
                    {figmaUrl && !figmaUrlError && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {figmaUrlError ? (
                    <p className="text-xs text-red-500">{figmaUrlError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Paste your Figma design URL to provide design context for the review
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Analysis
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Good to proceed with the proposed changes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Questions
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Age-gating changes
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={handleRequestLegalReview}
                  disabled={!uploadedFile || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Generate legal review'}
                </Button>
                
                {uploadStatus.type && (
                  <div className={`mt-3 p-3 rounded-md text-sm ${
                    uploadStatus.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {uploadStatus.message}
                  </div>
                )}

              </div>
            </CardContent>
          </Card>

          {/* Product Legal Review Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Product Legal Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Compliance Summary */}
              {enhancedLegalReview?.complianceSummary && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Compliance Overview</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-blue-700">COPPA:</span>
                      <span className={`font-medium ${
                        enhancedLegalReview.complianceSummary.coppa === 'compliant' ? 'text-green-600' :
                        enhancedLegalReview.complianceSummary.coppa === 'non-compliant' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {enhancedLegalReview.complianceSummary.coppa}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">HIPAA:</span>
                      <span className={`font-medium ${
                        enhancedLegalReview.complianceSummary.hipaa === 'compliant' ? 'text-green-600' :
                        enhancedLegalReview.complianceSummary.hipaa === 'non-compliant' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {enhancedLegalReview.complianceSummary.hipaa}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">GDPR:</span>
                      <span className={`font-medium ${
                        enhancedLegalReview.complianceSummary.gdpr === 'compliant' ? 'text-green-600' :
                        enhancedLegalReview.complianceSummary.gdpr === 'non-compliant' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {enhancedLegalReview.complianceSummary.gdpr}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">AI Risk:</span>
                      <span className={`font-medium ${
                        enhancedLegalReview.complianceSummary.aiRisk === 'Low' ? 'text-green-600' :
                        enhancedLegalReview.complianceSummary.aiRisk === 'High' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {enhancedLegalReview.complianceSummary.aiRisk}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Facts
                </h3>
                <div className="space-y-2">
                  {(enhancedLegalReview?.facts || legalReview.facts).map((fact, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      {fact}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Notes
                </h3>
                <div className="space-y-2">
                  {(enhancedLegalReview?.notes || legalReview.notes).map((note, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">{note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Suggestions
                </h3>
                <div className="space-y-2">
                  {(enhancedLegalReview?.suggestions || legalReview.suggestions).map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Mitigations
                </h3>
                <div className="space-y-2">
                  {(enhancedLegalReview?.mitigations || legalReview.mitigations).map((mitigation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">
                        {mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Legal Brief Button */}
              <div className="mt-6 pt-4 border-t">
                <Button 
                  onClick={generateLegalBriefPDF}
                  disabled={!complianceAnalysis}
                  className={`w-full ${
                    complianceAnalysis 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  📥 Download Legal Brief {!complianceAnalysis && '(Generate analysis first)'}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Generate a comprehensive PDF legal brief with compliance analysis
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Risk Table Section */}
          {riskTable && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">
                    ⚠️
                  </div>
                  Risk Assessment Table
                </CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Total Risks: <span className="font-semibold text-foreground">{riskTable.total_risks}</span></span>
                  <span>Open: <span className="font-semibold text-red-600">{riskTable.open_risks}</span></span>
                  <span>Resolved: <span className="font-semibold text-green-600">{riskTable.resolved_risks}</span></span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-sm">Risk ID</th>
                        <th className="text-left p-2 font-medium text-sm">Status</th>
                        <th className="text-left p-2 font-medium text-sm">Regulation</th>
                        <th className="text-left p-2 font-medium text-sm">Severity</th>
                        <th className="text-left p-2 font-medium text-sm">Description</th>
                        <th className="text-left p-2 font-medium text-sm">Evidence</th>
                        <th className="text-left p-2 font-medium text-sm">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riskTable.risks.map((risk: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 text-sm font-mono text-blue-600">{risk.risk_id}</td>
                          <td className="p-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              risk.risk_status === 'OPEN' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {risk.risk_status}
                            </span>
                          </td>
                          <td className="p-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              risk.regulation === 'COPPA' ? 'bg-blue-100 text-blue-800' :
                              risk.regulation === 'HIPAA' ? 'bg-purple-100 text-purple-800' :
                              risk.regulation === 'GDPR' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {risk.regulation}
                            </span>
                          </td>
                          <td className="p-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              risk.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                              risk.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {risk.severity}
                            </span>
                          </td>
                          <td className="p-2 text-sm text-muted-foreground max-w-xs">
                            <div className="truncate" title={risk.description}>
                              {risk.description}
                            </div>
                          </td>
                          <td className="p-2 text-sm">
                            <div className="space-y-1 max-w-xs">
                              {risk.evidence.slice(0, 2).map((evidence: any, evidenceIndex: number) => (
                                <div key={evidenceIndex} className="bg-muted p-2 rounded text-xs">
                                  <div className="font-medium text-blue-600">{evidence.file}</div>
                                  <div className="text-muted-foreground">Lines: {evidence.lines}</div>
                                  <div className="mt-1 font-mono text-xs bg-background p-1 rounded border">
                                    {evidence.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-2 text-sm text-muted-foreground max-w-xs">
                            <div className="truncate" title={risk.recommendation}>
                              {risk.recommendation}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Schema Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-primary rounded text-primary-foreground text-xs flex items-center justify-center font-bold">
                  A
                </div>
                API Schema
              </CardTitle>
              <Badge variant="secondary" className="w-fit">
                Potential compliance issue submitted
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  JSON Schema
                </h3>
                <Textarea
                  value={editableSchema}
                  onChange={(e) => setEditableSchema(e.target.value)}
                  className="bg-muted font-mono text-sm min-h-[120px] resize-none"
                  placeholder="Enter your API schema JSON here..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Edit the JSON schema above to define your API structure
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Notes
                </h3>
                <div className="space-y-2">
                  {schemaData.notes.map((note, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">{note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Suggestions
                </h3>
                <div className="space-y-2">
                  {schemaData.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Mitigations
                </h3>
                <div className="space-y-2">
                  {schemaData.mitigations.map((mitigation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">
                        {mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Figma Import Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Figma className="h-5 w-5 text-primary" />
                Figma Import
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Import design files and components for compliance review.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Design Files
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      type="url"
                      placeholder="https://www.figma.com/file/..."
                      value={figmaUrl}
                      onChange={handleFigmaUrlChange}
                      className={`text-sm ${figmaUrlError ? 'border-red-500' : ''}`}
                    />
                    {figmaUrl && !figmaUrlError && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {figmaUrlError ? (
                    <p className="text-xs text-red-500">{figmaUrlError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Paste your Figma design URL to import design context
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Figma Token
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="figd_..."
                      value={figmaToken}
                      onChange={(e) => setFigmaToken(e.target.value)}
                      className="text-sm"
                    />
                    {figmaToken && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your token from <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Figma Developer Settings</a>
                  </p>
                </div>
              </div>

              <div className="bg-muted rounded-md p-3">
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Import Status
                </h3>
                <div className="space-y-2">
                  {figmaAnalysis ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <p className="text-xs text-muted-foreground">
                        Analysis complete: {figmaAnalysis.summary.totalViolations} violations found
                      </p>
                    </div>
                  ) : isAnalyzingFigma ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <p className="text-xs text-muted-foreground">
                        Analyzing design files...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                        <p className="text-xs text-muted-foreground">
                          Ready to import design files
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <p className="text-xs text-muted-foreground">
                          Components will be analyzed for compliance
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                disabled={!figmaUrl.trim() || !!figmaUrlError || !figmaToken.trim() || isAnalyzingFigma}
                onClick={handleFigmaAnalysis}
              >
                {isAnalyzingFigma ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Analyzing...
                  </span>
                ) : (
                  'Import Design Files'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Company Settlements Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Company Settlements
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload company settlement PDF files for legal review and reference.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Settlement Documents
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    settlementDragActive
                      ? "border-primary bg-accent/50"
                      : "border-muted-foreground/30 hover:border-muted-foreground/50"
                  }`}
                  onDragEnter={handleSettlementDrag}
                  onDragLeave={handleSettlementDrag}
                  onDragOver={handleSettlementDrag}
                  onDrop={handleSettlementDrop}
                >
                  <input
                    type="file"
                    id="settlement-file-upload"
                    className="hidden"
                    onChange={handleSettlementFileInput}
                    accept=".pdf"
                    multiple
                  />
                  <label htmlFor="settlement-file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop PDF files or click to select
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF files only
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {settlementFiles.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    Selected Files ({settlementFiles.length})
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {settlementFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSettlementFile(index)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleUploadSettlements}
                disabled={settlementFiles.length === 0 || isUploadingSettlements}
              >
                {isUploadingSettlements ? 'Uploading...' : 'Upload Settlement Files'}
              </Button>
              
              {settlementUploadStatus.type && (
                <div className={`p-3 rounded-md text-sm ${
                  settlementUploadStatus.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {settlementUploadStatus.message}
                </div>
              )}
            </CardContent>
          </Card>


          {/* GitHub Repository Analysis Section */}
          {githubSearchResults && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5 text-primary" />
                  GitHub Repository Analysis
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Code search results from your GitHub repository
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                    {githubSearchResults}
                  </pre>
                </div>
                {githubSearchResults.includes("GitHub API token not configured") && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        <strong>GitHub Integration Setup Required:</strong> To enable repository analysis, 
                        please set up your GitHub Personal Access Token. Run <code className="bg-yellow-100 px-1 rounded">./setup-github-token.sh</code> for instructions.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Code Snippets with Compliance Issues */}
          {codeSnippets && codeSnippets.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Code Snippets with Compliance Issues
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Specific code files that may contain compliance issues
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {codeSnippets.map((snippet, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {snippet.category}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {snippet.file}
                          </span>
                        </div>
                        <a 
                          href={snippet.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View on GitHub
                        </a>
                      </div>
                      <div className="bg-muted/30 rounded p-3 mt-2">
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                          {snippet.content.substring(0, 800)}
                          {snippet.content.length > 800 && '...'}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Flow Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-primary rounded text-primary-foreground text-xs flex items-center justify-center font-bold">
                  D
                </div>
                Data Flow
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Analyze data flow and privacy implications.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Data Sources
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <p className="text-xs text-muted-foreground">User input data</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <p className="text-xs text-muted-foreground">Third-party integrations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <p className="text-xs text-muted-foreground">Analytics data</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Privacy Impact
                </h3>
                <div className="bg-muted rounded-md p-3">
                  <p className="text-xs text-muted-foreground">
                    Data flow analysis will be performed to identify privacy implications and compliance requirements.
                  </p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleAnalyzeDataFlow}
                disabled={isAnalyzingDataFlow}
              >
                {isAnalyzingDataFlow ? 'Analyzing...' : 'Analyze Data Flow'}
              </Button>
            </CardContent>
          </Card>

          {/* Data Flow Analysis Results */}
          {dataFlowAnalysis && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
                    📊
                  </div>
                  Data Flow Analysis Results
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generated data flow diagram and compliance analysis
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{dataFlowAnalysis.summary?.totalNodes || 0}</div>
                    <div className="text-sm text-blue-600">Data Nodes</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{dataFlowAnalysis.summary?.totalEdges || 0}</div>
                    <div className="text-sm text-green-600">Data Flows</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{dataFlowAnalysis.summary?.privacyImplications || 0}</div>
                    <div className="text-sm text-yellow-600">Privacy Issues</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{dataFlowAnalysis.summary?.complianceRisks || 0}</div>
                    <div className="text-sm text-red-600">Compliance Risks</div>
                  </div>
                </div>

                {/* Data Flow Diagram */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Data Flow Diagram</h3>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {dataFlowAnalysis.dataFlow?.nodes?.map((node: any) => (
                      <div
                        key={node.id}
                        className={`p-4 rounded-lg border-2 min-w-[120px] text-center ${
                          node.type === 'source' ? 'bg-green-100 border-green-300' :
                          node.type === 'process' ? 'bg-blue-100 border-blue-300' :
                          node.type === 'storage' ? 'bg-purple-100 border-purple-300' :
                          'bg-orange-100 border-orange-300'
                        }`}
                      >
                        <div className="font-semibold text-sm">{node.label}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {node.dataTypes?.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Flow arrows */}
                  <div className="flex justify-center mt-4">
                    <div className="flex items-center space-x-2">
                      {dataFlowAnalysis.dataFlow?.edges?.map((edge: any, index: number) => (
                        <div key={index} className="flex items-center">
                          <div className="text-xs bg-white px-2 py-1 rounded border">
                            {edge.label}
                          </div>
                          <div className="mx-2 text-gray-400">→</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Privacy Implications */}
                {dataFlowAnalysis.dataFlow?.privacyImplications?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Privacy Implications</h3>
                    <div className="space-y-2">
                      {dataFlowAnalysis.dataFlow.privacyImplications.map((implication: any, index: number) => (
                        <div key={index} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-yellow-800">{implication.type}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              implication.severity === 'high' ? 'bg-red-100 text-red-800' :
                              implication.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {implication.severity}
                            </span>
                          </div>
                          <p className="text-sm text-yellow-700 mt-1">{implication.description}</p>
                          <p className="text-xs text-yellow-600 mt-1">Regulation: {implication.regulation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliance Risks */}
                {dataFlowAnalysis.dataFlow?.complianceRisks?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Compliance Risks</h3>
                    <div className="space-y-2">
                      {dataFlowAnalysis.dataFlow.complianceRisks.map((risk: any, index: number) => (
                        <div key={index} className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-red-800">{risk.type}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              risk.severity === 'high' ? 'bg-red-100 text-red-800' :
                              risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {risk.severity}
                            </span>
                          </div>
                          <p className="text-sm text-red-700 mt-1">{risk.description}</p>
                          <p className="text-xs text-red-600 mt-1">Mitigation: {risk.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {dataFlowAnalysis.dataFlow?.recommendations?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                    <div className="space-y-2">
                      {dataFlowAnalysis.dataFlow.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-blue-800">{rec.type}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-sm text-blue-700 mt-1">{rec.description}</p>
                          <p className="text-xs text-blue-600 mt-1">Implementation: {rec.implementation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
