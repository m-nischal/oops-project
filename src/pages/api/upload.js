// src/pages/api/upload.js
import multer from 'multer';
import path from 'path';

// --- Helper to run middleware ---
// This allows us to use multer (which is Express/Connect middleware)
// in a standard Next.js API route.
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// --- Configuration for Multer (same as before) ---
const storage = multer.diskStorage({
  destination: './public/uploads', //
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// We re-use the same multer instance
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// --- API Route Handler ---
export const config = {
  api: {
    bodyParser: false, // Disable body parser, multer handles it
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Run the multer middleware for our fields
    await runMiddleware(req, res, upload.fields([
      { name: 'productImages', maxCount: 10 },
      { name: 'productImage', maxCount: 1 }
    ]));
    
    // After middleware, req.files will be populated
    if (!req.files || (Object.keys(req.files).length === 0)) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    // Process the files and get URLs
    const urls = {};
    if (req.files.productImages) {
      urls.productImages = req.files.productImages.map(file => `/uploads/${file.filename}`);
    }
    if (req.files.productImage) {
      urls.productImage = req.files.productImage.map(file => `/uploads/${file.filename}`);
    }
    
    return res.status(200).json({ 
      message: 'Files uploaded successfully', 
      urls: urls // Return an object with both field arrays
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Something went wrong!' });
  }
}