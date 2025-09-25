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
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Facts
                </h3>
                <div className="space-y-2">
                  {legalReview.facts.map((fact, index) => (
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
                  {legalReview.notes.map((note, index) => (
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
                  {legalReview.suggestions.map((suggestion, index) => (
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
                  {legalReview.mitigations.map((mitigation, index) => (
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

          {/* Eugene's API Schema Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-primary rounded text-primary-foreground text-xs flex items-center justify-center font-bold">
                  E
                </div>
                Eugene's API Schema
              </CardTitle>
              <Badge variant="secondary" className="w-fit">
                Potential compliance issue submitted
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Json
                </h3>
                <div className="bg-muted rounded-md p-3 font-mono text-sm">
                  <pre className="text-foreground whitespace-pre-wrap">
                    {`"email": {
  "type": "string",
  "format": "email"
}`}
                  </pre>
                </div>
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
              >
                Analyze Data Flow
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
