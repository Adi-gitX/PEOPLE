// Gemini AI Service
// Provides AI-powered features for the platform

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

// Initialize Gemini
const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

/**
 * Enhance mission description with AI
 */
export const enhanceMissionDescription = async (
    title: string,
    description: string,
    type: string
): Promise<{
    enhancedDescription: string;
    suggestedSkills: string[];
    estimatedComplexity: string;
}> => {
    if (!genAI) {
        console.warn('Gemini API key not configured, returning original description');
        return {
            enhancedDescription: description,
            suggestedSkills: [],
            estimatedComplexity: 'medium',
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `You are a technical project analyst. Given this mission/project info:

Title: ${title}
Type: ${type}
Description: ${description}

Please provide:
1. A slightly enhanced/clarified version of the description (keep it concise, max 300 words)
2. A list of 3-5 relevant technical skills needed
3. Estimated complexity (easy, medium, hard, expert)

Respond in this exact JSON format:
{
  "enhancedDescription": "...",
  "suggestedSkills": ["skill1", "skill2", ...],
  "estimatedComplexity": "medium"
}`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            enhancedDescription: parsed.enhancedDescription || description,
            suggestedSkills: parsed.suggestedSkills || [],
            estimatedComplexity: parsed.estimatedComplexity || 'medium',
        };
    } catch (error) {
        console.error('Gemini enhancement error:', error);
        return {
            enhancedDescription: description,
            suggestedSkills: [],
            estimatedComplexity: 'medium',
        };
    }
};

/**
 * Generate success criteria for a mission
 */
export const generateSuccessCriteria = async (
    title: string,
    description: string,
    type: string
): Promise<string[]> => {
    if (!genAI) {
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Given this project:
Title: ${title}
Type: ${type}
Description: ${description}

Generate 3-5 clear, measurable success criteria for this project.
Respond as a JSON array of strings only, like:
["Criterion 1", "Criterion 2", "Criterion 3"]`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            return [];
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Gemini success criteria error:', error);
        return [];
    }
};

/**
 * Check if Gemini is configured
 */
export const isGeminiConfigured = (): boolean => {
    return !!genAI;
};
