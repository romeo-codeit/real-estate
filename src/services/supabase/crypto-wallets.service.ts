import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../database.types';
import { supabase } from './supabase';

class CryptoWalletsService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  // Get all crypto wallets
  async getCryptoWallets() {
    try {
      const { data, error } = await this.supabase
        .from('crypto_wallets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching crypto wallets:', error);
      throw error;
    }
  }

  // Get enabled crypto wallets
  async getEnabledCryptoWallets() {
    try {
      const { data, error } = await this.supabase
        .from('crypto_wallets')
        .select('*')
        .eq('enabled', true)
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching enabled crypto wallets:', error);
      throw error;
    }
  }

  // Create a new crypto wallet
  async createCryptoWallet(wallet: {
    symbol: string;
    name: string;
    wallet_address: string;
    enabled?: boolean;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('crypto_wallets')
        .insert({
          symbol: wallet.symbol,
          name: wallet.name,
          wallet_address: wallet.wallet_address,
          enabled: wallet.enabled ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating crypto wallet:', error);
      throw error;
    }
  }

  // Update a crypto wallet
  async updateCryptoWallet(id: string, updates: {
    symbol?: string;
    name?: string;
    wallet_address?: string;
    enabled?: boolean;
  }) {
    try {
      const { data, error } = await this.supabase
        .from('crypto_wallets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating crypto wallet:', error);
      throw error;
    }
  }

  // Delete a crypto wallet
  async deleteCryptoWallet(id: string) {
    try {
      const { error } = await this.supabase
        .from('crypto_wallets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting crypto wallet:', error);
      throw error;
    }
  }

  // Get wallet by symbol
  async getWalletBySymbol(symbol: string) {
    try {
      const { data, error } = await this.supabase
        .from('crypto_wallets')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching wallet by symbol:', error);
      throw error;
    }
  }
}

const cryptoWalletsService = new CryptoWalletsService(supabase);
export default cryptoWalletsService;