import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI('AIzaSyA2LlGf7OC1hQcRU67yuOU7KiPruYRMpbE');

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
    console.log('API Key (first 10 chars):', 'AIzaSyA2LlGf7OC1hQcRU67yuOU7KiPruYRMpbE'.substring(0, 10) + '...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
async function analyzeComplianceWithGemini(documentText: string, productDescription: string, githubSearchResults?: string, codeSnippets?: any[]): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a legal compliance expert. Analyze the following product requirements document, product description, and GitHub repository code for compliance with COPPA, HIPAA, and GDPR regulations.

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
  }
}

Analysis guidelines:
- COPPA: Check if the product collects personal information from children under 13
- HIPAA: Check if the product handles protected health information (PHI)
- GDPR: Check if the product processes personal data of EU residents
- Use "compliant" if no issues found, "non-compliant" if clear violations, "requires-review" if unclear
- Provide specific, actionable issues and recommendations
- In codeReferences array, include specific file paths and line numbers when referencing code issues
- Always return valid JSON with exactly this structure
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw Gemini response:', text);
    
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

      const { productDescription, githubUrl, figmaUrl } = req.body;

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

      // Analyze compliance with Gemini (including GitHub search results and code snippets)
      const complianceAnalysis = await analyzeComplianceWithGemini(
        documentText, 
        productDescription || '', 
        githubSearchResults || undefined,
        codeSnippets.length > 0 ? codeSnippets : undefined
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
        codeSnippets: codeSnippets.length > 0 ? codeSnippets : null
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