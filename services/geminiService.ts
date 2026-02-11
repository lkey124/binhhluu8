import { GoogleGenAI, Type } from "@google/genai";

export const generateAiWord = async (customTopic: string): Promise<{ word: string; category: string } | null> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = customTopic 
      ? `Hãy đưa ra 1 từ khoá tiếng Việt thuộc chủ đề "${customTopic}" để chơi trò Ai là kẻ nói dối. Từ khoá nên phổ biến.`
      : `Hãy đưa ra 1 từ khoá tiếng Việt ngẫu nhiên (danh từ) và chủ đề của nó để chơi trò Ai là kẻ nói dối. Chủ đề nên thú vị.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "Từ khoá chính (Ví dụ: Con mèo)" },
            category: { type: Type.STRING, description: "Chủ đề của từ khoá (Ví dụ: Động vật)" }
          },
          required: ["word", "category"]
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