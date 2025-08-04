import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UploadResponse } from "@shared/api";

// Helper function to validate GitHub URL format
const isValidGitHubUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').length >= 3;
  } catch {
    return false;
  }
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "data");
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    const filename = `${nameWithoutExt}_${timestamp}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

export const handleUploadRequirements: RequestHandler = (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const response: UploadResponse = {
        success: false,
        message: err.message || 'File upload failed'
      };
      return res.status(400).json(response);
    }

    if (!req.file) {
      const response: UploadResponse = {
        success: false,
        message: 'No file uploaded'
      };
      return res.status(400).json(response);
    }

    // Get the product description and GitHub URL from the form data
    const productDescription = req.body.productDescription || 'No description provided';
    const githubUrl = req.body.githubUrl || null;

    // Validate GitHub URL if provided
    if (githubUrl && !isValidGitHubUrl(githubUrl)) {
      const response: UploadResponse = {
        success: false,
        message: 'Invalid GitHub URL format. Please provide a valid GitHub repository URL.'
      };
      return res.status(400).json(response);
    }

    // Log the upload details
    console.log('File uploaded successfully:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      productDescription: productDescription,
      githubUrl: githubUrl
    });

    const response: UploadResponse = {
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.filename
    };

    res.status(200).json(response);
  });
}; 