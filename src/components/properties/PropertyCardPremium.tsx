"use client";

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { IProperty } from '@/lib/types';
import { Bath, BedDouble, SquareGanttChart, Heart, MapPin } from 'lucide-react';
import { formatAmount } from '@/lib/helpers';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import useUserStore from '@/states/user-store';
import { FavoritesService } from '@/services/supabase/favorites.service';

interface PropertyCardPremiumProps {
  property: IProperty;
}

export function PropertyCardPremium({ property }: PropertyCardPremiumProps) {
  const imageUrl = property.mainImage?.asset?.url || '/images/placeholder.svg';
  const userId = useUserStore((s) => s.userId);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  const [isSaved, setIsSaved] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // initialize saved state from backend for authenticated users, otherwise localStorage
    (async () => {
      try {
        if (isAuthenticated && userId) {
          const favs = await FavoritesService.getFavorites(userId);
          setIsSaved(favs.includes(property._id));
        } else {
          const saved = JSON.parse(localStorage.getItem('saved_properties') || '[]') as string[];
          setIsSaved(saved.includes(property._id));
        }
      } catch (error) {
        // ignore
      }
    })();
  }, [isAuthenticated, userId, property._id]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !userId) {
      // redirect to login
      window.location.href = '/login';
      return;
    }

    setProcessing(true);
    const newState = !isSaved;
    setIsSaved(newState);

    try {
      if (newState) {
        await FavoritesService.addFavorite(userId as string, property._id);
      } else {
        await FavoritesService.removeFavorite(userId as string, property._id);
      }
    } catch (error) {
      // revert on error
      setIsSaved(!newState);
      console.error('Failed to toggle favorite', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAnonToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem('saved_properties') || '[]') as string[];
    let next: string[];
    if (saved.includes(property._id)) {
      next = saved.filter((id) => id !== property._id);
      setIsSaved(false);
    } else {
      next = [...saved, property._id];
      setIsSaved(true);
    }
    localStorage.setItem('saved_properties', JSON.stringify(next));
  };

  return (
    <Card className="overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transform-gpu hover:-translate-y-1 transition-all duration-300 flex flex-col h-full bg-card/60 backdrop-blur-sm">
      <CardHeader className="p-0 relative">
        <Link href={`/properties/${property._id}`} className="block" aria-label={`View ${property.title}`}>
          <div className="relative w-full h-64 md:h-56 lg:h-64">
            <Image
              src={imageUrl}
              alt={property.mainImage?.alt || property.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority={false}
            />

            {/* subtle glass overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Price pill */}
            <div className="absolute left-4 bottom-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground text-sm font-semibold shadow-lg ring-1 ring-primary/30">
                {formatAmount(property.price)}
              </span>
            </div>

            {/* Type badge */}
            <Badge className="absolute top-4 left-4" variant={property.isFeatured ? 'default' : 'secondary'}>
              {property.propertyType?.title || 'Property'}
            </Badge>

            {/* Favorite action */}
            {isAuthenticated ? (
              <button
                aria-label={isSaved ? 'Unsave property' : 'Save property'}
                title={isSaved ? 'Unsave property' : 'Save property'}
                onClick={toggleSave}
                disabled={processing}
                className={`absolute top-4 right-4 inline-flex items-center justify-center h-10 w-10 rounded-full ${isSaved ? 'bg-primary text-primary-foreground' : 'bg-card/80'} hover:bg-card/95 shadow-md ring-1 ring-border transition-shadow`}>
                <Heart className={`h-5 w-5 ${isSaved ? 'text-white' : 'text-primary'}`} />
              </button>
            ) : (
              <button aria-label="Save property" title="Save property" onClick={handleAnonToggle} className="absolute top-4 right-4 inline-flex items-center justify-center h-10 w-10 rounded-full bg-card/80 hover:bg-card/95 shadow-md ring-1 ring-border transition-shadow">
                <Heart className="h-5 w-5 text-primary" />
              </button>
            )}
          </div>
        </Link>
      </CardHeader>

      <CardContent className="p-5 flex-grow">
        <CardTitle className="text-lg md:text-xl font-semibold mb-1 truncate">
          <Link href={`/properties/${property._id}`} className="hover:text-primary transition-colors truncate">
            {property.title}
          </Link>
        </CardTitle>

        <p className="flex items-center gap-2 text-sm text-muted-foreground mb-3 truncate">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="truncate">{property.address}</span>
        </p>

        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-primary" />
            <span className="font-medium">{property.bedrooms}</span>
            <span className="text-muted-foreground">Beds</span>
          </div>
          <div className="flex items-center gap-2">
            <Bath className="w-4 h-4 text-primary" />
            <span className="font-medium">{property.bathrooms}</span>
            <span className="text-muted-foreground">Baths</span>
          </div>
          <div className="flex items-center gap-2">
            <SquareGanttChart className="w-4 h-4 text-primary" />
            <span className="font-medium">{property.area.toLocaleString('en-US')}</span>
            <span className="text-muted-foreground">sqft</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <div className="flex gap-3 w-full">
          <Button variant="outline" className="flex-1">
            Contact
          </Button>
          <Button asChild className="flex-1">
            <Link href={`/properties/${property._id}`}>View</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default PropertyCardPremium;
