class AtsService {
  /**
   * Mock asynchronous ATS Analysis pipeline.
   * In a real system, this would call Google Gemini API.
   * 
   * @param {String} extractedText - The raw text of the resume
   * @param {String} targetRole - The user's target role (optional context)
   * @returns {Promise<Object>} - The analysis result
   */
  async analyzeResume(extractedText, targetRole = 'Software Engineer') {
    // Simulate API delay of 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // For now, return mocked data. When Gemini is integrated, this will be dynamically generated.
    return {
      atsScore: Math.floor(Math.random() * 30) + 70, // Random score between 70 and 100
      keywordMatchPercentage: Math.floor(Math.random() * 40) + 50, // 50-90%
      missingKeywords: ['Docker', 'Kubernetes', 'CI/CD Pipeline', 'GraphQL'],
      suggestions: [
        'Quantify your achievements with exact metrics (e.g., "Increased performance by 20%").',
        'Add a dedicated skills section at the top of the resume.',
        'Use stronger action verbs to begin bullet points.'
      ],
      strengths: [
        'Clear educational background.',
        'Relevant modern tech stack mentioned (React, Node.js).',
        'Good use of whitespace and formatting.'
      ],
      weaknesses: [
        'Lacks quantifiable metrics.',
        'Too many generic phrases (e.g., "hard worker").'
      ],
      analyzedAt: new Date()
    };
  }
}

module.exports = new AtsService();
