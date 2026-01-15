
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, Situation } from "../types";

// Khởi tạo client AI với API Key từ môi trường
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

/**
 * Hàm hỗ trợ làm sạch và parse JSON từ phản hồi của AI
 */
const safeParseJSON = (text: string) => {
  try {
    // Loại bỏ các ký tự không phải JSON nếu AI vô tình thêm vào (như markdown ```json)
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Lỗi parse JSON từ AI:", e);
    return null;
  }
};

export const generateSituation = async (
  missionTitle: string,
  history: string[]
): Promise<Situation> => {
  const prompt = `
    Bạn là một chuyên gia giáo dục kỹ năng số tại Việt Nam. 
    Hãy tạo ra 1 tình huống ứng xử trên mạng mới lạ, thực tế cho học sinh lớp 5.
    Chủ đề: ${missionTitle}
    Các tình huống trước đó: ${history.join(" | ")}

    Yêu cầu:
    - Ngôn ngữ phù hợp trẻ em 10-11 tuổi.
    - Tình huống ngắn (2 câu).
    - Câu hỏi cuối: "Nếu là em, em sẽ làm gì?".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            question: { type: Type.STRING }
          },
          required: ["description", "question"]
        }
      }
    });

    const data = safeParseJSON(response.text || "{}");
    
    if (!data || !data.description) throw new Error("AI returned invalid data");

    return {
      id: Math.random().toString(36).substr(2, 9),
      description: data.description,
      question: data.question || "Nếu là em, em sẽ làm gì?"
    };
  } catch (error) {
    console.error("Lỗi tạo tình huống:", error);
    return {
      id: "fallback-" + Date.now(),
      description: "Có một người lạ nhắn tin hỏi tên trường và lớp của em để gửi quà tặng.",
      question: "Nếu là em, em sẽ làm gì?"
    };
  }
};

export const evaluateAnswer = async (
  missionTitle: string,
  situation: string,
  answer: string
): Promise<AIResponse> => {
  const prompt = `
    Đánh giá câu trả lời của học sinh lớp 5 cho tình huống an toàn số sau:
    Nhiệm vụ: ${missionTitle}
    Tình huống: ${situation}
    Câu trả lời: ${answer}

    Tiêu chí:
    - score: 1 (an toàn/đúng), 0.5 (khá), 0 (nguy hiểm/sai).
    - feedback: Nhận xét tích cực, dễ hiểu.
    - suggestion: Lời khuyên cụ thể để bảo vệ bản thân.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            consequence: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            isAppropriate: { type: Type.BOOLEAN }
          },
          required: ["score", "feedback", "consequence", "suggestion", "isAppropriate"]
        }
      }
    });

    const data = safeParseJSON(response.text || "{}");
    return data || {
      score: 0.5,
      feedback: "Cảm ơn em đã chia sẻ ý kiến!",
      consequence: "Mọi hành động trên mạng đều để lại dấu vết.",
      suggestion: "Hãy luôn trao đổi với bố mẹ hoặc thầy cô nhé.",
      isAppropriate: true
    };
  } catch (error) {
    console.error("Lỗi đánh giá:", error);
    return {
      score: 0.5,
      feedback: "AI đang gặp chút vấn đề nhưng rất khen ngợi tinh thần học hỏi của em!",
      consequence: "Em đang rèn luyện tư duy phản biện.",
      suggestion: "Hãy tiếp tục suy nghĩ kỹ trước khi thực hiện bất kỳ thao tác nào trên mạng.",
      isAppropriate: true
    };
  }
};

export const askAssistant = async (question: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Bạn là trợ lý ảo 'Hiệp Sĩ Số' thân thiện. Trả lời câu hỏi của học sinh lớp 5 về an toàn mạng một cách ngắn gọn, súc tích: ${question}`,
    });
    return response.text || "Mình chưa rõ ý em, em có thể hỏi lại không?";
  } catch (e) {
    console.error("Lỗi trợ lý:", e);
    return "Hệ thống đang nghỉ ngơi một chút, em quay lại sau nhé!";
  }
};
