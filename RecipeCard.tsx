import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Recipe {
  name: string;
  type: "meat" | "vegetable" | "soup";
  ingredients: string[];
  instructions: string[];
  description: string;
  imageUrl?: string;
}

export interface Menu {
  dishes: Recipe[];
  soup: Recipe;
}

export async function generateMenu(essentialIngredients: string[], spicyPreference: 'spicy' | 'non-spicy' | 'any' = 'any'): Promise<Menu> {
  const spicyText = spicyPreference === 'spicy' ? '口味要求：偏好辣味菜肴。' : 
                   spicyPreference === 'non-spicy' ? '口味要求：完全不辣，适合清淡口味。' : 
                   '口味要求：辣度不限。';

  const prompt = `请为我的家庭生成一个“三菜一汤”的食谱组合。
  要求：
  1. 荤素搭配：3个菜中应包含荤菜和素菜。
  2. 包含1个汤。
  3. ${spicyText}
  4. 如果提供了必备食材（${essentialIngredients.join(", ")}），请尽量在食谱中使用它们。
  5. 请提供菜名、类型（荤/素/汤）、食材清单、简要做法和一段诱人的描述。
  6. 语言：中文。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dishes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["meat", "vegetable"] },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                description: { type: Type.STRING },
              },
              required: ["name", "type", "ingredients", "instructions", "description"],
            },
            minItems: 3,
            maxItems: 3,
          },
          soup: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["soup"] },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING },
            },
            required: ["name", "type", "ingredients", "instructions", "description"],
          },
        },
        required: ["dishes", "soup"],
      },
    },
  });

  const menu = JSON.parse(response.text || "{}") as Menu;
  return menu;
}

export async function generateRecipeImage(recipeName: string): Promise<string | undefined> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `A high-quality, appetizing food photography of a Chinese dish named "${recipeName}". Professional lighting, top-down or 45-degree angle, served on a beautiful plate, steam rising, vibrant colors, wooden table background.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Error generating image for", recipeName, error);
  }
  return undefined;
}
