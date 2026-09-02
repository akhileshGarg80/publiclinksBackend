import fs from 'fs';
import path from 'path';
import multer from 'multer';

// Ensure public/uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer memory storage (up to 10MB)
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('image');

/**
 * Upload image handler:
 * 1. Checks if file or base64 string provided
 * 2. If IMGBB_API_KEY is present, uploads to ImgBB API (https://api.imgbb.com/1/upload)
 * 3. If no key or ImgBB fails, saves locally into public/uploads and returns local server URL
 */
export async function handleImageUpload(req, res) {
  try {
    let imageBase64 = null;
    let originalName = 'upload.png';

    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
      originalName = req.file.originalname || 'upload.png';
    } else if (req.body && req.body.image) {
      // Direct base64 string
      const raw = req.body.image;
      imageBase64 = raw.includes('base64,') ? raw.split('base64,')[1] : raw;
      originalName = req.body.filename || 'upload.png';
    }

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'No image file or base64 payload provided'
      });
    }

    const imgbbKey = process.env.IMGBB_API_KEY;

    // Try ImgBB API first if key exists
    if (imgbbKey && imgbbKey.trim() !== '' && imgbbKey !== 'your_imgbb_api_key_here') {
      try {
        const formData = new URLSearchParams();
        formData.append('key', imgbbKey.trim());
        formData.append('image', imageBase64);
        if (originalName) formData.append('name', path.parse(originalName).name);

        const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: formData
        });

        const imgbbData = await imgbbRes.json();

        if (imgbbData && imgbbData.success && imgbbData.data) {
          const directUrl = imgbbData.data.url || imgbbData.data.display_url;
          return res.status(200).json({
            success: true,
            provider: 'imgbb',
            url: directUrl,
            thumb: imgbbData.data.thumb ? imgbbData.data.thumb.url : directUrl,
            delete_url: imgbbData.data.delete_url
          });
        }
        console.warn('ImgBB API returned non-success:', imgbbData);
      } catch (imgbbErr) {
        console.warn('ImgBB upload error, falling back to local storage:', imgbbErr.message);
      }
    }

    // Fallback: Save to local public/uploads directory
    const ext = path.extname(originalName) || '.png';
    const uniqueFilename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    const buffer = Buffer.from(imageBase64, 'base64');

    fs.writeFileSync(filePath, buffer);

    const protocol = req.protocol || 'http';
    const host = req.get('host') || `localhost:${process.env.PORT || 3000}`;
    const localUrl = `${protocol}://${host}/uploads/${uniqueFilename}`;

    return res.status(200).json({
      success: true,
      provider: 'local',
      url: localUrl,
      filename: uniqueFilename,
      message: imgbbKey ? 'Uploaded to server storage (ImgBB fallback)' : 'Uploaded to server storage. Set IMGBB_API_KEY in .env to use ImgBB directly.'
    });

  } catch (error) {
    console.error('Image upload failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process image upload: ' + error.message
    });
  }
}
