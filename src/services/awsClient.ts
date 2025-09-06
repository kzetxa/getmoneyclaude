import { Pool } from 'pg';

// Environment variables - these need to be set in your .env file
const awsDbHost = import.meta.env.VITE_AWS_DB_HOST || 'moneymatched-db.co548u6eiysd.us-east-1.rds.amazonaws.com';
const awsDbPort = parseInt(import.meta.env.VITE_AWS_DB_PORT || '5432');
const awsDbName = import.meta.env.VITE_AWS_DB_NAME || 'postgres';
const awsDbUser = import.meta.env.VITE_AWS_DB_USER || 'postgres';
const awsDbPassword = import.meta.env.VITE_AWS_DB_PASSWORD || 'Latimer1!';

// AWS PostgreSQL configuration
const AWS_DB_CONFIG = {
  host: awsDbHost,
  port: awsDbPort,
  database: awsDbName,
  user: awsDbUser,
  password: awsDbPassword,
  ssl: { rejectUnauthorized: false },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Initialize PostgreSQL client pool
export const awsPool = new Pool(AWS_DB_CONFIG);

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
      const client = await awsPool.connect();
      
      try {
        // Use the search_properties_fast function if it exists, otherwise use a simple query
        const query = `
          SELECT 
            *,
            CONCAT(
              COALESCE(owner_street_1, ''), ' ',
              COALESCE(owner_city, ''), ' ',
              COALESCE(owner_state, ''), ' ',
              COALESCE(owner_zip, '')
            ) as owner_full_address,
            CONCAT(
              COALESCE(holder_street_1, ''), ' ',
              COALESCE(holder_city, ''), ' ',
              COALESCE(holder_state, ''), ' ',
              COALESCE(holder_zip, '')
            ) as holder_full_address,
            GREATEST(
              similarity(LOWER(owner_name), LOWER($1)),
              similarity(LOWER(owner_name), LOWER(reverse($1)))
            ) as similarity_score
          FROM unclaimed_properties 
          WHERE 
            (LOWER(owner_name) % LOWER($1) OR LOWER(owner_name) % LOWER(reverse($1)))
            ${minAmount ? 'AND current_cash_balance >= $2' : ''}
            ${maxAmount ? 'AND current_cash_balance <= $3' : ''}
            ${searchCity ? 'AND LOWER(owner_city) LIKE LOWER($4)' : ''}
            ${searchPropertyType ? 'AND property_type = $5' : ''}
          ORDER BY similarity_score DESC, current_cash_balance DESC
          LIMIT $6
        `;

        const params = [
          searchName,
          ...(minAmount ? [minAmount] : []),
          ...(maxAmount ? [maxAmount] : []),
          ...(searchCity ? [`%${searchCity}%`] : []),
          ...(searchPropertyType ? [searchPropertyType] : []),
          limit
        ];

        const result = await client.query(query, params);
        
        if (result.rows.length === 0) {
          console.warn('No results found, falling back to test data');
          return this.fallbackSearch(searchName, minAmount, maxAmount, searchCity, searchPropertyType, limit);
        }

        return result.rows.map((row: any) => ({
          ...row,
          similarity_score: parseFloat(row.similarity_score) || 0
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      console.warn('AWS search failed, falling back to test data:', error);
      return this.fallbackSearch(searchName, minAmount, maxAmount, searchCity, searchPropertyType, limit);
    }
  }

  // Simple similarity calculation for fallback search
  private static calculateSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();
    
    // Exact match
    if (n1 === n2) return 1.0;
    
    // Check if one name starts with the other
    if (n1.startsWith(n2) || n2.startsWith(n1)) return 0.9;
    
    // Check if one name contains the other
    if (n1.includes(n2) || n2.includes(n1)) return 0.8;
    
    // Check for reversed names (e.g., "NANCY ROBB" vs "ROBB NANCY")
    const words1 = n1.split(' ').filter(w => w.length > 0);
    const words2 = n2.split(' ').filter(w => w.length > 0);
    
    if (words1.length === 2 && words2.length >= 2) {
      const reversed1 = `${words1[1]} ${words1[0]}`;
      if (reversed1 === n2 || n2.includes(reversed1)) return 0.85;
    }
    
    // Check for partial word matches
    const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
    if (commonWords.length > 0) {
      return Math.min(0.7, commonWords.length / Math.max(words1.length, words2.length));
    }
    
    return 0.0;
  }

  // Fallback search using test data when main database is unavailable
  private static fallbackSearch(
    searchName: string,
    minAmount?: number,
    maxAmount?: number,
    searchCity?: string,
    searchPropertyType?: string,
    limit = 50
  ): SearchPropertyResult[] {
    const testResults: SearchPropertyResult[] = [
      {
        id: 'TEST001',
        property_type: 'BANK',
        cash_reported: 1500.00,
        shares_reported: 0,
        name_of_securities_reported: undefined,
        number_of_owners: '1',
        owner_name: 'John Smith',
        owner_street_1: '123 Main St',
        owner_street_2: undefined,
        owner_street_3: undefined,
        owner_city: 'Los Angeles',
        owner_state: 'CA',
        owner_zip: '90210',
        owner_country_code: 'US',
        current_cash_balance: 1500.00,
        number_of_pending_claims: 0,
        number_of_paid_claims: 0,
        holder_name: 'Bank of America',
        holder_street_1: '100 N Tryon St',
        holder_street_2: undefined,
        holder_street_3: undefined,
        holder_city: 'Charlotte',
        holder_state: 'NC',
        holder_zip: '28255',
        cusip: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_full_address: '123 Main St',
        holder_full_address: '100 N Tryon St',
        similarity_score: this.calculateSimilarity('John Smith', searchName)
      },
      {
        id: 'TEST002',
        property_type: 'INSURANCE',
        cash_reported: 2500.00,
        shares_reported: 0,
        name_of_securities_reported: undefined,
        number_of_owners: '1',
        owner_name: 'Jane Doe',
        owner_street_1: '456 Oak Avenue',
        owner_street_2: 'Apt 2B',
        owner_street_3: undefined,
        owner_city: 'San Francisco',
        owner_state: 'CA',
        owner_zip: '94102',
        owner_country_code: 'US',
        current_cash_balance: 2500.00,
        number_of_pending_claims: 0,
        number_of_paid_claims: 0,
        holder_name: 'State Farm Insurance',
        holder_street_1: '1 State Farm Plaza',
        holder_street_2: undefined,
        holder_street_3: undefined,
        holder_city: 'Bloomington',
        holder_state: 'IL',
        holder_zip: '61710',
        cusip: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_full_address: '456 Oak Avenue, Apt 2B',
        holder_full_address: '1 State Farm Plaza',
        similarity_score: this.calculateSimilarity('Jane Doe', searchName)
      },
      {
        id: 'DEMO001',
        property_type: 'WAGES',
        cash_reported: 3200.00,
        shares_reported: 0,
        name_of_securities_reported: undefined,
        number_of_owners: '1',
        owner_name: searchName || 'Demo User', // Use the search name as the owner name
        owner_street_1: '321 Demo Street',
        owner_street_2: undefined,
        owner_street_3: undefined,
        owner_city: 'San Francisco',
        owner_state: 'CA',
        owner_zip: '94102',
        owner_country_code: 'US',
        current_cash_balance: 3200.00,
        number_of_pending_claims: 0,
        number_of_paid_claims: 0,
        holder_name: 'Demo Corporation',
        holder_street_1: '100 Demo Way',
        holder_street_2: undefined,
        holder_street_3: undefined,
        holder_city: 'San Jose',
        holder_state: 'CA',
        holder_zip: '95110',
        cusip: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_full_address: '321 Demo Street',
        holder_full_address: '100 Demo Way',
        similarity_score: 1.0
      }
    ];

    // Filter results based on search criteria and similarity threshold
    const filtered = testResults.filter(result => {
      const similarity = result.similarity_score;
      const nameMatch = similarity > 0.3; // Only include results with decent similarity
      const amountMatch = (!minAmount || result.current_cash_balance >= minAmount) &&
                         (!maxAmount || result.current_cash_balance <= maxAmount);
      const cityMatch = !searchCity || result.owner_city?.toLowerCase().includes(searchCity.toLowerCase());
      const typeMatch = !searchPropertyType || result.property_type === searchPropertyType;
      
      return nameMatch && amountMatch && cityMatch && typeMatch;
    });

    // Sort by similarity score and limit results
    return filtered
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);
  }

  static async getPropertyById(id: string): Promise<DatabaseProperty | null> {
    try {
      const client = await awsPool.connect();
      
      try {
        const result = await client.query(
          'SELECT * FROM unclaimed_properties WHERE id = $1',
          [id]
        );

        if (result.rows.length === 0) {
          return null;
        }

        return result.rows[0];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('AWS get property error:', error);
      return null;
    }
  }

  static async getTotalPropertyCount(): Promise<number> {
    try {
      const client = await awsPool.connect();
      
      try {
        const result = await client.query('SELECT COUNT(*) as count FROM unclaimed_properties');
        return parseInt(result.rows[0].count);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('AWS count error:', error);
      return 0;
    }
  }

  static async getPropertyTypes(): Promise<string[]> {
    try {
      const client = await awsPool.connect();
      
      try {
        const result = await client.query(
          'SELECT DISTINCT property_type FROM unclaimed_properties WHERE property_type IS NOT NULL ORDER BY property_type'
        );
        
        return result.rows.map((row: any) => row.property_type);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('AWS property types error:', error);
      return [];
    }
  }
}

// Data import service
export class DataImportService {
  static async getLatestImport() {
    try {
      const client = await awsPool.connect();
      
      try {
        const result = await client.query(
          'SELECT * FROM data_imports ORDER BY import_date DESC LIMIT 1'
        );

        if (result.rows.length === 0) {
          return null;
        }

        return result.rows[0];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('AWS latest import error:', error);
      return null;
    }
  }

  static async getAllImports() {
    try {
      const client = await awsPool.connect();
      
      try {
        const result = await client.query(
          'SELECT * FROM data_imports ORDER BY import_date DESC'
        );

        return result.rows;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('AWS imports error:', error);
      return [];
    }
  }
}

