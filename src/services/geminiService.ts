import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const transcribeAudio = async (
  audioBase64: string,
  mimeType: string
): Promise<TranscriptionResult> => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a world-class transcription engine specializing in capturing human personality and nuances.
    Your task is to transcribe the provided audio and then create a refined version of it.
    
    Rules:
    1. VERBATIM TRANSCRIPTION: Transcribe EVERYTHING word-for-word. Do not skip filler words (um, ah, like), but accurately reflect the speaker's tone, pacing, and intent.
    2. MULTI-LANGUAGE SUPPORT: Support code-switching. If the user speaks multiple languages or mixes them, transcribe each exactly as heard.
    3. CONCISE VERSION (PERSONALIZED): Create a shortened version of the transcript. 
       - CRITICAL: This version MUST preserve the speaker's original tone, personality, and emotional energy. 
       - If they are casual and slangy, stay casual. If they are formal, stay formal.
       - Remove stutters, redundant fillers, and repetitive "thinking out loud" sections, but do NOT make it sound like a generic AI summary. 
       - It should sound like a focused, clear version of the original person.
    
    Output Format:
    Return a JSON object with:
    - verbatim: The literal word-for-word transcription.
    - concise: The polished, shortened version that retains the speaker's unique voice.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType,
            },
          },
          {
            text: "Transcribe this audio. Ensure the concise version perfectly mirrors the speaker's original personality and tone.",
          },
        ],
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verbatim: { type: Type.STRING },
            concise: { type: Type.STRING },
          },
          required: ["verbatim", "concise"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No transcription received from Gemini");
    
    return JSON.parse(resultText) as TranscriptionResult;
  } catch (error) {
    console.error("Transcription failed:", error);
    throw error;
  }
};
