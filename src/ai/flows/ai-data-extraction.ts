'use server';
/**
 * @fileOverview A Genkit flow for extracting Source Links, Phone Numbers, and Business Names from file content.
 *
 * - extractAIData - A function that handles the data extraction process.
 * - AIDataExtractionInput - The input type for the extractAIData function.
 * - AIDataExtractionOutput - The return type for the extractAIData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIDataExtractionInputSchema = z.object({
  fileContent: z.string().describe('The textual content of the uploaded file.'),
  fileName: z.string().describe('The name of the uploaded file, including its extension (e.g., "data.csv", "leads.xlsx").'),
});
export type AIDataExtractionInput = z.infer<typeof AIDataExtractionInputSchema>;

const AIDataExtractionOutputSchema = z.object({
  sourceLinks: z.array(z.string()).describe('An array of extracted URLs or web links.'),
  phoneNumbers: z.array(z.string()).describe('An array of extracted phone numbers.'),
  businessNames: z.array(z.string()).describe('An array of extracted business names.'),
});
export type AIDataExtractionOutput = z.infer<typeof AIDataExtractionOutputSchema>;

export async function extractAIData(input: AIDataExtractionInput): Promise<AIDataExtractionOutput> {
  return aiDataExtractionFlow(input);
}

const aiDataExtractionPrompt = ai.definePrompt({
  name: 'aiDataExtractionPrompt',
  input: { schema: AIDataExtractionInputSchema },
  output: { schema: AIDataExtractionOutputSchema },
  prompt: `You are an expert data extraction assistant. Your task is to accurately identify and extract specific types of information from the provided file content. The file is named '{{{fileName}}}'.

Extract the following:
1.  **Source Links**: Any URLs or web links present in the content.
2.  **Phone Numbers**: Any sequences of digits that appear to be phone numbers. Include any country codes, parentheses, dashes, or spaces as they appear.
3.  **Business Names**: Names of companies, organizations, or businesses.

If a category of information is not found, return an empty array for that category. Do not infer or invent information. Only extract what is explicitly present in the 'fileContent'.

File Content:
\`\`\`
{{{fileContent}}}
\`\`\`
`,
});

const aiDataExtractionFlow = ai.defineFlow(
  {
    name: 'aiDataExtractionFlow',
    inputSchema: AIDataExtractionInputSchema,
    outputSchema: AIDataExtractionOutputSchema,
  },
  async (input) => {
    const { output } = await aiDataExtractionPrompt(input);
    if (!output) {
      throw new Error('Failed to extract data: Output was null or undefined.');
    }
    return output;
  }
);
