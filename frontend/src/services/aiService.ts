export interface AIRecommendation {
  suggestedPrice: number;
  demand: string;
  sellingTime: string;
  buyersCount: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

export const aiService = {
  // Call Gemini 1.5 Flash to estimate fair agricultural pricing
  async getPriceRecommendation(category: string, grade: string, quantity: number): Promise<AIRecommendation> {
    if (!geminiApiKey) {
      console.log('VITE_GEMINI_API_KEY not found. Running AI price assistant in mock engine mode.');
      return this.getMockRecommendation(category, grade, quantity);
    }

    try {
      const prompt = `You are a professional AI agricultural trade advisor.
Analyze the following crop listing parameters:
- Crop Category: ${category}
- Quality Grade: ${grade}
- Available Quantity: ${quantity} kg

Provide a JSON block containing market recommendations. Return ONLY valid JSON, do not wrap in markdown quotes.
Response structure:
{
  "suggestedPrice": number (price per kg in INR, typical tomato: 20-30, grains: 25-45, fruits: 50-100),
  "demand": "High" | "Moderate" | "Low",
  "sellingTime": "Next 24 Hours" | "Next 48 Hours" | "Next 5 Days",
  "buyersCount": number (active buyers looking for this within 50km, between 5 and 20),
  "trend": "up" | "down" | "stable",
  "confidence": number (confidence percentage, between 90 and 99)
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API returned HTTP status ${response.status}`);
      }

      const result = await response.json();
      const textResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Sanitise text to extract raw JSON
      const cleanJson = textResponse
        .replace(/```json/gi, '')
        .replace(/```/gi, '')
        .trim();
      
      const parsedData = JSON.parse(cleanJson);
      return {
        suggestedPrice: Number(parsedData.suggestedPrice) || 30,
        demand: parsedData.demand || 'Moderate',
        sellingTime: parsedData.sellingTime || 'Next 48 Hours',
        buyersCount: Number(parsedData.buyersCount) || 8,
        trend: (parsedData.trend as 'up' | 'down' | 'stable') || 'stable',
        confidence: Number(parsedData.confidence) || 94
      };
    } catch (error) {
      console.warn('Gemini API call encountered an error. Falling back to local AI mock pricing data.', error);
      return this.getMockRecommendation(category, grade, quantity);
    }
  },

  // Fallback Rule-based engine
  getMockRecommendation(category: string, grade: string, quantity: number): AIRecommendation {
    let suggestedPrice = 25;
    let demand = 'Stable';
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let confidence = 95;
    let buyersCount = 8;
    let sellingTime = 'Next 48 Hours';

    if (category === 'Vegetables') {
      suggestedPrice = grade.includes('Premium') || grade.includes('Organic') ? 28 : 22;
      demand = 'High';
      trend = 'up';
      buyersCount = 12;
      confidence = 97;
    } else if (category === 'Grains') {
      suggestedPrice = grade.includes('Premium') || grade.includes('Organic') ? 34 : 27;
      demand = 'Stable';
      trend = 'stable';
      buyersCount = 7;
      confidence = 93;
    } else if (category === 'Fruits') {
      suggestedPrice = grade.includes('Premium') || grade.includes('Organic') ? 78 : 52;
      demand = 'High';
      trend = 'up';
      buyersCount = 17;
      confidence = 96;
      sellingTime = 'Next 24 Hours';
    }

    return {
      suggestedPrice,
      demand,
      sellingTime,
      buyersCount,
      trend,
      confidence
    };
  }
};
export default aiService;
