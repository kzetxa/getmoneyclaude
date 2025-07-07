import { makeAutoObservable, runInAction } from 'mobx';
import type { UnclaimedProperty, SearchFilters, SearchResult } from '../types/Property';

export class PropertyStore {
  // Observable state
  properties: UnclaimedProperty[] = [];
  searchResults: UnclaimedProperty[] = [];
  searchFilters: SearchFilters = {};
  isLoading = false;
  error: string | null = null;
  lastUpdateDate: Date | null = null;
  searchQuery = '';
  
  constructor() {
    makeAutoObservable(this);
  }

  // Actions
  setSearchQuery = (query: string) => {
    this.searchQuery = query;
    if (query.trim()) {
      this.performSearch();
    } else {
      this.clearSearch();
    }
  };

  setSearchFilters = (filters: Partial<SearchFilters>) => {
    this.searchFilters = { ...this.searchFilters, ...filters };
    if (this.searchQuery.trim()) {
      this.performSearch();
    }
  };

  clearSearch = () => {
    this.searchResults = [];
    this.searchQuery = '';
    this.error = null;
  };

  performSearch = () => {
    const startTime = Date.now();
    this.isLoading = true;
    this.error = null;

    try {
      // Simple name-based search implementation
      const query = this.searchQuery.toLowerCase().trim();
      const results = this.properties.filter(property => {
        const ownerName = property.ownerName.toLowerCase();
        
        // Check if query matches any part of the owner name
        const nameMatch = ownerName.includes(query);
        
        // Apply additional filters
        if (this.searchFilters.minAmount && property.currentCashBalance < this.searchFilters.minAmount) {
          return false;
        }
        if (this.searchFilters.maxAmount && property.currentCashBalance > this.searchFilters.maxAmount) {
          return false;
        }
        if (this.searchFilters.city && !property.ownerCity?.toLowerCase().includes(this.searchFilters.city.toLowerCase())) {
          return false;
        }
        if (this.searchFilters.propertyType && property.propertyType !== this.searchFilters.propertyType) {
          return false;
        }

        return nameMatch;
      });

      runInAction(() => {
        this.searchResults = results;
        this.isLoading = false;
      });

    } catch (error) {
      runInAction(() => {
        this.error = 'An error occurred while searching. Please try again.';
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
    return this.properties.length;
  }

  get hasResults() {
    return this.searchResults.length > 0;
  }

  get hasSearched() {
    return this.searchQuery.trim().length > 0;
  }
} 