const pdfParse = require('pdf-parse');

class ResumeExtractor {
  /**
   * Extracts text from a PDF buffer.
   * @param {Buffer} buffer - The PDF file buffer
   * @returns {Promise<String>} - The extracted raw text
   */
  async extractText(buffer) {
    try {
      const data = await pdfParse(buffer);
      // Data contains text, numpages, info, etc.
      return data.text.trim();
    } catch (error) {
      console.error('ResumeExtractor error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }
}

module.exports = new ResumeExtractor();
