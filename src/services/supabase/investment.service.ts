import { SupabaseClient } from '@supabase/supabase-js';
import { Database, TablesInsert, TablesUpdate } from '../../../database.types';
import { supabase } from './supabase';
import roiService from './roi.service';

class InvestmentService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  // ✅ Create a new investment
  async createInvestment(data: TablesInsert<'investments'>) {
    try {
      const { data: result, error } = await this.supabase
        .from('investments')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error creating investment:', error);
      throw error;
    }
  }

  // ✅ Fetch all investments (optionally by user)
  async getInvestments(userId?: string) {
    try {
      const query = this.supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });
      if (userId) query.eq('user_id', userId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching investments:', error);
      throw error;
    }
  }

  // ✅ Fetch single investment by ID
  async getInvestmentById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('investments')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching investment:', error);
      throw error;
    }
  }

  // ✅ Update investment details
  async updateInvestment(id: string, updates: TablesUpdate<'investments'>) {
    try {
      const { data, error } = await this.supabase
        .from('investments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating investment:', error);
      throw error;
    }
  }

  // ✅ Update investment status
  async updateInvestmentStatus(id: string, status: 'pending' | 'active' | 'completed' | 'cancelled') {
    try {
      const { data, error } = await this.supabase
        .from('investments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating investment status:', error);
      throw error;
    }
  }

  // ✅ Delete investment
  async deleteInvestment(id: string) {
    try {
      const { error } = await this.supabase
        .from('investments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting investment:', error);
      throw error;
    }
  }

  // ✅ Calculate current ROI amount for an investment
  async calculateCurrentROI(investmentId: string) {
    try {
      const investment = await this.getInvestmentById(investmentId);
      if (!investment) throw new Error('Investment not found');

      const startDate = new Date(investment.start_date || new Date());
      const now = new Date();
      const monthsElapsed = Math.max(0, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

      // Calculate compound interest
      const annualRate = investment.roi_rate / 100;
      const monthlyRate = annualRate / 12;
      const currentValue = investment.amount_invested * Math.pow(1 + monthlyRate, monthsElapsed);
      const roiAmount = currentValue - investment.amount_invested;

      return {
        investmentId,
        principal: investment.amount_invested,
        currentValue,
        roiAmount,
        monthsElapsed,
        roiRate: investment.roi_rate
      };
    } catch (error) {
      console.error('Error calculating ROI:', error);
      throw error;
    }
  }

  // ✅ Get portfolio summary for a user
  async getPortfolioSummary(userId: string) {
    try {
      const investments = await this.getInvestments(userId);
      if (!investments || investments.length === 0) {
        return {
          totalInvested: 0,
          totalCurrentValue: 0,
          totalROI: 0,
          activeInvestments: 0,
          investments: []
        };
      }

      let totalInvested = 0;
      let totalCurrentValue = 0;
      let totalROI = 0;
      let activeInvestments = 0;

      const investmentDetails = await Promise.all(
        investments.map(async (investment) => {
          const roiData = await this.calculateCurrentROI(investment.id);
          totalInvested += investment.amount_invested;
          totalCurrentValue += roiData.currentValue;
          totalROI += roiData.roiAmount;

          if (investment.status === 'active') {
            activeInvestments++;
          }

          return {
            ...investment,
            currentValue: roiData.currentValue,
            currentROI: roiData.roiAmount,
            monthsElapsed: roiData.monthsElapsed
          };
        })
      );

      return {
        totalInvested,
        totalCurrentValue,
        totalROI,
        activeInvestments,
        investments: investmentDetails
      };
    } catch (error) {
      console.error('Error getting portfolio summary:', error);
      throw error;
    }
  }

  // ✅ Get investment performance metrics
  async getInvestmentMetrics(userId?: string) {
    try {
      let query = this.supabase
        .from('investments')
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: investments, error } = await query;
      if (error) throw error;

      if (!investments || investments.length === 0) {
        return {
          totalInvestments: 0,
          totalValue: 0,
          averageROI: 0,
          bestPerforming: null,
          worstPerforming: null,
          byType: {}
        };
      }

      let totalValue = 0;
      let totalROI = 0;
      const byType: Record<string, { count: number; value: number; roi: number }> = {};
      let bestPerforming = null;
      let worstPerforming = null;

      for (const investment of investments) {
        const roiData = await this.calculateCurrentROI(investment.id);
        totalValue += roiData.currentValue;
        totalROI += roiData.roiAmount;

        // Track by type
        const investmentType = investment.investment_type || 'unknown';
        if (!byType[investmentType]) {
          byType[investmentType] = { count: 0, value: 0, roi: 0 };
        }
        byType[investmentType].count++;
        byType[investmentType].value += roiData.currentValue;
        byType[investmentType].roi += roiData.roiAmount;

        // Track best/worst performing
        const roiPercentage = (roiData.roiAmount / investment.amount_invested) * 100;
        if (!bestPerforming || roiPercentage > bestPerforming.roiPercentage) {
          bestPerforming = { ...investment, roiPercentage, currentValue: roiData.currentValue };
        }
        if (!worstPerforming || roiPercentage < worstPerforming.roiPercentage) {
          worstPerforming = { ...investment, roiPercentage, currentValue: roiData.currentValue };
        }
      }

      return {
        totalInvestments: investments.length,
        totalValue,
        averageROI: totalROI / investments.length,
        bestPerforming,
        worstPerforming,
        byType
      };
    } catch (error) {
      console.error('Error getting investment metrics:', error);
      throw error;
    }
  }

  // ✅ Activate investment after payment confirmation
  async activateInvestment(investmentId: string) {
    try {
      const { data, error } = await this.supabase
        .from('investments')
        .update({
          status: 'active',
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', investmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error activating investment:', error);
      throw error;
    }
  }

  // ✅ Complete investment (when duration ends)
  async completeInvestment(investmentId: string) {
    try {
      const investment = await this.getInvestmentById(investmentId);
      if (!investment) throw new Error('Investment not found');

      const roiData = await this.calculateCurrentROI(investmentId);

      const { data, error } = await this.supabase
        .from('investments')
        .update({
          status: 'completed',
          roi_amount: roiData.roiAmount,
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', investmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing investment:', error);
      throw error;
    }
  }
}

const investmentService = new InvestmentService(supabase);
export default investmentService;
