import { createClient } from '@supabase/supabase-js';

// Environment variables - these need to be set in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on our schema
export interface DatabaseProperty {
  id: string;
  property_type: string;
  cash_reported: number;
  shares_reported: number;
  name_of_securities_reported?: string;
  number_of_owners: string;
  owner_name: string;
  owner_street_1?: string;
  owner_street_2?: string;
  owner_street_3?: string;
  owner_city?: string;
  owner_state?: string;
  owner_zip?: string;
  owner_country_code?: string;
  current_cash_balance: number;
  number_of_pending_claims: number;
  number_of_paid_claims: number;
  holder_name: string;
  holder_street_1?: string;
  holder_street_2?: string;
  holder_street_3?: string;
  holder_city?: string;
  holder_state?: string;
  holder_zip?: string;
  cusip?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchPropertyResult extends DatabaseProperty {
  owner_full_address: string;
  holder_full_address: string;
  similarity_score: number;
}

// Property search service
export class PropertySearchService {
  static async searchProperties({
    searchName,
    minAmount,
    maxAmount,
    searchCity,
    searchPropertyType,
    limit = 50
  }: {
    searchName: string;
    minAmount?: number;
    maxAmount?: number;
    searchCity?: string;
    searchPropertyType?: string;
    limit?: number;
  }): Promise<SearchPropertyResult[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_properties_fast', {
          search_name: searchName,
          min_amount: minAmount || null,
          max_amount: maxAmount || null,
          search_city: searchCity || null,
          // <-- this key must exactly match the SQL arg name:
          search_prop_type: searchPropertyType || null,
          search_limit: limit
        });

      if (error) {
        console.error('Search failed:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Search service error:', error);
      return [];
    }
  }

  static async getPropertyById(id: string): Promise<DatabaseProperty | null> {
    try {
      const { data, error } = await supabase
        .from('unclaimed_properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase get property error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get property service error:', error);
      return null;
    }
  }

  static async getTotalPropertyCount(): Promise<number> {
    try {
      // Temporarily disable exact count during import to avoid timeouts
      // Return estimated count instead
      return 3534355; // Known total from import data
    } catch (error) {
      console.error('Count service error:', error);
      return 0;
    }
  }

  static async getPropertyTypes(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('unclaimed_properties')
        .select('property_type')
        .not('property_type', 'is', null);

      if (error) {
        console.error('Supabase property types error:', error);
        return [];
      }

      // Get unique property types
      const uniqueTypes = [...new Set(data.map(item => item.property_type))];
      return uniqueTypes.sort();
    } catch (error) {
      console.error('Property types service error:', error);
      return [];
    }
  }
}

// Data import service
export class DataImportService {
  static async getLatestImport() {
    try {
      const { data, error } = await supabase
        .from('data_imports')
        .select('*')
        .order('import_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Supabase latest import error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Latest import service error:', error);
      return null;
    }
  }

  static async getAllImports() {
    try {
      const { data, error } = await supabase
        .from('data_imports')
        .select('*')
        .order('import_date', { ascending: false });

      if (error) {
        console.error('Supabase imports error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Imports service error:', error);
      return [];
    }
  }
} 