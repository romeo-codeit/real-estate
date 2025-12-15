import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

class ROIService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Get current ROI settings for all investment types
  async getROISettings() {
    const { data, error } = await this.supabase
      .from('roi_settings')
      .select('*')
      .order('investment_type');

    if (error) throw error;
    return data;
  }

  // Get ROI setting for specific investment type
  async getROIForType(investmentType: string) {
    const { data, error } = await this.supabase
      .from('roi_settings')
      .select('*')
      .eq('investment_type', investmentType)
      .single();

    if (error) throw error;
    return data;
  }

  // Update ROI setting
  async updateROI(investmentType: string, newROI: number, updatedBy: string) {
    // Get current setting
    const currentSetting = await this.getROIForType(investmentType);

    // Update the setting
    const { data, error } = await this.supabase
      .from('roi_settings')
      .update({
        base_roi: newROI,
        last_updated: new Date().toISOString(),
        updated_by: updatedBy
      })
      .eq('investment_type', investmentType)
      .select()
      .single();

    if (error) throw error;

    // Log the change in history
    await this.logROIChange({
      investment_type: investmentType,
      previous_roi: currentSetting.base_roi,
      new_roi: newROI,
      adjustment_rate: newROI - currentSetting.base_roi,
      growth_direction: newROI > currentSetting.base_roi ? 'up' : newROI < currentSetting.base_roi ? 'down' : 'stable',
      changed_by: updatedBy
    });

    return data;
  }

  // Log ROI change in history
  async logROIChange(changeData: {
    investment_type: string;
    previous_roi: number;
    new_roi: number;
    adjustment_rate: number;
    growth_direction: string;
    changed_by: string;
  }) {
    const { error } = await this.supabase
      .from('roi_history')
      .insert(changeData);

    if (error) throw error;
  }

  // Get ROI history for an investment type
  async getROIHistory(investmentType?: string, limit: number = 50) {
    let query = this.supabase
      .from('roi_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (investmentType) {
      query = query.eq('investment_type', investmentType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Calculate projected returns for an investment
  calculateProjectedReturns(
    principal: number,
    roiRate: number,
    durationMonths: number,
    compoundingFrequency: 'monthly' | 'quarterly' | 'annually' = 'monthly'
  ) {
    const annualRate = roiRate / 100;
    let compoundingPeriods: number;

    switch (compoundingFrequency) {
      case 'monthly':
        compoundingPeriods = durationMonths;
        break;
      case 'quarterly':
        compoundingPeriods = Math.floor(durationMonths / 3);
        break;
      case 'annually':
        compoundingPeriods = Math.floor(durationMonths / 12);
        break;
      default:
        compoundingPeriods = durationMonths;
    }

    const ratePerPeriod = annualRate / (compoundingFrequency === 'monthly' ? 12 :
                                        compoundingFrequency === 'quarterly' ? 4 : 1);

    // Compound interest formula: A = P(1 + r/n)^(nt)
    const finalAmount = principal * Math.pow(1 + ratePerPeriod, compoundingPeriods);
    const totalReturn = finalAmount - principal;
    const monthlyReturn = totalReturn / durationMonths;

    return {
      principal,
      finalAmount,
      totalReturn,
      monthlyReturn,
      annualReturn: totalReturn * (12 / durationMonths),
      roiRate,
      durationMonths,
      compoundingFrequency
    };
  }

  // Get admin controls for ROI management
  async getAdminControls() {
    const { data, error } = await this.supabase
      .from('admin_controls')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  // Update admin controls
  async updateAdminControls(updates: {
    investment_growth_mode?: string;
    roi_adjustment_rate?: number;
  }) {
    const { data, error } = await this.supabase
      .from('admin_controls')
      .update({
        ...updates,
        last_applied: new Date().toISOString()
      })
      .eq('id', (await this.getAdminControls()).id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Apply automatic ROI adjustments based on market conditions
  async applyAutomaticAdjustments() {
    const controls = await this.getAdminControls();

    if (controls.investment_growth_mode !== 'automatic') {
      return { message: 'Automatic adjustments are disabled' };
    }

    const settings = await this.getROISettings();
    const adjustments = [];

    for (const setting of settings) {
      // Simple market simulation - in real app, this would use market data
      const marketAdjustment = (Math.random() - 0.5) * controls.roi_adjustment_rate;
      const newROI = Math.max(0, setting.base_roi + marketAdjustment);

      await this.updateROI(setting.investment_type, newROI, 'system');
      adjustments.push({
        type: setting.investment_type,
        oldROI: setting.base_roi,
        newROI,
        adjustment: marketAdjustment
      });
    }

    return {
      message: 'Automatic ROI adjustments applied',
      adjustments
    };
  }
}

const roiService = new ROIService(supabase);
export default roiService;