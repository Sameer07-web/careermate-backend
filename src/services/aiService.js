const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Resume = require('../models/Resume');
const ResumeVersion = require('../models/ResumeVersion');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_KEY');

class AiService {
  /**
   * Generates a title for the session based on the first user message
   */
  async generateSessionTitle(firstMessage) {
    if (!process.env.GEMINI_API_KEY) return 'New Conversation';
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Generate a very short, concise title (max 5 words) summarizing this message: "${firstMessage}". Return ONLY the title string, no quotes.`;
      
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('Error generating title:', error);
      return 'New Conversation';
    }
  }

  /**
   * Builds the comprehensive system context utilizing the user's profile and resume data.
   */
  async buildSystemContext(userId) {
    let contextStr = `You are CareerMate, an elite AI Career Coach, Technical Mentor, and Placement Advisor.
Your goal is to help software engineering students and graduates secure top jobs.
Format your responses consistently, using headings like: Summary, Recommendations, Action Items, and Resources (when applicable).
`;

    try {
      const user = await User.findById(userId);
      if (user) {
        contextStr += `\n--- USER PROFILE ---
Name: ${user.name}
Target Role: ${user.profile.targetRole || 'Not specified'}
Experience Level: ${user.profile.experienceLevel || 'Entry'}
Skills: ${user.profile.skills.join(', ') || 'None specified'}\n`;
      }

      const primaryResume = await Resume.findOne({ userId, isPrimary: true }).populate('primaryVersionId');
      if (primaryResume && primaryResume.primaryVersionId) {
        const version = primaryResume.primaryVersionId;
        contextStr += `\n--- PRIMARY RESUME DATA ---
ATS Score: ${version.analysis?.atsScore || 'N/A'}
Strengths: ${version.analysis?.strengths?.join(', ') || 'None'}
Weaknesses: ${version.analysis?.weaknesses?.join(', ') || 'None'}
Missing Keywords: ${version.analysis?.missingKeywords?.join(', ') || 'None'}
`;
      }
    } catch (error) {
      console.error('Error building context:', error);
    }

    return contextStr;
  }

  /**
   * Main function to generate a chat response
   */
  async generateChatResponse(userId, history, currentMessage) {
    if (!process.env.GEMINI_API_KEY) {
      return {
        content: `MOCK RESPONSE: ${currentMessage}\n\n**Summary**: Mock summary.\n**Recommendations**: Mock recs.\n**Action Items**: Mock actions.\n**Resources**: Mock resources.`,
        metadata: { model: 'mock-gemini', tokensUsed: 0 }
      };
    }

    try {
      // 1. Build System Instruction Context
      const systemInstruction = await this.buildSystemContext(userId);

      // 2. Initialize Model with system instruction
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: systemInstruction 
      });

      // 3. Format History (Last 10 messages max to save tokens/context)
      // Gemini expects format: { role: 'user' | 'model', parts: [{ text: '...' }] }
      const recentHistory = history.slice(-10).map(msg => ({
        role: msg.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // 4. Start Chat Session
      const chat = model.startChat({
        history: recentHistory,
      });

      // 5. Send Message
      const result = await chat.sendMessage(currentMessage);
      const responseText = result.response.text();
      
      // Attempt to extract token usage if available (Gemini API provides usageMetadata in some versions)
      const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;

      return {
        content: responseText,
        metadata: { model: 'gemini-1.5-flash', tokensUsed }
      };

    } catch (error) {
      console.error('Error in generateChatResponse:', error);
      throw new Error('AI Service failed to generate response');
    }
  }
}

module.exports = new AiService();
