/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { AnalyticsData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getStrategicInsights = async (data: AnalyticsData) => {
  const model = "gemini-3-flash-preview";
  
  // Prepare a condensed summary for the prompt
  const summary = {
    totalOrders: data.orders.length,
    totalRevenue: data.dailyStats.reduce((sum, d) => sum + d.revenue, 0),
    topCities: data.cityStats.slice(0, 3).map(c => c.city),
    topCategories: data.categoryStats.slice(0, 3).map(c => c.category),
    avgDeliveryTime: data.dailyStats.reduce((sum, d) => sum + d.avgDeliveryTime, 0) / data.dailyStats.length,
    recentGrowth: data.dailyStats[data.dailyStats.length - 1]?.growthPercent || 0,
  };

  const prompt = `
    You are a Senior Strategic Analyst for Minute Metrics, a leading quick commerce analytics platform.
    Analyze the following business data and provide high-level strategic insights.
    
    Data Summary:
    ${JSON.stringify(summary, null, 2)}
    
    Please provide:
    1. **Predictions**: Forecast tomorrow's orders and revenue based on the recent growth of ${summary.recentGrowth.toFixed(1)}%.
    2. **Demand Identification**: Which categories or cities are showing the most potential?
    3. **Operational Bottlenecks**: Based on the average delivery time of ${summary.avgDeliveryTime.toFixed(1)} mins, identify risks.
    4. **Actionable Recommendations**: 3-5 specific steps to increase efficiency or revenue.
    
    Format the output in clean Markdown. Use a professional, data-driven tone.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI insights at this moment. Please check your API configuration.";
  }
};
