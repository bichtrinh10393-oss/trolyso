
import { AIResponse, Situation } from "./types";

/**
 * Hàm gọi đến Serverless Function tại /api/gemini
 */
const callAI = async (contents: any, config?: any) => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, config }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Lỗi kết nối AI');
  }

  return await response.json();
};

export const generateSituation = async (
  missionTitle: string,
  history: string[]
): Promise<Situation> => {
  const prompt = `
    Bạn là chuyên gia giáo dục kỹ năng số Việt Nam. 
    Tạo 1 tình huống ứng xử mạng thực tế cho học sinh lớp 5.
    Chủ đề: ${missionTitle}
    Tránh trùng lặp với: ${history.join(" | ")}

    Yêu cầu JSON:
    - description: Tình huống ngắn (2 câu).
    - question: "Nếu là em, em sẽ làm gì?".
  `;

  try {
    const data = await callAI(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          description: { type: "STRING" },
          question: { type: "STRING" }
        },
        required: ["description", "question"]
      }
    });

    const parsed = JSON.parse(data.text || "{}");
    return {
      id: Math.random().toString(36).substr(2, 9),
      description: parsed.description,
      question: parsed.question || "Nếu là em, em sẽ làm gì?"
    };
  } catch (error) {
    console.error("Generate Situation Error:", error);
    return {
      id: "fallback",
      description: "Có người lạ nhắn tin yêu cầu em cung cấp mật khẩu tài khoản game.",
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
    Đánh giá câu trả lời của học sinh lớp 5:
    Nhiệm vụ: ${missionTitle}
    Tình huống: ${situation}
    Trả lời: ${answer}

    Trả về JSON: score (0-1), feedback, consequence, suggestion, isAppropriate.
  `;

  try {
    const data = await callAI(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          score: { type: "NUMBER" },
          feedback: { type: "STRING" },
          consequence: { type: "STRING" },
          suggestion: { type: "STRING" },
          isAppropriate: { type: "BOOLEAN" }
        },
        required: ["score", "feedback", "consequence", "suggestion", "isAppropriate"]
      }
    });

    return JSON.parse(data.text || "{}");
  } catch (error) {
    return {
      score: 0.5,
      feedback: "Cảm ơn em đã đưa ra ý kiến!",
      consequence: "Em đang học cách bảo vệ mình.",
      suggestion: "Nên hỏi ý kiến người lớn khi gặp rắc rối.",
      isAppropriate: true
    };
  }
};

export const askAssistant = async (question: string): Promise<string> => {
  try {
    const data = await callAI(`Bạn là hiệp sĩ an toàn mạng. Trả lời ngắn gọn cho trẻ em: ${question}`);
    return data.text || "Mình chưa hiểu, em hỏi lại nhé!";
  } catch (e) {
    return "Hệ thống bận, em thử lại sau!";
  }
};
