import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabase-admin';

export type TwoFactorRecord = {
  id: string;
  user_id: string;
  secret: string;
  enabled: boolean;
  created_at: string;
};

class TwoFactorService {
  private supabase: SupabaseClient;
  constructor(client: SupabaseClient) {
    this.supabase = client;
  }

  async getByUserId(userId: string): Promise<TwoFactorRecord | null> {
    const { data, error } = await this.supabase
      .from('two_factor')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('two_factor fetch error:', error);
      return null;
    }
    return data as TwoFactorRecord | null;
  }

  async upsertSecret(userId: string, secret: string, enabled = false): Promise<TwoFactorRecord> {
    const { data, error } = await this.supabase
      .from('two_factor')
      .upsert({
        user_id: userId,
        secret,
        enabled,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data as TwoFactorRecord;
  }

  async setEnabled(userId: string, enabled: boolean): Promise<TwoFactorRecord | null> {
    const { data, error } = await this.supabase
      .from('two_factor')
      .update({ enabled })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('two_factor enable/disable error:', error);
      return null;
    }

    return data as TwoFactorRecord;
  }

  async disable(userId: string): Promise<TwoFactorRecord | null> {
    // Keep the secret but mark as disabled so users can re-enable quickly if desired
    return this.setEnabled(userId, false);
  }
}

const twoFactorService = new TwoFactorService(supabaseAdmin);
export default twoFactorService;
