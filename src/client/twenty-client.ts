import { GraphQLClient } from 'graphql-request';
import { TwentyConfig, Person, Company, Task, Note, SearchOptions } from '../types/twenty.js';
import { Opportunity, CreateOpportunityInput, UpdateOpportunityInput, SearchOpportunitiesInput } from '../types/opportunities.js';
import { Activity, Comment, CreateCommentInput, ActivityFilter, EntityActivitiesInput, ActivityTimeline } from '../types/activities.js';
import { ObjectMetadata, FieldMetadata, ObjectSchema, ObjectSummary, MetadataQueryOptions, FieldQueryOptions } from '../types/metadata.js';
import { 
  RelationshipSummary, 
  CompanyContactsResult, 
  PersonOpportunitiesResult, 
  OpportunityActivitiesResult,
  RelationshipHierarchy,
  OrphanedRecords,
  LinkOpportunityInput,
  TransferContactInput,
  BulkRelationshipUpdate
} from '../types/relationships.js';

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

  async createOpportunity(opportunity: CreateOpportunityInput): Promise<Opportunity> {
    const mutation = `
      mutation CreateOpportunity($data: OpportunityCreateInput!) {
        createOpportunity(data: $data) {
          id
          name
          amount {
            amountMicros
            currencyCode
          }
          stage
          closeDate
          companyId
          pointOfContactId
          createdAt
          updatedAt
        }
      }
    `;

    const result = await this.client.request(mutation, { data: opportunity }) as { createOpportunity: Opportunity };
    return result.createOpportunity;
  }

  async getOpportunity(id: string): Promise<Opportunity> {
    const query = `
      query GetOpportunity($filter: OpportunityFilterInput!) {
        opportunities(filter: $filter) {
          edges {
            node {
              id
              name
              amount {
                amountMicros
                currencyCode
              }
              stage
              closeDate
              companyId
              pointOfContactId
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const result = await this.client.request(query, { filter: { id: { eq: id } } }) as { opportunities: { edges: { node: Opportunity }[] } };
    return result.opportunities.edges[0]?.node;
  }

  async updateOpportunity(input: UpdateOpportunityInput): Promise<Opportunity> {
    const { id, ...data } = input;
    const mutation = `
      mutation UpdateOpportunity($id: ID!, $data: OpportunityUpdateInput!) {
        updateOpportunity(id: $id, data: $data) {
          id
          name
          amount {
            amountMicros
            currencyCode
          }
          stage
          closeDate
          companyId
          pointOfContactId
          createdAt
          updatedAt
        }
      }
    `;

    const result = await this.client.request(mutation, { id, data }) as { updateOpportunity: Opportunity };
    return result.updateOpportunity;
  }

  async searchOpportunities(input: SearchOpportunitiesInput): Promise<Opportunity[]> {
    const query = `
      query SearchOpportunities($filter: OpportunityFilterInput, $first: Int, $skip: Int) {
        opportunities(filter: $filter, first: $first, skip: $skip) {
          edges {
            node {
              id
              name
              amount {
                amountMicros
                currencyCode
              }
              stage
              closeDate
              companyId
              pointOfContactId
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const filters: any = {};
    
    if (input.query) {
      filters.name = { ilike: `%${input.query}%` };
    }
    
    if (input.stage) {
      filters.stage = { eq: input.stage };
    }
    
    if (input.companyId) {
      filters.companyId = { eq: input.companyId };
    }
    
    if (input.startDate || input.endDate) {
      filters.closeDate = {};
      if (input.startDate) filters.closeDate.gte = input.startDate;
      if (input.endDate) filters.closeDate.lte = input.endDate;
    }
    
    if (input.minAmount || input.maxAmount) {
      filters.amount = { amountMicros: {} };
      if (input.minAmount) filters.amount.amountMicros.gte = input.minAmount * 1000000;
      if (input.maxAmount) filters.amount.amountMicros.lte = input.maxAmount * 1000000;
    }

    const result = await this.client.request(query, {
      filter: Object.keys(filters).length > 0 ? filters : undefined,
      first: input.limit || 20,
      skip: input.offset || 0,
    }) as { opportunities: { edges: { node: Opportunity }[] } };

    return result.opportunities.edges.map(edge => edge.node);
  }

  async listOpportunitiesByStage(): Promise<Record<string, Opportunity[]>> {
    const query = `
      query ListAllOpportunities {
        opportunities(first: 100) {
          edges {
            node {
              id
              name
              amount {
                amountMicros
                currencyCode
              }
              stage
              closeDate
              companyId
              pointOfContactId
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const result = await this.client.request(query) as { opportunities: { edges: { node: Opportunity }[] } };
    const opportunities = result.opportunities.edges.map(edge => edge.node);
    
    // Group by stage
    const groupedByStage: Record<string, Opportunity[]> = {};
    opportunities.forEach(opp => {
      const stage = opp.stage || 'No Stage';
      if (!groupedByStage[stage]) {
        groupedByStage[stage] = [];
      }
      groupedByStage[stage].push(opp);
    });
    
    return groupedByStage;
  }

  async getActivities(filter?: ActivityFilter): Promise<ActivityTimeline> {
    // Get both tasks and notes as activities
    const tasksQuery = `
      query GetTasks($first: Int) {
        tasks(first: $first, orderBy: { createdAt: DescNullsLast }) {
          edges {
            node {
              id
              title
              body
              status
              dueAt
              assigneeId
              assignee {
                id
                name {
                  firstName
                  lastName
                }
              }
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const notesQuery = `
      query GetNotes($first: Int) {
        notes(first: $first, orderBy: { createdAt: DescNullsLast }) {
          edges {
            node {
              id
              title
              body
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const limit = filter?.limit || 20;

    const [tasksResult, notesResult] = await Promise.all([
      this.client.request(tasksQuery, { first: limit }),
      this.client.request(notesQuery, { first: limit })
    ]);
    
    const typedTasksResult = tasksResult as { tasks: { edges: { node: any }[] } };
    const typedNotesResult = notesResult as { notes: { edges: { node: any }[] } };

    // Transform and combine activities
    const activities: Activity[] = [];

    typedTasksResult.tasks.edges.forEach(edge => {
      const task = edge.node;
      activities.push({
        id: task.id,
        type: 'task',
        title: task.title,
        body: task.body,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        authorId: task.assigneeId,
        author: task.assignee
      });
    });

    typedNotesResult.notes.edges.forEach(edge => {
      const note = edge.node;
      activities.push({
        id: note.id,
        type: 'note',
        title: note.title,
        body: note.body,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        authorId: undefined,
        author: undefined
      });
    });

    // Sort by creation date (newest first)
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply filters
    let filteredActivities = activities;
    
    if (filter?.type && filter.type.length > 0) {
      filteredActivities = filteredActivities.filter(activity => filter.type!.includes(activity.type));
    }
    
    if (filter?.dateFrom) {
      filteredActivities = filteredActivities.filter(activity => 
        new Date(activity.createdAt) >= new Date(filter.dateFrom!)
      );
    }
    
    if (filter?.dateTo) {
      filteredActivities = filteredActivities.filter(activity => 
        new Date(activity.createdAt) <= new Date(filter.dateTo!)
      );
    }
    
    if (filter?.authorId) {
      filteredActivities = filteredActivities.filter(activity => activity.authorId === filter.authorId);
    }

    return {
      activities: filteredActivities,
      totalCount: filteredActivities.length,
      hasMore: filteredActivities.length === limit
    };
  }

  async filterActivities(filter: ActivityFilter): Promise<Activity[]> {
    const timeline = await this.getActivities(filter);
    return timeline.activities;
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    const mutation = `
      mutation CreateComment($data: CommentCreateInput!) {
        createComment(data: $data) {
          id
          body
          authorId
          author {
            id
            name {
              firstName
              lastName
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const commentData = {
      body: input.body,
      ...(input.authorId && { authorId: input.authorId }),
      ...(input.activityTargetId && { activityTargetId: input.activityTargetId })
    };

    const result = await this.client.request(mutation, { data: commentData }) as { createComment: Comment };
    return result.createComment;
  }

  async getEntityActivities(input: EntityActivitiesInput): Promise<ActivityTimeline> {
    // For now, we'll get general activities and filter client-side
    // In a real implementation, you'd want to use the entity relationships in the GraphQL query
    const activities = await this.getActivities({
      limit: input.limit,
      offset: input.offset
    });

    // Note: This is a simplified implementation. In practice, you'd want to query
    // activities that are specifically related to the entity through proper GraphQL relationships
    return activities;
  }

  async listAllObjects(options: MetadataQueryOptions = {}): Promise<ObjectSummary> {
    const query = `
      query GetObjectMetadata {
        objects {
          edges {
            node {
              id
              nameSingular
              namePlural
              labelSingular
              labelPlural
              description
              icon
              isCustom
              isActive
              isSystem
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const result = await this.client.request(query) as { objects: { edges: { node: ObjectMetadata }[] } };
    const allObjects = result.objects.edges.map(edge => edge.node);

    // Filter based on options
    let filteredObjects = allObjects;
    
    if (options.activeOnly !== false) {
      filteredObjects = filteredObjects.filter(obj => obj.isActive);
    }
    
    if (options.includeCustom === false) {
      filteredObjects = filteredObjects.filter(obj => !obj.isCustom);
    }
    
    if (options.includeSystem === false) {
      filteredObjects = filteredObjects.filter(obj => !obj.isSystem);
    }

    // Group objects by type
    const standard = filteredObjects.filter(obj => !obj.isCustom && !obj.isSystem);
    const custom = filteredObjects.filter(obj => obj.isCustom);
    const system = filteredObjects.filter(obj => obj.isSystem);

    return {
      standard,
      custom,
      system,
      totalCount: filteredObjects.length,
      standardCount: standard.length,
      customCount: custom.length,
      systemCount: system.length
    };
  }

  async getObjectSchema(objectNameOrId: string): Promise<ObjectSchema> {
    const objectQuery = `
      query GetObjectSchema($filter: ObjectFilterInput!) {
        objects(filter: $filter) {
          edges {
            node {
              id
              nameSingular
              namePlural
              labelSingular
              labelPlural
              description
              icon
              isCustom
              isActive
              isSystem
              createdAt
              updatedAt
              fields {
                edges {
                  node {
                    id
                    name
                    label
                    description
                    type
                    isCustom
                    isActive
                    isNullable
                    isSystem
                    defaultValue
                    createdAt
                    updatedAt
                  }
                }
              }
            }
          }
        }
      }
    `;

    // Try to find object by name first, then by ID
    let filter;
    if (objectNameOrId.match(/^[0-9a-fA-F-]{36}$/)) {
      // Looks like a UUID
      filter = { id: { eq: objectNameOrId } };
    } else {
      // Assume it's a name
      filter = { 
        or: [
          { nameSingular: { eq: objectNameOrId } },
          { namePlural: { eq: objectNameOrId } }
        ]
      };
    }

    const result = await this.client.request(objectQuery, { filter }) as { 
      objects: { 
        edges: { 
          node: ObjectMetadata & { 
            fields: { edges: { node: FieldMetadata }[] } 
          }
        }[] 
      } 
    };

    if (result.objects.edges.length === 0) {
      throw new Error(`Object not found: ${objectNameOrId}`);
    }

    const objectNode = result.objects.edges[0].node;
    const fields = objectNode.fields.edges.map(edge => edge.node);

    return {
      object: {
        id: objectNode.id,
        nameSingular: objectNode.nameSingular,
        namePlural: objectNode.namePlural,
        labelSingular: objectNode.labelSingular,
        labelPlural: objectNode.labelPlural,
        description: objectNode.description,
        icon: objectNode.icon,
        isCustom: objectNode.isCustom,
        isActive: objectNode.isActive,
        isSystem: objectNode.isSystem,
        createdAt: objectNode.createdAt,
        updatedAt: objectNode.updatedAt,
        fields
      },
      fields,
      relationships: [] // TODO: Implement relationship discovery
    };
  }

  async getFieldMetadata(options: FieldQueryOptions = {}): Promise<FieldMetadata[]> {
    let query: string;
    let variables: any = {};

    if (options.objectId || options.objectName) {
      // Get fields for a specific object
      query = `
        query GetFieldsForObject($filter: ObjectFilterInput!) {
          objects(filter: $filter) {
            edges {
              node {
                fields {
                  edges {
                    node {
                      id
                      name
                      label
                      description
                      type
                      isCustom
                      isActive
                      isNullable
                      isSystem
                      defaultValue
                      createdAt
                      updatedAt
                    }
                  }
                }
              }
            }
          }
        }
      `;

      if (options.objectId) {
        variables.filter = { id: { eq: options.objectId } };
      } else {
        variables.filter = { 
          or: [
            { nameSingular: { eq: options.objectName } },
            { namePlural: { eq: options.objectName } }
          ]
        };
      }
    } else {
      // Get all fields across all objects
      query = `
        query GetAllFields {
          fields {
            edges {
              node {
                id
                name
                label
                description
                type
                isCustom
                isActive
                isNullable
                isSystem
                defaultValue
                createdAt
                updatedAt
              }
            }
          }
        }
      `;
    }

    const result = await this.client.request(query, variables) as any;
    
    let fields: FieldMetadata[];
    
    if (options.objectId || options.objectName) {
      if (result.objects.edges.length === 0) {
        throw new Error(`Object not found: ${options.objectId || options.objectName}`);
      }
      fields = result.objects.edges[0].node.fields.edges.map((edge: any) => edge.node);
    } else {
      fields = result.fields.edges.map((edge: any) => edge.node);
    }

    // Apply filters
    let filteredFields = fields;
    
    if (options.activeOnly !== false) {
      filteredFields = filteredFields.filter(field => field.isActive);
    }
    
    if (options.includeCustom === false) {
      filteredFields = filteredFields.filter(field => !field.isCustom);
    }
    
    if (options.includeSystem === false) {
      filteredFields = filteredFields.filter(field => !field.isSystem);
    }
    
    if (options.fieldType) {
      filteredFields = filteredFields.filter(field => field.type === options.fieldType);
    }

    return filteredFields;
  }

  // Relationship Management Methods

  async getCompanyContacts(companyId: string): Promise<CompanyContactsResult> {
    const query = `
      query GetCompanyContacts($companyId: String!) {
        company(filter: { id: { eq: $companyId } }) {
          id
          name
        }
        people(filter: { companyId: { eq: $companyId } }, first: 100) {
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
              }
              jobTitle
              createdAt
            }
          }
        }
      }
    `;

    const result = await this.client.request(query, { companyId }) as any;
    
    const contacts = result.people.edges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      email: edge.node.emails?.primaryEmail,
      phone: edge.node.phones?.primaryPhoneNumber,
      jobTitle: edge.node.jobTitle,
      createdAt: edge.node.createdAt
    }));

    return {
      companyId,
      companyName: result.company?.name || 'Unknown Company',
      contacts,
      totalContacts: contacts.length
    };
  }

  async getPersonOpportunities(personId: string): Promise<PersonOpportunitiesResult> {
    const query = `
      query GetPersonOpportunities($personId: String!) {
        person(filter: { id: { eq: $personId } }) {
          id
          name {
            firstName
            lastName
          }
        }
        opportunities(filter: { pointOfContactId: { eq: $personId } }, first: 100) {
          edges {
            node {
              id
              name
              amount {
                amountMicros
                currencyCode
              }
              stage
              closeDate
              companyId
              company {
                id
                name
              }
              createdAt
            }
          }
        }
      }
    `;

    const result = await this.client.request(query, { personId }) as any;
    
    const opportunities = result.opportunities.edges.map((edge: any) => edge.node);
    const person = result.person;

    return {
      personId,
      personName: person ? `${person.name.firstName} ${person.name.lastName}` : 'Unknown Person',
      opportunities,
      totalOpportunities: opportunities.length
    };
  }

  async linkOpportunityToCompany(input: LinkOpportunityInput): Promise<any> {
    const mutation = `
      mutation LinkOpportunity($id: String!, $data: OpportunityUpdateInput!) {
        updateOpportunity(id: $id, data: $data) {
          id
          name
          companyId
          pointOfContactId
          company {
            id
            name
          }
          pointOfContact {
            id
            name {
              firstName
              lastName
            }
          }
        }
      }
    `;

    const updateData: any = {};
    if (input.companyId) updateData.companyId = input.companyId;
    if (input.pointOfContactId) updateData.pointOfContactId = input.pointOfContactId;

    const result = await this.client.request(mutation, {
      id: input.opportunityId,
      data: updateData
    }) as { updateOpportunity: any };

    return result.updateOpportunity;
  }

  async transferContactToCompany(input: TransferContactInput): Promise<any> {
    const mutation = `
      mutation TransferContact($id: String!, $data: PersonUpdateInput!) {
        updatePerson(id: $id, data: $data) {
          id
          name {
            firstName
            lastName
          }
          companyId
          company {
            id
            name
          }
        }
      }
    `;

    const result = await this.client.request(mutation, {
      id: input.contactId,
      data: { companyId: input.toCompanyId }
    }) as { updatePerson: any };

    return result.updatePerson;
  }

  async getRelationshipSummary(entityId: string, entityType: string): Promise<RelationshipSummary> {
    let counts = {
      companies: 0,
      contacts: 0,
      opportunities: 0,
      tasks: 0,
      activities: 0
    };

    try {
      switch (entityType.toLowerCase()) {
        case 'company':
          // Get contacts for this company
          const companyContacts = await this.getCompanyContacts(entityId);
          counts.contacts = companyContacts.totalContacts;
          
          // Get opportunities for this company
          const companyOpps = await this.searchOpportunities({ companyId: entityId, limit: 1000 });
          counts.opportunities = companyOpps.length;
          break;
          
        case 'person':
          // Get opportunities for this person
          const personOpps = await this.getPersonOpportunities(entityId);
          counts.opportunities = personOpps.totalOpportunities;
          
          // Get tasks assigned to this person (would need a specific query for filtering)
          // For now, we'll skip task counting as it requires a filtered query
          counts.tasks = 0;
          break;
      }
    } catch (error) {
      console.warn('Error calculating relationship summary:', error);
    }

    return {
      entityId,
      entityType,
      relationships: counts
    };
  }

  async findOrphanedRecords(): Promise<OrphanedRecords> {
    const orphaned: OrphanedRecords = {
      companies: [],
      contacts: [],
      opportunities: [],
      tasks: []
    };

    try {
      // Find companies with no contacts
      const companiesQuery = `
        query GetCompaniesWithContacts {
          companies(first: 1000) {
            edges {
              node {
                id
                name
                people {
                  totalCount
                }
                opportunities {
                  totalCount
                }
              }
            }
          }
        }
      `;

      const companiesResult = await this.client.request(companiesQuery) as any;
      orphaned.companies = companiesResult.companies.edges
        .map((edge: any) => edge.node)
        .filter((company: any) => company.people.totalCount === 0)
        .map((company: any) => ({
          id: company.id,
          name: company.name,
          contactCount: 0,
          opportunityCount: company.opportunities.totalCount
        }));

      // Find contacts without companies
      const contactsQuery = `
        query GetContactsWithoutCompanies {
          people(filter: { companyId: { is: "NULL" } }, first: 1000) {
            edges {
              node {
                id
                name {
                  firstName
                  lastName
                }
                companyId
                opportunities {
                  totalCount
                }
              }
            }
          }
        }
      `;

      const contactsResult = await this.client.request(contactsQuery) as any;
      orphaned.contacts = contactsResult.people.edges.map((edge: any) => ({
        id: edge.node.id,
        name: `${edge.node.name.firstName} ${edge.node.name.lastName}`,
        hasCompany: !!edge.node.companyId,
        opportunityCount: edge.node.opportunities.totalCount
      }));

    } catch (error) {
      console.warn('Error finding orphaned records:', error);
    }

    return orphaned;
  }
}