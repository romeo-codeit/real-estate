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
  return suggestSimilarPropertiesFlow(input);
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
