import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UploadResponse } from "@shared/api";

// Configure multer for settlement file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "settlements");
    
    // Create settlements directory if it doesn't exist
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
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
    files: 10, // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for settlement documents.'));
    }
  }
});

export const handleUploadSettlements: RequestHandler = (req, res) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      const response: UploadResponse = {
        success: false,
        message: err.message || 'File upload failed'
      };
      return res.status(400).json(response);
    }

    if (!req.files || req.files.length === 0) {
      const response: UploadResponse = {
        success: false,
        message: 'No files uploaded'
      };
      return res.status(400).json(response);
    }

    const files = Array.isArray(req.files) ? req.files : [req.files];

    // Log the upload details
    console.log('Settlement files uploaded successfully:', {
      uploadedCount: files.length,
      files: files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size
      }))
    });

    const response: UploadResponse = {
      success: true,
      message: `${files.length} settlement files uploaded successfully`,
      filename: files.map(f => f.filename).join(', ')
    };

    res.status(200).json({
      ...response,
      uploadedCount: files.length,
      uploadedFiles: files.map(file => file.filename)
    });
  });
}; 