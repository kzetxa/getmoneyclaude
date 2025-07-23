import { makeAutoObservable, runInAction } from 'mobx';
import { PropertySearchService, type SearchPropertyResult } from '../services/supabaseClient';
import type { SearchFilters, UnclaimedProperty } from '../types/Property';

export class PropertyStore {
  // Observable state
  properties: UnclaimedProperty[] = [];
  searchResults: UnclaimedProperty[] = [];
  searchFilters: SearchFilters = {};
  isLoading = false;
  error: string | null = null;
  lastUpdateDate: Date | null = null;
  searchQuery = '';
  lastSearchedQuery = ''; // Track the last query that was actually searched
  _totalPropertyCount = 0;
  
  constructor() {
    makeAutoObservable(this);
    this.loadTotalCount();
  }

  // Convert database property to frontend format
  private convertDatabaseProperty(dbProperty: SearchPropertyResult): UnclaimedProperty {
    return {
      id: dbProperty.id,
      propertyType: dbProperty.property_type,
      cashReported: dbProperty.cash_reported,
      sharesReported: dbProperty.shares_reported,
      nameOfSecuritiesReported: dbProperty.name_of_securities_reported || '',
      numberOfOwners: dbProperty.number_of_owners,
      ownerName: dbProperty.owner_name,
      // Use full address as street1 if available, otherwise try individual fields
      ownerStreet1: dbProperty.owner_full_address || dbProperty.owner_street_1 || '',
      ownerStreet2: dbProperty.owner_street_2 || '',
      ownerStreet3: dbProperty.owner_street_3 || '',
      ownerCity: dbProperty.owner_city || '',
      ownerState: dbProperty.owner_state || '',
      ownerZip: dbProperty.owner_zip || '',
      ownerCountryCode: dbProperty.owner_country_code || '',
      currentCashBalance: dbProperty.current_cash_balance,
      numberOfPendingClaims: dbProperty.number_of_pending_claims,
      numberOfPaidClaims: dbProperty.number_of_paid_claims,
      holderName: dbProperty.holder_name,
      // Use full address as street1 if available, otherwise try individual fields
      holderStreet1: dbProperty.holder_full_address || dbProperty.holder_street_1 || '',
      holderStreet2: dbProperty.holder_street_2 || '',
      holderStreet3: dbProperty.holder_street_3 || '',
      holderCity: dbProperty.holder_city || '',
      holderState: dbProperty.holder_state || '',
      holderZip: dbProperty.holder_zip || '',
      cusip: dbProperty.cusip || ''
    };
  }

  private async loadTotalCount() {
    try {
      const count = await PropertySearchService.getTotalPropertyCount();
      runInAction(() => {
        this._totalPropertyCount = count;
      });
    } catch (error) {
      console.error('Error loading total count:', error);
    }
  }

  // Actions
  setSearchQuery = (query: string) => {
    this.searchQuery = query;
    // Remove automatic search - now only searches when explicitly triggered
  };

  setSearchFilters = (filters: Partial<SearchFilters>) => {
    this.searchFilters = { ...this.searchFilters, ...filters };
    // Remove automatic search on filter change
  };

  clearSearch = () => {
    this.searchResults = [];
    this.searchQuery = '';
    this.lastSearchedQuery = '';
    this.error = null;
  };

  performSearch = async () => {
    const trimmedQuery = this.searchQuery.trim();
    
    if (!trimmedQuery) {
      this.clearSearch();
      return;
    }

    // Prevent searching with the same text string
    if (trimmedQuery === this.lastSearchedQuery) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.lastSearchedQuery = trimmedQuery;

    try {
      const results = await PropertySearchService.searchProperties({
        searchName: trimmedQuery,
        minAmount: this.searchFilters.minAmount,
        maxAmount: this.searchFilters.maxAmount,
        searchCity: this.searchFilters.city,
        searchPropertyType: this.searchFilters.propertyType,
        limit: 50
      });

      const convertedResults = results.map(result => this.convertDatabaseProperty(result));
      
      runInAction(() => {
        this.searchResults = convertedResults;
        this.isLoading = false;
        this.error = null;
      });

    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'An error occurred while searching. Please try again.';
        this.isLoading = false;
      });
    }
  };

  loadPropertyData = async (data: UnclaimedProperty[]) => {
    runInAction(() => {
      this.properties = data;
      this.lastUpdateDate = new Date();
    });
  };

  // Computed values
  get searchResultsCount() {
    return this.searchResults.length;
  }

  get totalPropertyCount() {
    return this._totalPropertyCount;
  }

  get hasResults() {
    return this.searchResults.length > 0;
  }

  get hasSearched() {
    return this.lastSearchedQuery.length > 0;
  }
} 