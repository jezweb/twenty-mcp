import { GraphQLClient } from 'graphql-request';
import { TwentyConfig, Person, Company, Task, Note, SearchOptions } from '../types/twenty.js';

export class TwentyClient {
  private client: GraphQLClient;
  private baseUrl: string;

  constructor(config: TwentyConfig) {
    this.baseUrl = config.baseUrl || 'https://api.twenty.com';
    this.client = new GraphQLClient(`${this.baseUrl}/graphql`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createPerson(person: Person): Promise<Person> {
    const mutation = `
      mutation CreatePerson($data: PersonCreateInput!) {
        createPerson(data: $data) {
          id
          name {
            firstName
            lastName
          }
          emails {
            primaryEmail
          }
          phones {
            primaryPhoneNumber
            primaryPhoneCountryCode
          }
          companyId
          jobTitle
          linkedinLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          city
          avatarUrl
        }
      }
    `;

    const result = await this.client.request(mutation, { data: person }) as { createPerson: Person };
    return result.createPerson;
  }

  async getPerson(id: string): Promise<Person> {
    const query = `
      query GetPerson($filter: PersonFilterInput!) {
        people(filter: $filter) {
          edges {
            node {
              id
              name {
                firstName
                lastName
              }
              emails {
                primaryEmail
              }
              phones {
                primaryPhoneNumber
                primaryPhoneCountryCode
              }
              companyId
              jobTitle
              linkedinLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              city
              avatarUrl
            }
          }
        }
      }
    `;

    const result = await this.client.request(query, { filter: { id: { eq: id } } }) as { people: { edges: { node: Person }[] } };
    return result.people.edges[0]?.node;
  }

  async updatePerson(id: string, updates: Partial<Person>): Promise<Person> {
    const mutation = `
      mutation UpdatePerson($id: ID!, $data: PersonUpdateInput!) {
        updatePerson(id: $id, data: $data) {
          id
          name {
            firstName
            lastName
          }
          emails {
            primaryEmail
          }
          phones {
            primaryPhoneNumber
            primaryPhoneCountryCode
          }
          companyId
          jobTitle
          linkedinLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          city
          avatarUrl
        }
      }
    `;

    const result = await this.client.request(mutation, { id, data: updates }) as { updatePerson: Person };
    return result.updatePerson;
  }

  async searchPeople(query: string, options: SearchOptions = {}): Promise<Person[]> {
    const searchQuery = `
      query SearchPeople($filter: PersonFilterInput, $first: Int, $after: String) {
        people(filter: $filter, first: $first, after: $after) {
          edges {
            node {
              id
              name {
                firstName
                lastName
              }
              emails {
                primaryEmail
              }
              phones {
                primaryPhoneNumber
                primaryPhoneCountryCode
              }
              companyId
              jobTitle
              linkedinLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              city
              avatarUrl
            }
          }
        }
      }
    `;

    const filter = {
      or: [
        { name: { firstName: { ilike: `%${query}%` } } },
        { name: { lastName: { ilike: `%${query}%` } } },
        { emails: { primaryEmail: { ilike: `%${query}%` } } }
      ]
    };

    const result = await this.client.request(searchQuery, {
      filter,
      first: options.limit || 20,
    }) as { people: { edges: { node: Person }[] } };

    return result.people.edges.map(edge => edge.node);
  }

  async createCompany(company: Company): Promise<Company> {
    const mutation = `
      mutation CreateCompany($data: CompanyCreateInput!) {
        createCompany(data: $data) {
          id
          name
          domainName {
            primaryLinkUrl
            primaryLinkLabel
          }
          address {
            addressStreet1
            addressCity
            addressState
            addressCountry
            addressPostcode
          }
          employees
          linkedinLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          xLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          annualRecurringRevenue {
            amountMicros
            currencyCode
          }
          idealCustomerProfile
        }
      }
    `;

    const result = await this.client.request(mutation, { data: company }) as { createCompany: Company };
    return result.createCompany;
  }

  async getCompany(id: string): Promise<Company> {
    const query = `
      query GetCompany($filter: CompanyFilterInput!) {
        companies(filter: $filter) {
          edges {
            node {
              id
              name
              domainName {
                primaryLinkUrl
                primaryLinkLabel
              }
              address {
                addressStreet1
                addressCity
                addressState
                addressCountry
                addressPostcode
              }
              employees
              linkedinLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              xLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              annualRecurringRevenue {
                amountMicros
                currencyCode
              }
              idealCustomerProfile
            }
          }
        }
      }
    `;

    const result = await this.client.request(query, { filter: { id: { eq: id } } }) as { companies: { edges: { node: Company }[] } };
    return result.companies.edges[0]?.node;
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    const mutation = `
      mutation UpdateCompany($id: ID!, $data: CompanyUpdateInput!) {
        updateCompany(id: $id, data: $data) {
          id
          name
          domainName {
            primaryLinkUrl
            primaryLinkLabel
          }
          address {
            addressStreet1
            addressCity
            addressState
            addressCountry
            addressPostcode
          }
          employees
          linkedinLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          xLink {
            primaryLinkUrl
            primaryLinkLabel
          }
          annualRecurringRevenue {
            amountMicros
            currencyCode
          }
          idealCustomerProfile
        }
      }
    `;

    const result = await this.client.request(mutation, { id, data: updates }) as { updateCompany: Company };
    return result.updateCompany;
  }

  async searchCompanies(query: string, options: SearchOptions = {}): Promise<Company[]> {
    const searchQuery = `
      query SearchCompanies($filter: CompanyFilterInput, $first: Int, $after: String) {
        companies(filter: $filter, first: $first, after: $after) {
          edges {
            node {
              id
              name
              domainName {
                primaryLinkUrl
                primaryLinkLabel
              }
              address {
                addressStreet1
                addressCity
                addressState
                addressCountry
                addressPostcode
              }
              employees
              linkedinLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              xLink {
                primaryLinkUrl
                primaryLinkLabel
              }
              annualRecurringRevenue {
                amountMicros
                currencyCode
              }
              idealCustomerProfile
            }
          }
        }
      }
    `;

    const filter = {
      or: [
        { name: { ilike: `%${query}%` } },
        { domainName: { primaryLinkUrl: { ilike: `%${query}%` } } }
      ]
    };

    const result = await this.client.request(searchQuery, {
      filter,
      first: options.limit || 20,
    }) as { companies: { edges: { node: Company }[] } };

    return result.companies.edges.map(edge => edge.node);
  }

  async createTask(task: Task): Promise<Task> {
    const mutation = `
      mutation CreateTask($data: TaskCreateInput!) {
        createTask(data: $data) {
          id
          title
          body
          dueAt
          status
          assigneeId
        }
      }
    `;

    const result = await this.client.request(mutation, { data: task }) as { createTask: Task };
    return result.createTask;
  }

  async getTasks(options: SearchOptions = {}): Promise<Task[]> {
    const query = `
      {
        tasks {
          edges {
            node {
              id
              title
              body
              status
            }
          }
        }
      }
    `;

    const result = await this.client.request(query) as { tasks: { edges: { node: Task }[] } };

    return result.tasks.edges.map(edge => edge.node);
  }

  async createNote(note: Note): Promise<Note> {
    const mutation = `
      mutation CreateNote($data: NoteCreateInput!) {
        createNote(data: $data) {
          id
          title
          body
          authorId
        }
      }
    `;

    const result = await this.client.request(mutation, { data: note }) as { createNote: Note };
    return result.createNote;
  }
}