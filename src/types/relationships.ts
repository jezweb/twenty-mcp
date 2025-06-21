export interface RelationshipSummary {
  entityId: string;
  entityType: string;
  relationships: {
    companies: number;
    contacts: number;
    opportunities: number;
    tasks: number;
    activities: number;
  };
}

export interface CompanyContactsResult {
  companyId: string;
  companyName: string;
  contacts: Array<{
    id: string;
    name: {
      firstName: string;
      lastName: string;
    };
    email?: string;
    phone?: string;
    jobTitle?: string;
    createdAt: string;
  }>;
  totalContacts: number;
}

export interface PersonOpportunitiesResult {
  personId: string;
  personName: string;
  opportunities: Array<{
    id: string;
    name: string;
    amount?: {
      amountMicros: number;
      currencyCode: string;
    };
    stage?: string;
    closeDate?: string;
    companyId?: string;
    company?: {
      id: string;
      name: string;
    };
    createdAt: string;
  }>;
  totalOpportunities: number;
}

export interface OpportunityActivitiesResult {
  opportunityId: string;
  opportunityName: string;
  activities: Array<{
    id: string;
    type: string;
    title?: string;
    body?: string;
    createdAt: string;
    author?: {
      id: string;
      name: {
        firstName: string;
        lastName: string;
      };
    };
  }>;
  totalActivities: number;
}

export interface RelationshipHierarchy {
  entityId: string;
  entityType: string;
  entityName: string;
  children: {
    companies?: Array<{
      id: string;
      name: string;
      contacts: Array<{
        id: string;
        name: string;
        opportunities: Array<{
          id: string;
          name: string;
          stage?: string;
        }>;
      }>;
    }>;
    contacts?: Array<{
      id: string;
      name: string;
      company?: {
        id: string;
        name: string;
      };
      opportunities: Array<{
        id: string;
        name: string;
        stage?: string;
      }>;
    }>;
    opportunities?: Array<{
      id: string;
      name: string;
      company?: {
        id: string;
        name: string;
      };
      contact?: {
        id: string;
        name: string;
      };
      tasks: Array<{
        id: string;
        title: string;
        status?: string;
      }>;
    }>;
  };
}

export interface OrphanedRecords {
  companies: Array<{
    id: string;
    name: string;
    contactCount: number;
    opportunityCount: number;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    hasCompany: boolean;
    opportunityCount: number;
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    hasCompany: boolean;
    hasContact: boolean;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    hasAssignee: boolean;
  }>;
}

export interface LinkOpportunityInput {
  opportunityId: string;
  companyId?: string;
  pointOfContactId?: string;
}

export interface TransferContactInput {
  contactId: string;
  fromCompanyId?: string;
  toCompanyId: string;
}

export interface BulkRelationshipUpdate {
  entityType: 'opportunity' | 'contact' | 'task';
  updates: Array<{
    entityId: string;
    relationships: {
      companyId?: string;
      pointOfContactId?: string;
      assigneeId?: string;
    };
  }>;
}