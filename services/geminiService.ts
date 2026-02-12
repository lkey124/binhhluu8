
import { GoogleGenAI, Type } from "@google/genai";

export const generateAiWord = async (customTopic: string): Promise<{ word: string; category: string; whiteHatWord: string } | null> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = customTopic 
      ? `Hãy đưa ra 2 từ khoá tiếng Việt thuộc chủ đề "${customTopic}" để chơi trò Ai là kẻ nói dối. Từ thứ 1 là từ chính (dành cho Dân), từ thứ 2 là từ khác (dành cho Mũ Trắng). YÊU CẦU QUAN TRỌNG: Cả 2 từ phải cùng một chủ đề hẹp, rất dễ gây nhầm lẫn khi miêu tả.`
      : `Hãy đưa ra 2 từ khoá tiếng Việt ngẫu nhiên (danh từ) và chủ đề của nó. Từ thứ 1 là từ chính, từ thứ 2 là từ khác. YÊU CẦU QUAN TRỌNG: Cả 2 từ phải cùng một chủ đề hẹp, rất dễ gây nhầm lẫn khi miêu tả.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "Từ khoá chính (Ví dụ: Con mèo)" },
            whiteHatWord: { type: Type.STRING, description: "Từ khoá cho Mũ Trắng - Cùng chủ đề nhưng khác từ chính (Ví dụ: Con chó)" },
            category: { type: Type.STRING, description: "Chủ đề chung của cả 2 từ (Ví dụ: Thú cưng)" }
          },
          required: ["word", "whiteHatWord", "category"]
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};