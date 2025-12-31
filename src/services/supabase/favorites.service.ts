import { supabase } from './supabase';

export interface IFavorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

const table = 'user_favorites' as const;

export const FavoritesService = {
  async getFavorites(userId: string): Promise<string[]> {
    try {
      const res = await (supabase as any)
        .from(table)
        .select('property_id')
        .eq('user_id', userId);

      const data = res?.data as Array<{ property_id: string }> | null;
      return (data || []).map((d) => d.property_id);
    } catch (error) {
      console.error('Failed to fetch favorites', error);
      return [];
    }
  },

  async addFavorite(userId: string, propertyId: string) {
    try {
      const res = await (supabase as any).from(table).insert({ user_id: userId, property_id: propertyId });
      if (res?.error) throw res.error;
      return res?.data;
    } catch (error) {
      throw error;
    }
  },

  async removeFavorite(userId: string, propertyId: string) {
    try {
      const res = await (supabase as any).from(table).delete().match({ user_id: userId, property_id: propertyId });
      if (res?.error) throw res.error;
      return res?.data;
    } catch (error) {
      throw error;
    }
  },
};
