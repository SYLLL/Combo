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
async function analyzeComplianceWithGemini(documentText: string, productDescription: string): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a legal compliance expert. Analyze the following product requirements document and product description for compliance with COPPA, HIPAA, and GDPR regulations.

Product Description: ${productDescription}

Document Content: ${documentText}

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any other text, explanations, or markdown formatting.

Required JSON format (respond exactly like this):
{
  "coppa": {
    "compliance": "compliant",
    "issues": ["No issues found"],
    "recommendations": ["Continue current practices"]
  },
  "hipaa": {
    "compliance": "non-compliant",
    "issues": ["Handles health data without proper safeguards"],
    "recommendations": ["Implement HIPAA-compliant data handling"]
  },
  "gdpr": {
    "compliance": "requires-review",
    "issues": ["May process EU user data"],
    "recommendations": ["Conduct detailed GDPR assessment"]
  }
}

Analysis guidelines:
- COPPA: Check if the product collects personal information from children under 13
- HIPAA: Check if the product handles protected health information (PHI)
- GDPR: Check if the product processes personal data of EU residents
- Use "compliant" if no issues found, "non-compliant" if clear violations, "requires-review" if unclear
- Provide specific, actionable issues and recommendations
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

      // Analyze compliance with Gemini
      const complianceAnalysis = await analyzeComplianceWithGemini(documentText, productDescription || '');

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
        complianceAnalysis
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