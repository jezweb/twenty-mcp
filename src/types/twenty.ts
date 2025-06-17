export interface TwentyConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface FullName {
  firstName: string;
  lastName: string;
}

export interface Emails {
  primaryEmail: string;
  additionalEmails?: string[];
}

export interface Phones {
  primaryPhoneNumber?: string;
  primaryPhoneCountryCode?: string;
  additionalPhones?: any[];
}

export interface Links {
  primaryLinkUrl?: string;
  primaryLinkLabel?: string;
  secondaryLinks?: any[];
}

export interface Address {
  addressStreet1?: string;
  addressStreet2?: string;
  addressCity?: string;
  addressState?: string;
  addressCountry?: string;
  addressPostcode?: string;
}

export interface Currency {
  amountMicros?: number;
  currencyCode?: string;
}

export interface Person {
  id?: string;
  name: FullName;
  emails?: Emails;
  phones?: Phones;
  companyId?: string;
  jobTitle?: string;
  linkedinLink?: Links;
  xLink?: Links;
  city?: string;
  avatarUrl?: string;
}

export interface Company {
  id?: string;
  name: string;
  domainName?: Links;
  address?: Address;
  employees?: number;
  linkedinLink?: Links;
  xLink?: Links;
  annualRecurringRevenue?: Currency;
  idealCustomerProfile?: boolean;
  accountOwnerId?: string;
}

export interface Task {
  id?: string;
  title: string;
  body?: string;
  dueAt?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assigneeId?: string;
}

export interface Note {
  id?: string;
  title?: string;
  body: string;
  authorId?: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}