export interface UnclaimedProperty {
  id: string;
  propertyType: string;
  cashReported: number;
  sharesReported: number;
  nameOfSecuritiesReported?: string;
  numberOfOwners: string;
  ownerName: string;
  ownerStreet1?: string;
  ownerStreet2?: string;
  ownerStreet3?: string;
  ownerCity?: string;
  ownerState?: string;
  ownerZip?: string;
  ownerCountryCode?: string;
  currentCashBalance: number;
  numberOfPendingClaims: number;
  numberOfPaidClaims: number;
  holderName: string;
  holderStreet1?: string;
  holderStreet2?: string;
  holderStreet3?: string;
  holderCity?: string;
  holderState?: string;
  holderZip?: string;
  cusip?: string;
}

export interface SearchFilters {
  firstName?: string;
  lastName?: string;
  minAmount?: number;
  maxAmount?: number;
  propertyType?: string;
  city?: string;
  state?: string;
}

export interface SearchResult {
  properties: UnclaimedProperty[];
  totalCount: number;
  searchTime: number;
} 