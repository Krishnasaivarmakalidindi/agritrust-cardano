import { ServiceResponse, makeResponse, makeErrorResponse } from '../types/api';
import { Profile } from '../types';

export interface AISuggestion {
  suggestedPrice: number;
  demand: 'High' | 'Moderate' | 'Low';
  confidence: number;
  sellingTime: string;
  trend: 'up' | 'down' | 'stable';
}

export interface RecommendationMatch {
  profile: Partial<Profile>;
  matchPercentage: number;
  reason: string;
}

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

export const aiService = {
  // 1. Suggest Fair crop prices using Gemini Flash
  async suggestPrice(category: string, grade: string, quantity: number): Promise<ServiceResponse<AISuggestion>> {
    try {
      if (!geminiApiKey) {
        return makeResponse(true, 'Mock pricing recommendations loaded.', this.getMockPrice(category, grade, quantity));
      }

      const prompt = `You are a professional AI agricultural trade assistant.
Analyze the listing parameters:
- Crop Category: ${category}
- Quality Grade: ${grade}
- Quantity: ${quantity} kg

Provide a JSON block containing market recommendations. Return ONLY valid JSON, do not wrap in markdown quotes.
{
  "suggestedPrice": number (INR per kg, typical tomato: 20-30, grains: 25-45, fruits: 50-100),
  "demand": "High" | "Moderate" | "Low",
  "confidence": number (percentage, 90 to 99),
  "sellingTime": "Next 24 Hours" | "Next 48 Hours" | "Next 5 Days",
  "trend": "up" | "down" | "stable"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const data = JSON.parse(cleanJson);

      return makeResponse(true, 'AI recommendations loaded.', {
        suggestedPrice: Number(data.suggestedPrice) || 30,
        demand: data.demand || 'Moderate',
        confidence: Number(data.confidence) || 95,
        sellingTime: data.sellingTime || 'Next 48 Hours',
        trend: data.trend || 'stable'
      });
    } catch (err: any) {
      console.warn('Gemini Price estimation failed, running fallback math.', err);
      return makeResponse(true, 'Local pricing recommendations loaded.', this.getMockPrice(category, grade, quantity));
    }
  },

  // 2. Estimate market demand levels
  async marketDemand(category: string): Promise<ServiceResponse<'High' | 'Moderate' | 'Low'>> {
    try {
      const mock = this.getMockPrice(category, 'Grade A', 1000);
      return makeResponse(true, 'Demand calculated.', mock.demand);
    } catch (err: any) {
      return makeErrorResponse('Failed to calculate demand.', err.message);
    }
  },

  // 3. Estimate pricing confidence levels
  async priceConfidence(category: string, grade: string): Promise<ServiceResponse<number>> {
    try {
      const mock = this.getMockPrice(category, grade, 1000);
      return makeResponse(true, 'Confidence calculated.', mock.confidence);
    } catch (err: any) {
      return makeErrorResponse('Failed to fetch confidence score.', err.message);
    }
  },

  // 4. Recommend optimal buyer match for crop listing
  async recommendBuyer(productId: string): Promise<ServiceResponse<RecommendationMatch[]>> {
    try {
      const mockBuyers: RecommendationMatch[] = [
        {
          profile: { id: 'buyer-priya-patel-id', full_name: 'Priya Patel (Organic Foods Ltd)', trust_score: 99 },
          matchPercentage: 98,
          reason: 'Frequently purchases Grade A organic vegetables in large volumes.'
        },
        {
          profile: { id: 'buyer-supermarket-id', full_name: 'FreshMart Supermarkets', trust_score: 95 },
          matchPercentage: 86,
          reason: 'Stable purchaser of bulk vegetables and fruits with fast settlement times.'
        }
      ];
      return makeResponse(true, 'Buyer recommendations loaded.', mockBuyers);
    } catch (err: any) {
      return makeErrorResponse('Failed to load buyer recommendations.', err.message);
    }
  },

  // 5. Recommend optimal farmers for a crop category
  async recommendSeller(categoryId: string): Promise<ServiceResponse<RecommendationMatch[]>> {
    try {
      const mockFarmers: RecommendationMatch[] = [
        {
          profile: { id: 'farmer-ram-singh-id', full_name: 'Ram Singh', trust_score: 97 },
          matchPercentage: 96,
          reason: 'Highest verified yield and pristine escrow delivery record for vegetables.'
        }
      ];
      return makeResponse(true, 'Farmer recommendations loaded.', mockFarmers);
    } catch (err: any) {
      return makeErrorResponse('Failed to load farmer recommendations.', err.message);
    }
  },

  // Helper local database recommendations engine
  getMockPrice(category: string, grade: string, quantity: number): AISuggestion {
    let suggestedPrice = 25;
    let demand: 'High' | 'Moderate' | 'Low' = 'Moderate';
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let confidence = 95;
    let sellingTime = 'Next 48 Hours';

    if (category === 'Vegetables') {
      suggestedPrice = grade.includes('Premium') || grade.includes('Organic') ? 28 : 22;
      demand = 'High';
      trend = 'up';
      confidence = 97;
    } else if (category === 'Grains') {
      suggestedPrice = grade.includes('Premium') || grade.includes('Organic') ? 34 : 27;
      demand = 'Moderate';
      trend = 'stable';
      confidence = 93;
    } else if (category === 'Fruits') {
      suggestedPrice = grade.includes('Premium') || grade.includes('Organic') ? 78 : 52;
      demand = 'High';
      trend = 'up';
      confidence = 96;
      sellingTime = 'Next 24 Hours';
    }

    return {
      suggestedPrice,
      demand,
      confidence,
      sellingTime,
      trend
    };
  }
};
export default aiService;
