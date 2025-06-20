export interface Opportunity {
  id: string;
  name: string;
  amount?: {
    amountMicros: number;
    currencyCode: string;
  };
  stage?: string;
  closeDate?: string;
  companyId?: string;
  pointOfContactId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOpportunityInput {
  name: string;
  amount?: {
    amountMicros: number;
    currencyCode: string;
  };
  stage?: string;
  closeDate?: string;
  companyId?: string;
  pointOfContactId?: string;
}

export interface UpdateOpportunityInput {
  id: string;
  name?: string;
  amount?: {
    amountMicros: number;
    currencyCode: string;
  };
  stage?: string;
  closeDate?: string;
  companyId?: string;
  pointOfContactId?: string;
}

export interface SearchOpportunitiesInput {
  query?: string;
  stage?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  companyId?: string;
  limit?: number;
  offset?: number;
}

export interface OpportunityStage {
  value: string;
  label: string;
  position: number;
  color: string;
}