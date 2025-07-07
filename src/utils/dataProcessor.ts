import type { UnclaimedProperty } from '../types/Property';

export interface CSVRow {
  PROPERTY_ID: string;
  PROPERTY_TYPE: string;
  CASH_REPORTED: string;
  SHARES_REPORTED: string;
  NAME_OF_SECURITIES_REPORTED: string;
  NO_OF_OWNERS: string;
  OWNER_NAME: string;
  OWNER_STREET_1: string;
  OWNER_STREET_2: string;
  OWNER_STREET_3: string;
  OWNER_CITY: string;
  OWNER_STATE: string;
  OWNER_ZIP: string;
  OWNER_COUNTRY_CODE: string;
  CURRENT_CASH_BALANCE: string;
  NUMBER_OF_PENDING_CLAIMS: string;
  NUMBER_OF_PAID_CLAIMS: string;
  HOLDER_NAME: string;
  HOLDER_STREET_1: string;
  HOLDER_STREET_2: string;
  HOLDER_STREET_3: string;
  HOLDER_CITY: string;
  HOLDER_STATE: string;
  HOLDER_ZIP: string;
  CUSIP: string;
}

export class CaliforniaUnclaimedPropertyProcessor {
  static parseCSVRow(row: CSVRow): UnclaimedProperty {
    return {
      id: row.PROPERTY_ID,
      propertyType: row.PROPERTY_TYPE,
      cashReported: parseFloat(row.CASH_REPORTED) || 0,
      sharesReported: parseFloat(row.SHARES_REPORTED) || 0,
      nameOfSecuritiesReported: row.NAME_OF_SECURITIES_REPORTED || '',
      numberOfOwners: row.NO_OF_OWNERS,
      ownerName: row.OWNER_NAME,
      ownerStreet1: row.OWNER_STREET_1 || '',
      ownerStreet2: row.OWNER_STREET_2 || '',
      ownerStreet3: row.OWNER_STREET_3 || '',
      ownerCity: row.OWNER_CITY || '',
      ownerState: row.OWNER_STATE || '',
      ownerZip: row.OWNER_ZIP || '',
      ownerCountryCode: row.OWNER_COUNTRY_CODE || '',
      currentCashBalance: parseFloat(row.CURRENT_CASH_BALANCE) || 0,
      numberOfPendingClaims: parseInt(row.NUMBER_OF_PENDING_CLAIMS) || 0,
      numberOfPaidClaims: parseInt(row.NUMBER_OF_PAID_CLAIMS) || 0,
      holderName: row.HOLDER_NAME,
      holderStreet1: row.HOLDER_STREET_1 || '',
      holderStreet2: row.HOLDER_STREET_2 || '',
      holderStreet3: row.HOLDER_STREET_3 || '',
      holderCity: row.HOLDER_CITY || '',
      holderState: row.HOLDER_STATE || '',
      holderZip: row.HOLDER_ZIP || '',
      cusip: row.CUSIP || ''
    };
  }

  static async parseCSVText(csvText: string): Promise<UnclaimedProperty[]> {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const properties: UnclaimedProperty[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const property = this.parseCSVRow(row as CSVRow);
        properties.push(property);
      } catch (error) {
        console.warn(`Error parsing CSV row ${i}:`, error);
        // Continue processing other rows
      }
    }

    return properties;
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quotes
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  }

  static async downloadAndProcessData(): Promise<UnclaimedProperty[]> {
    try {
      // This would be implemented to download the ZIP file and process all CSV files
      // For now, return empty array as this would require server-side functionality
      console.log('Data download functionality would be implemented here');
      return [];
    } catch (error) {
      console.error('Error downloading and processing data:', error);
      throw error;
    }
  }

  static getPropertyTypeDescription(propertyType: string): string {
    const typeMap: { [key: string]: string } = {
      'AC01': 'Checking Accounts',
      'AC02': 'Savings Accounts',
      'AC03': 'Mature CD or Save Cert',
      'AC55': 'Bank Accounts (Legacy)',
      '04': 'Dividends',
      '82': 'Savings Accounts/Credit Union Shares',
      '76': 'Other Property',
      '32': 'Life Insurance',
      'CK01': 'Cashier\'s Checks',
      'IN01': 'Insurance Benefits',
      'MS01': 'Wages/Payroll'
    };

    // Extract the code from property type (e.g., "04: Dividends" -> "04")
    const code = propertyType.split(':')[0].trim();
    return typeMap[code] || propertyType;
  }
} 