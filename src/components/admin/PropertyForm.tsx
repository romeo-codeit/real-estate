
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { Property } from '@/lib/types';
import { useRouter } from 'next/navigation';

const propertySchema = z.object({
  title: z.string().min(1, "Title is required."),
  price: z.coerce.number().min(1, "Price is required."),
  address: z.string().min(1, "Address is required."),
  bedrooms: z.coerce.number().int().min(0, "Bedrooms must be a positive number."),
  bathrooms: z.coerce.number().int().min(0, "Bathrooms must be a positive number."),
  area: z.coerce.number().int().min(1, "Area is required."),
  type: z.enum(['House', 'Apartment', 'Condo', 'Villa']),
  description: z.string().min(10, "Description must be at least 10 characters."),
  featured: z.boolean().default(false),
  amenities: z.array(z.string()).optional(),
  mainImage: z.any().optional(),
  galleryImages: z.any().optional(),
});

export function PropertyForm({ property }: { property?: Property }) {
  const { toast } = useToast();
  const router = useRouter();
  const isEditMode = !!property;

  const form = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property?.title || "",
      price: property?.price || 0,
      address: property?.address || "",
      bedrooms: property?.bedrooms || 0,
      bathrooms: property?.bathrooms || 0,
      area: property?.area || 0,
      type: (property?.type as 'House' | 'Apartment' | 'Condo' | 'Villa' | undefined) ?? 'House',
      description: property?.description || "",
      featured: property?.featured || false,
      amenities: property?.amenities || [],
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof propertySchema>> = (values) => {
    try {
        if (isEditMode && property) {
            const storedProperties = JSON.parse(localStorage.getItem('properties') || '[]');
            const propertyIndex = storedProperties.findIndex((p: Property) => p.id === property.id);
            
            const updatedProperty = { ...property, ...values };

            if (propertyIndex > -1) {
                storedProperties[propertyIndex] = updatedProperty;
            } else {
                storedProperties.push(updatedProperty);
            }
            localStorage.setItem('properties', JSON.stringify(storedProperties));
        }
        
        toast({
            title: `Property ${isEditMode ? 'Updated' : 'Created'}`,
            description: `The property "${values.title}" has been saved successfully.`,
        });
        router.push('/admin/properties');
    } catch (error) {
        console.error("Failed to save property to localStorage", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save property changes.",
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Property' : 'Property Details'}</CardTitle>
        <CardDescription>Fill out the form below to {isEditMode ? 'update the' : 'add a new'} property.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Modern Downtown Loft" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1200000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 123 Main St, Anytown, USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area (sqft)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="House">House</SelectItem>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Condo">Condo</SelectItem>
                      <SelectItem value="Villa">Villa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A beautiful and spacious loft..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="mainImage"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Main Image</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
             <FormField
                control={form.control}
                name="galleryImages"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gallery Images</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" multiple onChange={(e) => field.onChange(e.target.files)} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Featured Property
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit">{isEditMode ? 'Update' : 'Create'} Property</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
