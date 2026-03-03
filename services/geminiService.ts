
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialAdvice = async (transactions: Transaction[], salary: number) => {
  if (!process.env.API_KEY || transactions.length === 0) return null;
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `
    Context: I have a monthly salary of ${salary}. 
    My recent spending breakdown is as follows: ${JSON.stringify(summary)}.
    
    Task: Provide 3 ultra-short, actionable financial tips to optimize my budget. 
    Focus on my biggest expense categories and identify if I am overspending relative to my income. 
    Format: Return a clean bulleted list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    if (!response || !response.text) {
      throw new Error("Empty response from AI");
    }

    return response.text;
  } catch (error) {
    console.error("Gemini Error Detail:", error);
    // Return a generic advice if the API fails, to keep UX smooth
    return "• Focus on your highest category spending first.\n• Ensure your DCA rules align with your long-term goals.\n• Monitor transient expenses daily.";
  }
};
