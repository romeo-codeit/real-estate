'use server';

/**
 * @fileOverview Suggests similar properties based on the details of a given property.
 *
 * - suggestSimilarProperties - A function that suggests similar properties.
 * - SuggestSimilarPropertiesInput - The input type for the suggestSimilarProperties function.
 * - SuggestSimilarPropertiesOutput - The return type for the suggestSimilarProperties function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Simple in-memory circuit breaker to avoid hammering the AI
// provider when it is degraded or unavailable. This is per
// server instance and resets automatically after a cooldown.
const CIRCUIT_MAX_CONSECUTIVE_FAILURES = 3;
const CIRCUIT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

let consecutiveFailures = 0;
let circuitOpenUntil: number | null = null;

const PropertyDetailsSchema = z.object({
  propertyType: z.string().describe('The type of property, e.g., house, apartment, condo.'),
  location: z.string().describe('The location of the property, e.g., city, neighborhood.'),
  bedrooms: z.number().describe('The number of bedrooms in the property.'),
  bathrooms: z.number().describe('The number of bathrooms in the property.'),
  squareFootage: z.number().describe('The square footage of the property.'),
  price: z.number().describe('The price of the property.'),
  amenities: z.string().describe('A comma separated list of amenities the property has.'),
  description: z.string().describe('A detailed description of the property.'),
});

const SuggestSimilarPropertiesInputSchema = z.object({
  propertyDetails: PropertyDetailsSchema.describe('The details of the property to find similar listings for.'),
  numberOfSuggestions: z.number().default(3).describe('The number of similar properties to suggest.'),
});
export type SuggestSimilarPropertiesInput = z.infer<typeof SuggestSimilarPropertiesInputSchema>;

const SuggestedPropertySchema = z.object({
  propertyType: z.string().describe('The type of property, e.g., house, apartment, condo.'),
  location: z.string().describe('The location of the property, e.g., city, neighborhood.'),
  bedrooms: z.number().describe('The number of bedrooms in the property.'),
  bathrooms: z.number().describe('The number of bathrooms in the property.'),
  squareFootage: z.number().describe('The square footage of the property.'),
  price: z.number().describe('The price of the property.'),
  amenities: z.string().describe('A comma separated list of amenities the property has.'),
  description: z.string().describe('A detailed description of the property.'),
  similarityScore: z.number().describe('A score indicating how similar the suggested property is to the input property.'),
});

const SuggestSimilarPropertiesOutputSchema = z.array(SuggestedPropertySchema);
export type SuggestSimilarPropertiesOutput = z.infer<typeof SuggestSimilarPropertiesOutputSchema>;

export async function suggestSimilarProperties(input: SuggestSimilarPropertiesInput): Promise<SuggestSimilarPropertiesOutput> {
  const now = Date.now();

  // If the circuit is open, short-circuit to a safe fallback
  if (circuitOpenUntil && now < circuitOpenUntil) {
    console.warn('AI circuit breaker is open; skipping similar properties suggestion.');
    // Fallback: behave as if there are no similar properties
    return [];
  }

  try {
    const result = await suggestSimilarPropertiesFlow(input);

    // On success, reset failure counters and close the circuit
    consecutiveFailures = 0;
    circuitOpenUntil = null;

    return result;
  } catch (error) {
    console.error('Error in suggestSimilarProperties:', error);

    consecutiveFailures += 1;

    if (consecutiveFailures >= CIRCUIT_MAX_CONSECUTIVE_FAILURES) {
      circuitOpenUntil = now + CIRCUIT_COOLDOWN_MS;
      console.error(
        `AI circuit breaker opened after ${consecutiveFailures} consecutive failures. ` +
        `New requests will be short-circuited until ${new Date(circuitOpenUntil).toISOString()}.`
      );
    }

    // Preserve existing behaviour: surface the error to the caller
    // so the UI can show a one-off error message. Subsequent calls
    // during the cooldown will receive an empty list instead.
    throw error;
  }
}

const prompt = ai.definePrompt({
  name: 'suggestSimilarPropertiesPrompt',
  input: {schema: SuggestSimilarPropertiesInputSchema},
  output: {schema: SuggestSimilarPropertiesOutputSchema},
  prompt: `You are a real estate expert. Given the details of a property, you will suggest other properties that are similar.

Property Details:
Type: {{{propertyDetails.propertyType}}}
Location: {{{propertyDetails.location}}}
Bedrooms: {{{propertyDetails.bedrooms}}}
Bathrooms: {{{propertyDetails.bathrooms}}}
Square Footage: {{{propertyDetails.squareFootage}}}
Price: {{{propertyDetails.price}}}
Amenities: {{{propertyDetails.amenities}}}
Description: {{{propertyDetails.description}}}

You should suggest {{{numberOfSuggestions}}} properties that are similar to the one described above. Return the properties as a JSON array.  For each property, assign a similarityScore (0-1) indicating how similar it is to the input property, with 1 being an exact match.
`, 
});

const suggestSimilarPropertiesFlow = ai.defineFlow(
  {
    name: 'suggestSimilarPropertiesFlow',
    inputSchema: SuggestSimilarPropertiesInputSchema,
    outputSchema: SuggestSimilarPropertiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
