
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('any');
  const [priceRange, setPriceRange] = useState('any');

  useEffect(() => {
    setLocation(searchParams.get('location') ?? '');
    setPropertyType(searchParams.get('type') ?? 'any');
    setPriceRange(searchParams.get('priceRange') ?? 'any');
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (propertyType && propertyType !== 'any') params.set('type', propertyType);
    if (priceRange && priceRange !== 'any') params.set('priceRange', priceRange);
    router.push(`/properties?${params.toString()}`);
  };


  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
      <div className="w-full">
        <label htmlFor="location" className="text-sm font-medium text-white block mb-2 text-left">Location</label>
        <Input 
          id="location" 
          placeholder="Enter a city or neighborhood" 
          className="bg-card/10 text-foreground placeholder:text-muted-foreground"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div className="w-full">
        <label htmlFor="property-type" className="text-sm font-medium text-white block mb-2 text-left">Property Type</label>
        <Select value={propertyType} onValueChange={(val) => setPropertyType(val)}>
          <SelectTrigger className="w-full bg-card/80 text-foreground">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="condo">Condo</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
          </SelectContent>
        </Select>
      </div>
       <div className="w-full">
        <label htmlFor="price-range" className="text-sm font-medium text-white block mb-2 text-left">Price Range</label>
        <Select value={priceRange} onValueChange={(val) => setPriceRange(val)}>
          <SelectTrigger className="w-full bg-card/80 text-foreground">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="<500k">&lt; $500,000</SelectItem>
            <SelectItem value="500k-1m">$500,000 - $1M</SelectItem>
            <SelectItem value="1m-2m">$1M - $2M</SelectItem>
            <SelectItem value=">2m">&gt; $2M</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        <Search className="mr-2 h-4 w-4"/> Search
      </Button>
    </form>
  );
}
