
import { SYSTEM_INSTRUCTION } from "./constants";

export class DigitalCitizenAssistant {
  private history: any[] = [];
  private missionTitle: string;

  constructor(missionTitle: string) {
    this.missionTitle = missionTitle;
    this.history = [];
  }

  /**
   * Gửi yêu cầu đến Vercel Serverless Function (/api/gemini)
   */
  private async fetchGemini(prompt: string) {
    // Thêm tin nhắn của người dùng vào lịch sử cục bộ
    this.history.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: this.history,
        systemInstruction: SYSTEM_INSTRUCTION
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Không thể kết nối với API');
    }

    const data = await response.json();
    
    // Thêm phản hồi của mô hình vào lịch sử để giữ ngữ cảnh
    this.history.push({
      role: 'model',
      parts: [{ text: data.text }]
    });

    return JSON.parse(data.text);
  }

  /**
   * Bắt đầu nhiệm vụ mới
   */
  async startMission(missionTitle: string) {
    const prompt = `Bắt đầu ${missionTitle}. Hãy giới thiệu nhiệm vụ và đưa ra tình huống đầu tiên.`;
    return this.fetchGemini(prompt);
  }

  /**
   * Xử lý câu trả lời của học sinh
   */
  async processResponse(userInput: string) {
    return this.fetchGemini(userInput);
  }
}
