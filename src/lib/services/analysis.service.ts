import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateAnalysisCommand, AnalysisDTO, UpdateAnalysisCommand } from '../../types';
import { DatabaseError } from '../errors/database.error';
import { ValidationError } from '../errors/validation.error';

export interface PaginationParams {
  page?: number;
  limit?: number;
  analysis_type_id?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export class AnalysisService {
  constructor(private readonly supabase: SupabaseClient) {}

  async createAnalysis(command: CreateAnalysisCommand, userId: string): Promise<AnalysisDTO> {
    // Check if user has permissions
    if (command.user_id !== userId) {
      throw new ValidationError('No permission to create analysis for this user');
    }

    // Check if analysis type exists
    const { data: analysisType, error: typeError } = await this.supabase
      .from('analysis_types')
      .select('id')
      .eq('id', command.analysis_type_id)
      .single();

    if (typeError || !analysisType) {
      throw new ValidationError(`Invalid analysis type: ${command.analysis_type_id}`);
    }

    // Create analysis
    const { data: analysis, error: insertError } = await this.supabase
      .from('analysis')
      .insert({
        user_id: command.user_id,
        analysis_type_id: command.analysis_type_id,
        parameters: command.parameters || {},
      })
      .select()
      .single();

    if (insertError) {
      throw new DatabaseError('Failed to create analysis', insertError);
    }

    return analysis as AnalysisDTO;
  }

  async getAnalyses(userId: string, params: PaginationParams = {}): Promise<PaginatedResponse<AnalysisDTO>> {
    const {
      page = 1,
      limit = 10,
      analysis_type_id
    } = params;

    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('analysis')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (analysis_type_id) {
      query = query.eq('analysis_type_id', analysis_type_id);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      throw new DatabaseError('Failed to fetch analysis list', error);
    }

    return {
      data: data as AnalysisDTO[],
      total: count || 0,
      page,
      limit
    };
  }

  async getAnalysis(id: number, userId: string): Promise<AnalysisDTO> {
    const { data, error } = await this.supabase
      .from('analysis')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new ValidationError('Analysis not found');
      }
      throw new DatabaseError('Failed to fetch analysis', error);
    }

    return data as AnalysisDTO;
  }

  async updateAnalysis(id: number, command: UpdateAnalysisCommand, userId: string): Promise<AnalysisDTO> {
    // Check if analysis exists and belongs to user
    await this.getAnalysis(id, userId);

    // Update analysis
    const { data, error } = await this.supabase
      .from('analysis')
      .update({
        analysis_type_id: command.analysis_type_id,
        parameters: command.parameters,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update analysis', error);
    }

    return data as AnalysisDTO;
  }

  async deleteAnalysis(id: number, userId: string): Promise<void> {
    // Check if analysis exists and belongs to user
    await this.getAnalysis(id, userId);

    // Delete analysis
    const { error } = await this.supabase
      .from('analysis')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError('Failed to delete analysis', error);
    }
  }

  async logError(error: Error, userId: string, input?: any): Promise<void> {
    await this.supabase
      .from('logs')
      .insert({
        event: 'analysis_generator',
        type: 'error',
        log: {
          message: error.message,
          error: error instanceof Error ? error.stack : String(error),
          input
        },
        user_id: userId
      });
  }
}
