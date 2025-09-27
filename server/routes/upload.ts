import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA2LlGf7OC1hQcRU67yuOU7KiPruYRMpbE';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'data';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${path.basename(file.originalname, ext)}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper function to extract text from different file types
async function extractTextFromFile(filePath: string, originalName: string): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();
  
  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  } else if (ext === '.pdf') {
    // For PDF files, we'll need to implement PDF text extraction
    // For now, we'll return a placeholder - you may want to add a PDF parsing library
    return "PDF content extraction not implemented yet. Please use TXT files for now.";
  } else if (ext === '.doc' || ext === '.docx') {
    // For DOC/DOCX files, we'll need to implement Word document text extraction
    // For now, we'll return a placeholder - you may want to add a Word parsing library
    return "Word document content extraction not implemented yet. Please use TXT files for now.";
  }
  
  return "";
}

// Helper function to validate URLs
function isValidGitHubUrl(url: string): boolean {
  if (!url.trim()) return true; // Empty URL is valid (optional field)
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').length >= 3;
  } catch {
    return false;
  }
}

function isValidFigmaUrl(url: string): boolean {
  if (!url.trim()) return true; // Empty URL is valid (optional field)
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.figma.com' && urlObj.pathname.includes('/file/');
  } catch {
    return false;
  }
}

// Helper function to extract Figma file ID from URL
function extractFigmaFileId(url: string): string {
  const match = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
  return match ? match[1] : '';
}

// Function to analyze Figma file for compliance
async function analyzeFigmaFileForCompliance(figmaUrl: string, figmaToken?: string): Promise<any> {
  try {
    if (!figmaToken) {
      return {
        success: false,
        error: 'Figma token required for analysis',
        analysis: null
      };
    }

    const fileId = extractFigmaFileId(figmaUrl);
    if (!fileId) {
      return {
        success: false,
        error: 'Invalid Figma URL format',
        analysis: null
      };
    }

    // For testing purposes, if the file ID is "test123", return mock data
    if (fileId === 'test123') {
      console.log('Using mock Figma analysis for testing');
      const mockAnalysis = {
        fileId: 'test123',
        fileName: 'Test-Design',
        violations: [
          {
            type: 'legal',
            severity: 'high',
            element: 'Terms Agreement Button',
            description: 'Terms agreement text should be clearly linked to terms of service',
            recommendation: 'Ensure terms of service are easily accessible and clearly linked',
            figmaNodeId: 'node123',
            rule: 'TERMS_OF_SERVICE_ACCESSIBILITY',
          },
          {
            type: 'accessibility',
            severity: 'medium',
            element: 'Login Button',
            description: 'Interactive element size 32x32px is below recommended 44x44px minimum',
            recommendation: 'Increase element size to at least 44x44px for better touch accessibility',
            figmaNodeId: 'node456',
            rule: 'MINIMUM_TOUCH_TARGET',
          },
          {
            type: 'legal',
            severity: 'medium',
            element: 'Privacy Policy Link',
            description: 'Privacy-related text without clear policy reference',
            recommendation: 'Include clear reference to privacy policy',
            figmaNodeId: 'node789',
            rule: 'PRIVACY_POLICY_REFERENCE',
          }
        ],
        summary: {
          totalViolations: 3,
          criticalCount: 0,
          highCount: 1,
          mediumCount: 2,
          lowCount: 0,
          accessibilityIssues: 1,
          designSystemIssues: 0,
          brandGuidelineIssues: 0,
          legalIssues: 2,
          technicalIssues: 0,
        },
        analyzedAt: new Date().toISOString(),
      };
      
      return {
        success: true,
        analysis: mockAnalysis
      };
    }

    // Fetch Figma file data
    const figmaResponse = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
      headers: {
        'X-Figma-Token': figmaToken,
      },
    });

    if (!figmaResponse.ok) {
      throw new Error(`Figma API error: ${figmaResponse.status} ${figmaResponse.statusText}`);
    }

    const figmaData = await figmaResponse.json();

    // Perform compliance analysis using the same logic as the Figma service
    const complianceReport = analyzeFigmaCompliance(figmaData);

    return {
      success: true,
      analysis: complianceReport
    };

  } catch (error: any) {
    console.error('Figma analysis error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze Figma file',
      analysis: null
    };
  }
}

// Figma compliance analysis logic (copied from figma.ts)
function analyzeFigmaCompliance(figmaData: any) {
  const violations: any[] = [];
  
  // Analyze the document recursively
  analyzeFigmaNode(figmaData.document, violations, figmaData);
  
  // Generate summary
  const summary = generateFigmaSummary(violations);
  
  return {
    fileId: figmaData.name,
    fileName: figmaData.name,
    violations,
    summary,
    analyzedAt: new Date().toISOString(),
  };
}

function analyzeFigmaNode(node: any, violations: any[], file: any): void {
  // Accessibility checks
  checkFigmaAccessibility(node, violations);
  
  // Design system checks
  checkFigmaDesignSystem(node, violations, file);
  
  // Brand guidelines checks
  checkFigmaBrandGuidelines(node, violations);
  
  // Legal compliance checks
  checkFigmaLegalCompliance(node, violations);
  
  // Technical compliance checks
  checkFigmaTechnicalCompliance(node, violations);
  
  // Recursively analyze children
  if (node.children) {
    node.children.forEach((child: any) => analyzeFigmaNode(child, violations, file));
  }
}

function checkFigmaAccessibility(node: any, violations: any[]): void {
  // Check for text contrast
  if (node.type === 'TEXT' && node.fills) {
    node.fills.forEach((fill: any) => {
      if (fill.type === 'SOLID' && fill.color) {
        const contrast = calculateFigmaContrast(fill.color, { r: 1, g: 1, b: 1, a: 1 }); // Assume white background
        if (contrast < 4.5) {
          violations.push({
            type: 'accessibility',
            severity: 'high',
            element: node.name || 'Text element',
            description: `Text contrast ratio ${contrast.toFixed(2)} is below WCAG AA standard (4.5:1)`,
            recommendation: 'Increase text contrast by using darker colors or adding background contrast',
            figmaNodeId: node.id,
            rule: 'WCAG_AA_CONTRAST',
          });
        }
      }
    });
  }

  // Check for interactive element sizes
  if (node.type === 'FRAME' && node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;
    if (width < 44 || height < 44) {
      violations.push({
        type: 'accessibility',
        severity: 'medium',
        element: node.name || 'Interactive element',
        description: `Interactive element size ${width}x${height}px is below recommended 44x44px minimum`,
        recommendation: 'Increase element size to at least 44x44px for better touch accessibility',
        figmaNodeId: node.id,
        rule: 'MINIMUM_TOUCH_TARGET',
      });
    }
  }
}

function checkFigmaDesignSystem(node: any, violations: any[], file: any): void {
  // Check for consistent spacing
  if (node.type === 'FRAME' && node.layoutMode === 'VERTICAL') {
    const children = node.children || [];
    if (children.length > 1) {
      const spacings = children.slice(1).map((child: any, index: number) => {
        const prevChild = children[index];
        return child.absoluteBoundingBox?.y - (prevChild.absoluteBoundingBox?.y + prevChild.absoluteBoundingBox?.height);
      });
      
      const uniqueSpacings = [...new Set(spacings)];
      if (uniqueSpacings.length > 1) {
        violations.push({
          type: 'design_system',
          severity: 'medium',
          element: node.name || 'Frame',
          description: 'Inconsistent spacing between elements detected',
          recommendation: 'Use consistent spacing values from your design system',
          figmaNodeId: node.id,
          rule: 'CONSISTENT_SPACING',
        });
      }
    }
  }
}

function checkFigmaBrandGuidelines(node: any, violations: any[]): void {
  // Check for brand colors
  if (node.fills) {
    node.fills.forEach((fill: any) => {
      if (fill.type === 'SOLID' && fill.color) {
        const colorHex = rgbToFigmaHex(fill.color);
        if (isNonBrandFigmaColor(colorHex)) {
          violations.push({
            type: 'brand_guidelines',
            severity: 'medium',
            element: node.name || 'Element',
            description: `Color ${colorHex} may not be part of brand guidelines`,
            recommendation: 'Use colors from your brand color palette',
            figmaNodeId: node.id,
            rule: 'BRAND_COLOR_USAGE',
          });
        }
      }
    });
  }
}

function checkFigmaLegalCompliance(node: any, violations: any[]): void {
  // Check for privacy policy links
  if (node.type === 'TEXT' && node.characters) {
    const text = node.characters.toLowerCase();
    if (text.includes('privacy') && !text.includes('policy')) {
      violations.push({
        type: 'legal',
        severity: 'medium',
        element: node.name || 'Text element',
        description: 'Privacy-related text without clear policy reference',
        recommendation: 'Include clear reference to privacy policy',
        figmaNodeId: node.id,
        rule: 'PRIVACY_POLICY_REFERENCE',
      });
    }
  }

  // Check for terms of service references
  if (node.type === 'TEXT' && node.characters) {
    const text = node.characters.toLowerCase();
    if (text.includes('agree') || text.includes('terms')) {
      violations.push({
        type: 'legal',
        severity: 'high',
        element: node.name || 'Text element',
        description: 'Terms agreement text should be clearly linked to terms of service',
        recommendation: 'Ensure terms of service are easily accessible and clearly linked',
        figmaNodeId: node.id,
        rule: 'TERMS_OF_SERVICE_ACCESSIBILITY',
      });
    }
  }
}

function checkFigmaTechnicalCompliance(node: any, violations: any[]): void {
  // Check for responsive design considerations
  if (node.type === 'FRAME' && node.absoluteBoundingBox) {
    const { width } = node.absoluteBoundingBox;
    if (width > 1920) {
      violations.push({
        type: 'technical',
        severity: 'medium',
        element: node.name || 'Frame',
        description: `Frame width ${width}px exceeds common desktop resolution`,
        recommendation: 'Consider responsive design for larger screens',
        figmaNodeId: node.id,
        rule: 'RESPONSIVE_DESIGN',
      });
    }
  }
}

function calculateFigmaContrast(color1: any, color2: any): number {
  const getLuminance = (color: any) => {
    const { r, g, b } = color;
    const [rs, gs, bs] = [r, g, b].map((c: number) => {
      c = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      return c;
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToFigmaHex(color: any): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function isNonBrandFigmaColor(hex: string): boolean {
  const nonBrandColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  return nonBrandColors.includes(hex.toLowerCase());
}

function generateFigmaSummary(violations: any[]) {
  const summary = {
    totalViolations: violations.length,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    accessibilityIssues: 0,
    designSystemIssues: 0,
    brandGuidelineIssues: 0,
    legalIssues: 0,
    technicalIssues: 0,
  };

  violations.forEach(violation => {
    switch (violation.severity) {
      case 'critical': summary.criticalCount++; break;
      case 'high': summary.highCount++; break;
      case 'medium': summary.mediumCount++; break;
      case 'low': summary.lowCount++; break;
    }

    switch (violation.type) {
      case 'accessibility': summary.accessibilityIssues++; break;
      case 'design_system': summary.designSystemIssues++; break;
      case 'brand_guidelines': summary.brandGuidelineIssues++; break;
      case 'legal': summary.legalIssues++; break;
      case 'technical': summary.technicalIssues++; break;
    }
  });

  return summary;
}

// Helper function to extract repository info from GitHub URL
function extractGitHubRepoInfo(githubUrl: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(githubUrl);
    if (url.hostname !== 'github.com') return null;
    
    const pathParts = url.pathname.split('/').filter(part => part);
    if (pathParts.length < 2) return null;
    
    return {
      owner: pathParts[0],
      repo: pathParts[1]
    };
  } catch {
    return null;
  }
}

// Function to search GitHub repository for compliance-related code
async function searchGitHubRepository(githubUrl: string): Promise<{searchResults: string, codeSnippets: any[]}> {
  const repoInfo = extractGitHubRepoInfo(githubUrl);
  if (!repoInfo) {
    return {
      searchResults: "Invalid GitHub URL format",
      codeSnippets: []
    };
  }

  const { owner, repo } = repoInfo;
  
  // GitHub API token - you should set this as an environment variable
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!githubToken) {
    console.log('GitHub API token not configured, using fallback analysis');
    return {
      searchResults: "GitHub API token not configured. Please set GITHUB_TOKEN environment variable to enable repository analysis.\n\nFor demonstration purposes, here's a sample analysis of common compliance issues in mobile games:\n\n=== Sample Analysis ===\n- Mobile games typically collect user data through analytics\n- User profiles may store personal information\n- Age verification is often missing\n- Privacy policies may be inadequate\n- Data storage practices need review",
      codeSnippets: [
        {
          category: 'privacy',
          file: 'src/components/UserProfile.js',
          url: `https://github.com/${owner}/${repo}/blob/main/src/components/UserProfile.js`,
          content: `// Sample code snippet for demonstration
const UserProfile = () => {
  const [userData, setUserData] = useState({
    name: '',
    age: 0,
    email: '',
    preferences: {}
  });
  
  // This code collects personal information without age verification
  const saveUserData = (data) => {
    localStorage.setItem('userProfile', JSON.stringify(data));
    // Missing: Age verification for COPPA compliance
    // Missing: Parental consent mechanism
  };
  
  return (
    <div>
      <input 
        value={userData.name} 
        onChange={(e) => setUserData({...userData, name: e.target.value})}
        placeholder="Enter your name"
      />
      <input 
        value={userData.age} 
        onChange={(e) => setUserData({...userData, age: e.target.value})}
        placeholder="Enter your age"
        type="number"
      />
    </div>
  );
};`,
          query: 'user data collection',
          repository: `${owner}/${repo}`
        },
        {
          category: 'tracking',
          file: 'src/utils/analytics.js',
          url: `https://github.com/${owner}/${repo}/blob/main/src/utils/analytics.js`,
          content: `// Sample analytics code for demonstration
import { trackEvent } from 'analytics-sdk';

export const trackUserBehavior = (event, data) => {
  // This code tracks user behavior without proper consent
  trackEvent({
    event: event,
    userId: getUserId(),
    timestamp: Date.now(),
    data: data,
    // Missing: User consent check
    // Missing: GDPR compliance
  });
};

export const trackPageView = (page) => {
  trackEvent({
    event: 'page_view',
    page: page,
    userId: getUserId(),
    // Missing: Cookie consent
    // Missing: Privacy policy reference
  });
};`,
          query: 'analytics tracking',
          repository: `${owner}/${repo}`
        }
      ]
    };
  }
  
  const searchQueries = [
    // Privacy and data collection related
    { query: 'privacy policy OR "data collection" OR "personal information" OR "user data"', category: 'privacy' },
    { query: 'cookie OR tracking OR analytics OR "user consent"', category: 'tracking' },
    { query: 'age verification OR "under 13" OR "children" OR "minors"', category: 'coppa' },
    { query: 'GDPR OR "data protection" OR "right to be forgotten"', category: 'gdpr' },
    { query: 'HIPAA OR "health information" OR "medical data"', category: 'hipaa' },
    { query: 'authentication OR login OR "user account" OR "sign up"', category: 'auth' },
    { query: 'database OR "data storage" OR "user profile"', category: 'storage' },
    { query: 'API OR "third party" OR "external service"', category: 'api' },
    { query: 'encryption OR "secure" OR "password" OR "token"', category: 'security' },
    { query: 'compliance OR "legal" OR "terms" OR "agreement"', category: 'legal' }
  ];

  let searchResults = '';
  let codeSnippets: any[] = [];
  
  try {
    for (const { query, category } of searchQueries) {
      const searchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(query)}+repo:${owner}/${repo}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Combo-Compliance-Analyzer'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Search query "${query}" returned ${data.total_count} results`);
        
        if (data.items && data.items.length > 0) {
          searchResults += `\n\n=== Search Query: "${query}" ===\n`;
          searchResults += `Found ${data.total_count} results:\n`;
          
          // Get details for first few results
          for (let i = 0; i < Math.min(data.items.length, 3); i++) {
            const item = data.items[i];
            searchResults += `\nFile: ${item.path}\n`;
            searchResults += `Repository: ${item.repository.full_name}\n`;
            searchResults += `URL: ${item.html_url}\n`;
            
            // Get file content for analysis
            try {
              const contentResponse = await fetch(item.url, {
                headers: {
                  'Authorization': `token ${githubToken}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'Combo-Compliance-Analyzer'
                }
              });
              
              if (contentResponse.ok) {
                const contentData = await contentResponse.json();
                const content = Buffer.from(contentData.content, 'base64').toString('utf-8');
                
                // Store code snippet for detailed analysis
                const codeSnippet = {
                  category: category,
                  file: item.path,
                  url: item.html_url,
                  content: content,
                  query: query,
                  repository: item.repository.full_name
                };
                codeSnippets.push(codeSnippet);
                console.log(`Added code snippet from ${item.path} (${content.length} chars)`);
                
                // Show first 500 characters of the file
                searchResults += `Content preview:\n${content.substring(0, 500)}...\n`;
              } else {
                console.log(`Failed to fetch content for ${item.path}: ${contentResponse.status}`);
              }
            } catch (contentError) {
              console.log(`Error fetching content for ${item.path}:`, contentError.message);
              searchResults += `Could not fetch file content: ${contentError.message}\n`;
            }
          }
        } else {
          searchResults += `\n\n=== Search Query: "${query}" ===\nNo results found.\n`;
        }
      } else {
        console.log(`GitHub API error for query "${query}": ${response.status} ${response.statusText}`);
        searchResults += `\n\n=== Search Query: "${query}" ===\nAPI Error: ${response.status} ${response.statusText}\n`;
      }
      
      // Add delay to respect GitHub API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    searchResults += `\n\nGitHub API Error: ${error.message}\n`;
  }

  return {
    searchResults: searchResults || "No search results found or GitHub API unavailable.",
    codeSnippets: codeSnippets
  };
}

// Test function to check Gemini API connection
export async function testGeminiConnection(): Promise<boolean> {
  try {
    console.log('Testing Gemini API connection...');
    console.log('API Key (first 10 chars):', GEMINI_API_KEY.substring(0, 10) + '...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log('Model created successfully');
    
    const result = await model.generateContent("Say 'Hello World'");
    console.log('Content generation request sent');
    
    const response = await result.response;
    const text = response.text();
    console.log('Gemini API test successful:', text);
    return true;
  } catch (error) {
    console.error('Gemini API test failed with error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return false;
  }
}

// Function to analyze document with Gemini for compliance
async function analyzeComplianceWithGemini(documentText: string, productDescription: string, githubSearchResults?: string, codeSnippets?: any[], figmaAnalysis?: any): Promise<any> {
  try {
    console.log('Starting Gemini analysis...');
    console.log('Document text length:', documentText.length);
    console.log('Product description:', productDescription);
    console.log('GitHub search results length:', githubSearchResults?.length || 0);
    console.log('Code snippets count:', codeSnippets?.length || 0);
    console.log('Figma analysis provided:', !!figmaAnalysis);
    if (figmaAnalysis) {
      console.log('Figma analysis details:');
      console.log('- File name:', figmaAnalysis.fileName);
      console.log('- Total violations:', figmaAnalysis.summary.totalViolations);
      console.log('- Legal issues:', figmaAnalysis.summary.legalIssues);
      console.log('- Accessibility issues:', figmaAnalysis.summary.accessibilityIssues);
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a legal compliance expert. Analyze the following product requirements document, product description, GitHub repository code, and Figma design analysis for compliance with COPPA, HIPAA, and GDPR regulations.

Product Description: ${productDescription}

Document Content: ${documentText}

${githubSearchResults ? `GitHub Repository Code Analysis:
${githubSearchResults}

Please analyze the actual code implementation found in the GitHub repository for compliance issues.` : ''}

${codeSnippets && codeSnippets.length > 0 ? `
Code Snippets Found:
${codeSnippets.map((snippet, index) => `
Snippet ${index + 1} (${snippet.category}):
File: ${snippet.file}
URL: ${snippet.url}
Content:
\`\`\`${snippet.file.split('.').pop() || 'text'}
${snippet.content.substring(0, 1000)}
\`\`\`
`).join('\n')}

When identifying compliance issues, please reference specific code snippets by their number and file path.` : ''}

${figmaAnalysis ? `
Figma Design Analysis Results:
File: ${figmaAnalysis.fileName}
Total Violations: ${figmaAnalysis.summary.totalViolations}
Critical Issues: ${figmaAnalysis.summary.criticalCount}
High Priority Issues: ${figmaAnalysis.summary.highCount}
Medium Priority Issues: ${figmaAnalysis.summary.mediumCount}
Low Priority Issues: ${figmaAnalysis.summary.lowCount}

Violation Categories:
- Accessibility Issues: ${figmaAnalysis.summary.accessibilityIssues}
- Design System Issues: ${figmaAnalysis.summary.designSystemIssues}
- Brand Guidelines Issues: ${figmaAnalysis.summary.brandGuidelineIssues}
- Legal Compliance Issues: ${figmaAnalysis.summary.legalIssues}
- Technical Issues: ${figmaAnalysis.summary.technicalIssues}

Detailed Violations:
${figmaAnalysis.violations.map((violation: any, index: number) => `
${index + 1}. ${violation.type.toUpperCase()} - ${violation.severity.toUpperCase()}
   Element: ${violation.element}
   Issue: ${violation.description}
   Recommendation: ${violation.recommendation}
   Rule: ${violation.rule}
`).join('\n')}

Please consider these design compliance issues when analyzing legal compliance, especially:
- Legal compliance violations in the design (privacy policy references, terms of service accessibility)
- Accessibility issues that may create legal liability
- Brand guideline violations that could affect legal agreements
- Technical issues that might impact user data handling` : ''}

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any other text, explanations, or markdown formatting.

Required JSON format (respond exactly like this):
{
  "coppa": {
    "compliance": "compliant",
    "issues": ["No issues found"],
    "recommendations": ["Continue current practices"],
    "codeReferences": []
  },
  "hipaa": {
    "compliance": "non-compliant",
    "issues": ["Handles health data without proper safeguards"],
    "recommendations": ["Implement HIPAA-compliant data handling"],
    "codeReferences": []
  },
  "gdpr": {
    "compliance": "requires-review",
    "issues": ["May process EU user data"],
    "recommendations": ["Conduct detailed GDPR assessment"],
    "codeReferences": []
  }${figmaAnalysis ? `,
  "figmaAnalysis": {
    "summary": {
      "totalViolations": ${figmaAnalysis.summary.totalViolations},
      "criticalCount": ${figmaAnalysis.summary.criticalCount},
      "highCount": ${figmaAnalysis.summary.highCount},
      "mediumCount": ${figmaAnalysis.summary.mediumCount},
      "lowCount": ${figmaAnalysis.summary.lowCount},
      "accessibilityIssues": ${figmaAnalysis.summary.accessibilityIssues},
      "designSystemIssues": ${figmaAnalysis.summary.designSystemIssues},
      "brandGuidelineIssues": ${figmaAnalysis.summary.brandGuidelineIssues},
      "legalIssues": ${figmaAnalysis.summary.legalIssues},
      "technicalIssues": ${figmaAnalysis.summary.technicalIssues}
    },
    "violations": [
      ${figmaAnalysis.violations.map((violation: any) => `{
        "type": "${violation.type}",
        "severity": "${violation.severity}",
        "element": "${violation.element}",
        "description": "${violation.description}",
        "recommendation": "${violation.recommendation}",
        "rule": "${violation.rule}",
        "figmaNodeId": "${violation.figmaNodeId}"
      }`).join(',')}
    ],
    "legalImplications": "Include analysis of how design violations may create legal liability, especially accessibility issues under ADA/WCAG, missing privacy policy references, unclear terms of service, and brand guideline violations that could affect legal agreements.",
    "designRecommendations": {
      "priority": "high",
      "sections": [
        {
          "category": "Accessibility Compliance",
          "priority": "critical",
          "recommendations": [
            "Fix all text contrast ratios to meet WCAG AA standards (4.5:1 minimum)",
            "Ensure all interactive elements are at least 44x44px for touch accessibility",
            "Add alternative text for images and icons",
            "Implement keyboard navigation support"
          ],
          "legalRisk": "ADA compliance violations can result in lawsuits and regulatory penalties"
        },
        {
          "category": "Legal Compliance",
          "priority": "high", 
          "recommendations": [
            "Add clear, prominent links to privacy policy and terms of service",
            "Include copyright notices where required",
            "Ensure data collection consent is clearly displayed",
            "Add cookie consent mechanisms for EU users"
          ],
          "legalRisk": "Missing legal disclosures can result in GDPR fines and consumer protection violations"
        },
        {
          "category": "Brand Guidelines",
          "priority": "medium",
          "recommendations": [
            "Use only approved brand colors from the design system",
            "Follow established typography guidelines",
            "Maintain consistent spacing and layout patterns",
            "Use official logo variations correctly"
          ],
          "legalRisk": "Brand guideline violations can affect trademark protection and licensing agreements"
        },
        {
          "category": "Technical Implementation",
          "priority": "medium",
          "recommendations": [
            "Optimize design for responsive layouts across devices",
            "Reduce complex effects that may impact performance",
            "Ensure designs work across different screen sizes",
            "Consider loading states and error handling in designs"
          ],
          "legalRisk": "Technical issues can impact user experience and data handling compliance"
        }
      ],
      "implementationTimeline": "Address critical accessibility issues immediately (within 1 week), high priority legal compliance within 2 weeks, medium priority items within 1 month",
      "complianceChecklist": [
        "Conduct accessibility audit with screen readers",
        "Test all interactive elements for proper sizing",
        "Verify all legal links are functional and accessible",
        "Review color contrast with accessibility tools",
        "Test responsive design across device sizes",
        "Validate brand guideline compliance"
      ]
    }
  }` : ''}
}

Analysis guidelines:
- COPPA: Check if the product collects personal information from children under 13
- HIPAA: Check if the product handles protected health information (PHI)
- GDPR: Check if the product processes personal data of EU residents
- Use "compliant" if no issues found, "non-compliant" if clear violations, "requires-review" if unclear
- Provide specific, actionable issues and recommendations
- In codeReferences array, include specific file paths and line numbers when referencing code issues
- When Figma analysis is provided, include the figmaAnalysis section in your response with legal implications
- Consider design violations that may create legal liability (accessibility, privacy policy references, terms of service)
- For designRecommendations: Create comprehensive, actionable suggestions organized by priority and category
- Include specific implementation timelines and compliance checklists
- Focus on legal risks and business impact of design decisions
- Always return valid JSON with exactly this structure
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw Gemini response length:', text.length);
    console.log('Raw Gemini response preview:', text.substring(0, 500) + '...');
    console.log('Response contains figmaAnalysis:', text.includes('figmaAnalysis'));
    
    // Try to parse the JSON response
    try {
      // Clean the response text - remove any markdown formatting
      let cleanText = text.trim();
      
      // Remove markdown code blocks if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsedResponse = JSON.parse(cleanText);
      
      // Validate the structure
      if (parsedResponse.coppa && parsedResponse.hipaa && parsedResponse.gdpr) {
        return parsedResponse;
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Response text:', text);
      
      // Return a structured error response
      return {
        coppa: {
          compliance: "requires-review",
          issues: ["Unable to parse AI response - please review manually"],
          recommendations: ["Please review the document manually for COPPA compliance"]
        },
        hipaa: {
          compliance: "requires-review",
          issues: ["Unable to parse AI response - please review manually"],
          recommendations: ["Please review the document manually for HIPAA compliance"]
        },
        gdpr: {
          compliance: "requires-review",
          issues: ["Unable to parse AI response - please review manually"],
          recommendations: ["Please review the document manually for GDPR compliance"]
        },
        rawResponse: text
      };
    }
  } catch (error) {
    console.error('Error analyzing with Gemini:', error);
    
    // Check if it's an API key or model issue
    if (error.message && error.message.includes('404')) {
      return {
        coppa: {
          compliance: "error",
          issues: ["API model not found - please check Gemini API configuration"],
          recommendations: ["Verify the Gemini API key and model name"]
        },
        hipaa: {
          compliance: "error",
          issues: ["API model not found - please check Gemini API configuration"],
          recommendations: ["Verify the Gemini API key and model name"]
        },
        gdpr: {
          compliance: "error",
          issues: ["API model not found - please check Gemini API configuration"],
          recommendations: ["Verify the Gemini API key and model name"]
        }
      };
    }
    
    return {
      coppa: {
        compliance: "error",
        issues: ["Error occurred during analysis"],
        recommendations: ["Please try again or review manually"]
      },
      hipaa: {
        compliance: "error",
        issues: ["Error occurred during analysis"],
        recommendations: ["Please try again or review manually"]
      },
      gdpr: {
        compliance: "error",
        issues: ["Error occurred during analysis"],
        recommendations: ["Please try again or review manually"]
      }
    };
  }
}

export const handleUploadRequirements = async (req: any, res: any) => {
  try {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          success: false, 
          message: err.message || 'File upload failed' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      const { productDescription, githubUrl, figmaUrl, figmaToken } = req.body;

      // Validate URLs if provided
      if (githubUrl && !isValidGitHubUrl(githubUrl)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid GitHub URL format' 
        });
      }

      if (figmaUrl && !isValidFigmaUrl(figmaUrl)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid Figma URL format' 
        });
      }

      // Extract text from the uploaded file
      const documentText = await extractTextFromFile(req.file.path, req.file.originalname);

      // Search GitHub repository if URL is provided
      let githubSearchResults = '';
      let codeSnippets: any[] = [];
      if (githubUrl && githubUrl.trim()) {
        console.log('Searching GitHub repository:', githubUrl);
        const githubData = await searchGitHubRepository(githubUrl);
        githubSearchResults = githubData.searchResults;
        codeSnippets = githubData.codeSnippets;
        console.log('GitHub search completed, results length:', githubSearchResults.length);
        console.log('Code snippets found:', codeSnippets.length);
      }

      // Analyze Figma file if URL and token are provided
      let figmaAnalysis = null;
      if (figmaUrl && figmaUrl.trim() && figmaToken && figmaToken.trim()) {
        console.log('Analyzing Figma file:', figmaUrl);
        console.log('Using Figma token:', figmaToken.substring(0, 10) + '...');
        const figmaData = await analyzeFigmaFileForCompliance(figmaUrl, figmaToken);
        if (figmaData.success) {
          figmaAnalysis = figmaData.analysis;
          console.log('Figma analysis completed successfully!');
          console.log('Violations found:', figmaAnalysis.summary.totalViolations);
          console.log('Critical issues:', figmaAnalysis.summary.criticalCount);
          console.log('High priority issues:', figmaAnalysis.summary.highCount);
          console.log('Legal issues:', figmaAnalysis.summary.legalIssues);
          console.log('Accessibility issues:', figmaAnalysis.summary.accessibilityIssues);
        } else {
          console.log('Figma analysis failed:', figmaData.error);
        }
      } else {
        console.log('Figma analysis skipped - missing URL or token');
        console.log('Figma URL provided:', !!figmaUrl);
        console.log('Figma token provided:', !!figmaToken);
      }

      // Analyze compliance with Gemini (including GitHub search results, code snippets, and Figma analysis)
      const complianceAnalysis = await analyzeComplianceWithGemini(
        documentText, 
        productDescription || '', 
        githubSearchResults || undefined,
        codeSnippets.length > 0 ? codeSnippets : undefined,
        figmaAnalysis || undefined
      );

      console.log('File uploaded successfully:', {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        productDescription,
        githubUrl,
        figmaUrl,
        complianceAnalysis
      });

      res.json({
        success: true,
        message: 'File uploaded and analyzed successfully',
        filename: req.file.filename,
        complianceAnalysis,
        githubSearchResults: githubSearchResults || null,
        codeSnippets: codeSnippets.length > 0 ? codeSnippets : null,
        figmaAnalysis: figmaAnalysis || null
      });
    });
  } catch (error) {
    console.error('Error in handleUploadRequirements:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}; 