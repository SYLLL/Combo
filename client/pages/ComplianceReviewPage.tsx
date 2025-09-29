import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
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
import { saveChatConversation, loadChatConversation, fetchBearerToken, ChatMessage, ChatConversation, testFirebaseConnection } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

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
  const { currentUser } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
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
  const [riskTable, setRiskTable] = useState({
    total_risks: 0,
    open_risks: 0,
    resolved_risks: 0,
    risks: []
  });
  const [editableSchema, setEditableSchema] = useState(`{
  "email": {
    "type": "string",
    "format": "email"
  }
}`);

  // Chat functionality state
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [chatParticipants, setChatParticipants] = useState<string[]>([]);

  // Set project ID from URL parameter
  useEffect(() => {
    if (projectId) {
      setCurrentProjectId(projectId);
      console.log('🔥 Project ID set from URL:', projectId);
      
      // Load project details to determine user roles
      loadProjectDetails(projectId);
    } else {
      console.warn('🔥 No project ID found in URL');
    }
  }, [projectId]);

  // Load project details to determine user roles
  const loadProjectDetails = async (projectId: string) => {
    try {
      console.log('🔥 Loading project details for:', projectId);
      
      // Try to fetch project from Firebase first
      try {
        const tokenResult = await fetchBearerToken();
        if (tokenResult.success) {
          // Fetch project from Firebase using REST API
          const response = await fetch(
            `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/combodb/documents/test/${projectId}?key=${firebaseConfig.apiKey}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${tokenResult.idToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const fields = data.fields;
            
            console.log('🔥 Raw Firebase response:', data);
            console.log('🔥 Firebase fields:', fields);
            
            const project = {
              id: projectId,
              name: fields.name?.stringValue || 'Unknown Project',
              userId: fields.userId?.stringValue || 'unknown',
              legalPartnerEmail: fields.legalPartnerEmail?.stringValue || null,
              description: fields.description?.stringValue || 'No description'
            };
            
            console.log('🔥 Parsed project data:', project);
            setCurrentProject(project);
            console.log('🔥 Project details loaded from Firebase:', project);
            return;
          }
        }
      } catch (error) {
        console.log('🔥 Could not fetch from Firebase, using mock data:', error);
      }
      
      // Fallback to mock project structure
      // For testing purposes, let's assume the current user is a legal partner
      const mockProject = {
        id: projectId,
        name: 'Current Project',
        userId: 'productowner@example.com', // Different from current user
        legalPartnerEmail: currentUser?.email || 'legal@example.com', // Current user is legal partner
        description: 'Project description'
      };
      console.log('🔥 Using mock project data:', mockProject);
      console.log('🔥 Current user email for mock:', currentUser?.email);
      console.log('🔥 Mock project - userId:', mockProject.userId, 'legalPartnerEmail:', mockProject.legalPartnerEmail);
      setCurrentProject(mockProject);
      console.log('🔥 Project details loaded (mock):', mockProject);
    } catch (error) {
      console.error('🔥 Error loading project details:', error);
    }
  };

  // Function to resolve a risk
  const resolveRisk = (riskId: string) => {
    setRiskTable(prevRiskTable => {
      const updatedRisks = prevRiskTable.risks.map((risk: any) => {
        if (risk.risk_id === riskId) {
          return { ...risk, risk_status: 'RESOLVED' };
        }
        return risk;
      });
      
      const openRisks = updatedRisks.filter((risk: any) => risk.risk_status === 'OPEN').length;
      const resolvedRisks = updatedRisks.filter((risk: any) => risk.risk_status === 'RESOLVED').length;
      
      return {
        ...prevRiskTable,
        risks: updatedRisks,
        open_risks: openRisks,
        resolved_risks: resolvedRisks
      };
    });
  };

  // Helper function to determine sender type
  const getSenderInfo = (message: any) => {
    console.log('🔥 Determining sender info for message:', {
      messageType: message.type,
      savedSenderRole: message.senderRole,
      savedSenderEmail: message.senderEmail,
      currentUserEmail: currentUser?.email
    });
    
    if (message.type === 'system') {
      return { 
        type: 'system', 
        label: 'System', 
        color: 'text-yellow-600',
        email: '',
        displayText: 'System'
      };
    }
    if (message.type === 'ai') {
      return { 
        type: 'ai', 
        label: 'GreyMatter AI', 
        color: 'text-purple-600',
        email: '',
        displayText: 'GreyMatter AI'
      };
    }
    if (message.type === 'user') {
      // Use saved sender role if available, otherwise fallback to dynamic determination
      const savedRole = message.senderRole;
      const senderEmail = message.senderEmail || currentUser?.email || 'unknown@example.com';
      
      if (savedRole === 'legal-partner') {
        console.log('🔥 User identified as Legal Partner (from saved role)');
        return { 
          type: 'legal-partner', 
          label: 'Legal Partner', 
          color: 'text-blue-600',
          email: senderEmail,
          displayText: senderEmail
        };
      } else if (savedRole === 'product-owner') {
        console.log('🔥 User identified as Product Owner (from saved role)');
        return { 
          type: 'product-owner', 
          label: 'Product Owner', 
          color: 'text-green-600',
          email: senderEmail,
          displayText: senderEmail
        };
      } else {
        // Fallback to dynamic determination for old messages without saved role
        console.log('🔥 No saved role, using dynamic determination');
        const isLegalPartner = currentProject?.legalPartnerEmail === currentUser?.email;
        const isProductOwner = currentProject?.userId === currentUser?.email;
        
        if (isLegalPartner) {
          console.log('🔥 User identified as Legal Partner (dynamic)');
          return { 
            type: 'legal-partner', 
            label: 'Legal Partner', 
            color: 'text-blue-600',
            email: senderEmail,
            displayText: senderEmail
          };
        } else if (isProductOwner) {
          console.log('🔥 User identified as Product Owner (dynamic)');
          return { 
            type: 'product-owner', 
            label: 'Product Owner', 
            color: 'text-green-600',
            email: senderEmail,
            displayText: senderEmail
          };
        } else {
          console.log('🔥 User identified as Unknown User');
          return { 
            type: 'user', 
            label: 'User', 
            color: 'text-gray-600',
            email: senderEmail,
            displayText: senderEmail
          };
        }
      }
    }
    return { 
      type: 'unknown', 
      label: 'Unknown', 
      color: 'text-gray-600',
      email: '',
      displayText: 'Unknown'
    };
  };

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

  // Helper function to generate PRD quotes based on regulation and issue
  const generatePRDQuote = (regulation: string, issue: string) => {
    const prdQuotes = {
      COPPA: [
        "Section 5.2.1 states 'Automatic feature activation and data collection consent'",
        "The product targets children ages 4-16, including those under 13",
        "Extensive personal information collection without verifiable parental consent",
        "Default-enabled data sharing preferences mentioned in the PRD"
      ],
      HIPAA: [
        "Health information collection and processing requirements",
        "Patient data handling and storage protocols",
        "Medical record access and sharing policies"
      ],
      GDPR: [
        "Data processing activities without explicit consent mechanisms",
        "Personal data collection and processing for EU users",
        "Privacy policy and data retention requirements"
      ]
    };
    
    const quotes = prdQuotes[regulation as keyof typeof prdQuotes] || ["General compliance requirement"];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  // Helper function to generate Figma screenshot indicators
  const generateFigmaScreenshot = (regulation: string, issue: string) => {
    // For demo purposes, randomly assign some risks as having Figma screenshots
    const hasScreenshot = Math.random() > 0.6; // 40% chance of having screenshot
    return hasScreenshot;
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
          prdQuote: generatePRDQuote('COPPA', issue),
          figmaScreenshot: generateFigmaScreenshot('COPPA', issue),
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
          prdQuote: generatePRDQuote('HIPAA', issue),
          figmaScreenshot: generateFigmaScreenshot('HIPAA', issue),
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
          prdQuote: generatePRDQuote('GDPR', issue),
          figmaScreenshot: generateFigmaScreenshot('GDPR', issue),
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

  // Chat functionality functions
  const openRiskChat = async (risk: any) => {
    console.log('🔥 Opening chat for risk:', risk.risk_id, 'in project:', currentProjectId);
    console.log('🔥 Expected conversation ID format:', `${currentProjectId}-${risk.risk_id}`);
    
    setSelectedRisk(risk);
    
    // Initialize participants with current user
    const participants = currentUser?.email ? [currentUser.email] : [];
    setChatParticipants(participants);
    
    // Try to load existing conversation from Firebase
    if (currentProjectId) {
      try {
        console.log('🔥 Attempting to load conversation for:', currentProjectId, risk.risk_id);
        const tokenResult = await fetchBearerToken();
        if (tokenResult.success) {
          console.log('🔥 Bearer token obtained, calling loadChatConversation...');
          const result = await loadChatConversation(currentProjectId, risk.risk_id, tokenResult.idToken);
          console.log('🔥 Conversation load result:', result);
          
          if (result.success && result.conversation) {
            // Load existing messages
            const existingMessages = result.conversation.messages.map(msg => ({
              id: msg.id,
              type: msg.type,
              message: msg.message,
              timestamp: new Date(msg.timestamp),
              senderRole: msg.senderRole,
              senderEmail: msg.senderEmail
            }));
            console.log('🔥 Loaded existing messages:', existingMessages.length);
            console.log('🔥 Message preview with roles:', existingMessages.slice(0, 2));
            setChatMessages(existingMessages);
            setChatParticipants(result.conversation.participants);
          } else {
            // No existing conversation, start with welcome message
            console.log('🔥 No existing conversation found, starting fresh');
            setChatMessages([
              {
                id: 1,
                type: 'system',
                message: `Welcome to the chat for Risk ${risk.risk_id}. I'm here to help you discuss this ${risk.severity.toLowerCase()} severity ${risk.regulation} compliance issue.`,
                timestamp: new Date(),
                senderRole: 'system',
                senderEmail: ''
              }
            ]);
          }
        } else {
          // Fallback to welcome message if token fetch fails
          console.log('🔥 Token fetch failed, using fallback');
          setChatMessages([
            {
              id: 1,
              type: 'system',
              message: `Welcome to the chat for Risk ${risk.risk_id}. I'm here to help you discuss this ${risk.severity.toLowerCase()} severity ${risk.regulation} compliance issue.`,
              timestamp: new Date(),
              senderRole: 'system',
              senderEmail: ''
            }
          ]);
        }
      } catch (error) {
        console.error('🔥 Error loading chat conversation:', error);
        // Fallback to welcome message
        setChatMessages([
          {
            id: 1,
            type: 'system',
            message: `Welcome to the chat for Risk ${risk.risk_id}. I'm here to help you discuss this ${risk.severity.toLowerCase()} severity ${risk.regulation} compliance issue.`,
            timestamp: new Date(),
            senderRole: 'system',
            senderEmail: ''
          }
        ]);
      }
    } else {
      // No project context, start with welcome message
      console.log('🔥 No project context, starting fresh');
      setChatMessages([
        {
          id: 1,
          type: 'system',
          message: `Welcome to the chat for Risk ${risk.risk_id}. I'm here to help you discuss this ${risk.severity.toLowerCase()} severity ${risk.regulation} compliance issue.`,
          timestamp: new Date(),
          senderRole: 'system',
          senderEmail: ''
        }
      ]);
    }
    
    setChatModalOpen(true);
  };

  const closeChatModal = () => {
    setChatModalOpen(false);
    setSelectedRisk(null);
    setChatMessages([]);
    setNewMessage('');
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRisk) return;

    // Determine sender role based on current user and project
    const determineSenderRole = () => {
      if (!currentProject || !currentUser?.email) {
        return 'unknown';
      }
      
      const isLegalPartner = currentProject.legalPartnerEmail === currentUser.email;
      const isProductOwner = currentProject.userId === currentUser.email;
      
      if (isLegalPartner) {
        return 'legal-partner';
      } else if (isProductOwner) {
        return 'product-owner';
      } else {
        return 'unknown';
      }
    };

    const senderRole = determineSenderRole();
    console.log('🔥 Determined sender role:', senderRole, 'for user:', currentUser?.email);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: newMessage,
      timestamp: new Date(),
      senderRole: senderRole,
      senderEmail: currentUser?.email || ''
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setNewMessage('');
    setIsTyping(true);

    // Check if message contains @GreyMatter trigger
    if (newMessage.includes('@GreyMatter')) {
      // Simulate AI response delay
      setTimeout(async () => {
        const aiResponse = generateAIResponse(newMessage, selectedRisk);
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          message: aiResponse,
          timestamp: new Date(),
          senderRole: 'ai',
          senderEmail: ''
        };
        
        const finalMessages = [...updatedMessages, aiMessage];
        setChatMessages(finalMessages);
        setIsTyping(false);
        
        // Save conversation to Firebase
        if (currentProjectId && currentUser?.email) {
          try {
            console.log('🔥 Attempting to save chat conversation...', {
              projectId: currentProjectId,
              riskId: selectedRisk.risk_id,
              messageCount: finalMessages.length,
              userEmail: currentUser.email,
              senderRole: senderRole
            });
            
            const tokenResult = await fetchBearerToken();
            if (tokenResult.success) {
              const messagesToSave: ChatMessage[] = finalMessages.map(msg => ({
                id: msg.id.toString(),
                type: msg.type,
                message: msg.message,
                timestamp: msg.timestamp.toISOString(),
                senderRole: msg.senderRole || 'unknown',
                senderEmail: msg.senderEmail || ''
              }));
              
              const updatedParticipants = [...new Set([...chatParticipants, currentUser.email])];
              setChatParticipants(updatedParticipants);
              
              const saveResult = await saveChatConversation(
                currentProjectId,
                selectedRisk.risk_id,
                messagesToSave,
                updatedParticipants,
                tokenResult.idToken
              );
              
              if (saveResult.success) {
                console.log('🔥 Chat conversation saved successfully!', saveResult.conversationId);
              } else {
                console.error('🔥 Failed to save chat conversation:', saveResult.error);
              }
            } else {
              console.error('🔥 Failed to get Bearer token for saving conversation');
            }
          } catch (error) {
            console.error('🔥 Error saving chat conversation:', error);
          }
        } else {
          console.warn('🔥 Cannot save conversation - missing projectId or user email:', {
            projectId: currentProjectId,
            userEmail: currentUser?.email
          });
        }
      }, 1500);
    } else {
      setIsTyping(false);
      
      // Save conversation to Firebase even for non-AI messages
      if (currentProjectId && currentUser?.email) {
        try {
          console.log('🔥 Attempting to save non-AI chat conversation...', {
            projectId: currentProjectId,
            riskId: selectedRisk.risk_id,
            messageCount: updatedMessages.length,
            userEmail: currentUser.email,
            senderRole: senderRole
          });
          
          const tokenResult = await fetchBearerToken();
          if (tokenResult.success) {
            const messagesToSave: ChatMessage[] = updatedMessages.map(msg => ({
              id: msg.id.toString(),
              type: msg.type,
              message: msg.message,
              timestamp: msg.timestamp.toISOString(),
              senderRole: msg.senderRole || 'unknown',
              senderEmail: msg.senderEmail || ''
            }));
            
            const updatedParticipants = [...new Set([...chatParticipants, currentUser.email])];
            setChatParticipants(updatedParticipants);
            
            const saveResult = await saveChatConversation(
              currentProjectId,
              selectedRisk.risk_id,
              messagesToSave,
              updatedParticipants,
              tokenResult.idToken
            );
            
            if (saveResult.success) {
              console.log('🔥 Non-AI chat conversation saved successfully!', saveResult.conversationId);
            } else {
              console.error('🔥 Failed to save non-AI chat conversation:', saveResult.error);
            }
          } else {
            console.error('🔥 Failed to get Bearer token for saving non-AI conversation');
          }
        } catch (error) {
          console.error('🔥 Error saving chat conversation:', error);
        }
      } else {
        console.warn('🔥 Cannot save non-AI conversation - missing projectId or user email:', {
          projectId: currentProjectId,
          userEmail: currentUser?.email
        });
      }
    }
  };

  const generateAIResponse = (userMessage: string, risk: any): string => {
    const responses = [
      `Based on the ${risk.regulation} compliance issue "${risk.description}", I recommend focusing on ${risk.recommendation}. This is a ${risk.severity.toLowerCase()} severity risk that requires immediate attention.`,
      `For this ${risk.regulation} violation, the evidence shows ${risk.evidence.map(e => e.content).join(', ')}. The key action items are: 1) Implement proper consent mechanisms, 2) Review data collection practices, 3) Update privacy policies.`,
      `This ${risk.severity.toLowerCase()} risk in ${risk.regulation} compliance can be mitigated by following these steps: ${risk.recommendation}. The code evidence suggests the issue is in the data handling logic.`,
      `Given the ${risk.regulation} compliance requirements and the ${risk.severity.toLowerCase()} severity of this issue, I suggest prioritizing the implementation of proper data protection measures as outlined in the recommendation.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const testFirebase = async () => {
    console.log('🔥 Testing Firebase connection...');
    const result = await testFirebaseConnection();
    if (result.success) {
      alert('✅ Firebase connection test passed!');
    } else {
      alert(`❌ Firebase test failed at step ${result.step}: ${result.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              Combo AI
            </h1>
            <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
              Streamline product requirements review and compliance analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={testFirebase} variant="outline" size="sm">
              🔥 Test Firebase
            </Button>
            {currentUser && (
              <div className="text-sm text-muted-foreground">
                {currentUser.email}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Existing Cards - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
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
                  {(enhancedLegalReview?.facts || []).map((fact, index) => (
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
                  {(enhancedLegalReview?.notes || []).map((note, index) => (
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
                  {(enhancedLegalReview?.suggestions || []).map((suggestion, index) => (
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
                  {(enhancedLegalReview?.mitigations || []).map((mitigation, index) => (
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
                  Analysis Scope
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                    <p className="text-xs text-muted-foreground">Privacy implications</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    <p className="text-xs text-muted-foreground">Compliance risks</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                    <p className="text-xs text-muted-foreground">Data retention policies</p>
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

              {/* Data Flow Analysis Results - Inline */}
              {dataFlowAnalysis && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Analysis Results</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-blue-700">
                      <span className="font-semibold">{dataFlowAnalysis.summary?.totalNodes || 0}</span> Nodes
                    </div>
                    <div className="text-blue-700">
                      <span className="font-semibold">{dataFlowAnalysis.summary?.totalEdges || 0}</span> Flows
                    </div>
                    <div className="text-blue-700">
                      <span className="font-semibold">{dataFlowAnalysis.summary?.privacyImplications || 0}</span> Privacy Issues
                    </div>
                    <div className="text-blue-700">
                      <span className="font-semibold">{dataFlowAnalysis.summary?.complianceRisks || 0}</span> Compliance Risks
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Analysis completed successfully. Check the detailed results below.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Generated Cards - Appear After Legal Review */}
        {(riskTable.total_risks > 0 || dataFlowAnalysis) && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Generated Analysis Results</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Table Section */}
              {riskTable.total_risks > 0 && (
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
                        <th className="text-left p-2 font-medium text-sm">Actions</th>
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
                            <div className="space-y-2 max-w-xs">
                              {/* Code Snippets */}
                              {risk.evidence && risk.evidence.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-blue-600 mb-1">Code Evidence:</div>
                                  {risk.evidence.slice(0, 1).map((evidence: any, evidenceIndex: number) => (
                                    <div key={evidenceIndex} className="bg-muted p-2 rounded text-xs">
                                      <div className="font-medium text-blue-600">{evidence.file}</div>
                                      <div className="text-muted-foreground">Lines: {evidence.lines}</div>
                                      <div className="mt-1 font-mono text-xs bg-background p-1 rounded border">
                                        {evidence.content}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* PRD Quotes */}
                              <div>
                                <div className="text-xs font-semibold text-green-600 mb-1">PRD Quote:</div>
                                <div className="bg-green-50 p-2 rounded text-xs border border-green-200">
                                  <div className="text-green-800 italic">
                                    {risk.prdQuote || "N/A - No PRD quote available"}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Figma Design Screenshot */}
                              <div>
                                <div className="text-xs font-semibold text-purple-600 mb-1">Figma Design:</div>
                                <div className="bg-purple-50 p-2 rounded text-xs border border-purple-200">
                                  {risk.figmaScreenshot ? (
                                    <div className="text-purple-800">
                                      <div className="font-medium">Screenshot Available</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Design element showing compliance issue
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-purple-600 italic">
                                      N/A - No Figma screenshot available
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 text-sm text-muted-foreground max-w-xs">
                            <div className="truncate" title={risk.recommendation}>
                              {risk.recommendation}
                            </div>
                          </td>
                          <td className="p-2 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openRiskChat(risk)}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                              >
                                💬 Chat
                              </button>
                              {risk.risk_status === 'OPEN' && (
                                <button
                                  onClick={() => resolveRisk(risk.risk_id)}
                                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                                >
                                  ✅ Resolve
                                </button>
                              )}
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
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {chatModalOpen && selectedRisk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Risk Discussion: {selectedRisk.risk_id}</h3>
                <p className="text-sm text-gray-600">{selectedRisk.regulation} - {selectedRisk.severity} Severity</p>
                {chatParticipants.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Participants: {chatParticipants.join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={closeChatModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
              {chatMessages.map((message) => {
                const senderInfo = getSenderInfo(message);
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                      {/* Sender Label */}
                      <div className={`text-xs font-medium mb-1 ${senderInfo.color}`}>
                        {senderInfo.displayText}
                      </div>
                      
                      {/* Message Bubble */}
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : message.type === 'ai'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <div className="text-sm">{message.message}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... Use @GreyMatter to get AI assistance"
                  className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                💡 Tip: Type "@GreyMatter" in your message to get AI-powered assistance with this risk
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
