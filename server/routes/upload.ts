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

// Function to analyze document with Gemini for compliance
async function analyzeComplianceWithGemini(documentText: string, productDescription: string): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Please analyze the following product requirements document and product description for compliance with COPPA, HIPAA, and GDPR regulations.

Product Description: ${productDescription}

Document Content: ${documentText}

Please provide a detailed analysis for each regulation:

1. COPPA (Children's Online Privacy Protection Act):
   - Does the product collect personal information from children under 13?
   - What are the compliance requirements and potential issues?
   - Recommendations for compliance

2. HIPAA (Health Insurance Portability and Accountability Act):
   - Does the product handle protected health information (PHI)?
   - What are the compliance requirements and potential issues?
   - Recommendations for compliance

3. GDPR (General Data Protection Regulation):
   - Does the product process personal data of EU residents?
   - What are the compliance requirements and potential issues?
   - Recommendations for compliance

Please format your response as a JSON object with the following structure:
{
  "coppa": {
    "compliance": "compliant/non-compliant/requires-review",
    "issues": ["list of specific issues"],
    "recommendations": ["list of recommendations"]
  },
  "hipaa": {
    "compliance": "compliant/non-compliant/requires-review",
    "issues": ["list of specific issues"],
    "recommendations": ["list of recommendations"]
  },
  "gdpr": {
    "compliance": "compliant/non-compliant/requires-review",
    "issues": ["list of specific issues"],
    "recommendations": ["list of recommendations"]
  }
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the JSON response
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // If JSON parsing fails, return a structured response
      return {
        coppa: {
          compliance: "requires-review",
          issues: ["Unable to parse AI response"],
          recommendations: ["Please review the document manually"]
        },
        hipaa: {
          compliance: "requires-review",
          issues: ["Unable to parse AI response"],
          recommendations: ["Please review the document manually"]
        },
        gdpr: {
          compliance: "requires-review",
          issues: ["Unable to parse AI response"],
          recommendations: ["Please review the document manually"]
        },
        rawResponse: text
      };
    }
  } catch (error) {
    console.error('Error analyzing with Gemini:', error);
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