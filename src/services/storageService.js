const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

class StorageService {
  /**
   * Save a file. Currently uses local disk but abstracts the process.
   * @param {Object} file - The file object from Multer (req.file)
   * @returns {Promise<Object>} - Object containing fileUrl and stored file metadata
   */
  async saveFile(file) {
    try {
      const ext = path.extname(file.originalname);
      const fileName = `${uuidv4()}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // Move file from temporary multer buffer/path to permanent location
      fs.writeFileSync(filePath, file.buffer);

      // We use a local URL format for now.
      // In production, this would be S3 URL or Cloudinary URL.
      const fileUrl = `/uploads/resumes/${fileName}`;

      return {
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storagePath: filePath // Internal use
      };
    } catch (error) {
      console.error('StorageService error:', error);
      throw new Error('Failed to save file to storage');
    }
  }

  /**
   * Delete a file from storage.
   * @param {String} fileUrl - The public URL/path of the file to delete
   */
  async deleteFile(fileUrl) {
    try {
      // In local mode, fileUrl is `/uploads/resumes/filename`
      const fileName = path.basename(fileUrl);
      const filePath = path.join(uploadDir, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('StorageService delete error:', error);
      // We usually don't want to throw an error if file deletion fails, 
      // just log it, so it doesn't break the DB deletion process.
    }
  }
}

module.exports = new StorageService();
