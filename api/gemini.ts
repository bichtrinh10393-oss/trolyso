
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contents, config } = req.body;
  
  // Sử dụng biến môi trường API_KEY (được Vercel inject tự động)
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key chưa được cấu hình trên Vercel.' });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config,
    });

    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error('Lỗi Gemini API (Server-side):', error);
    return res.status(500).json({ error: error.message || 'Lỗi hệ thống AI' });
  }
}
