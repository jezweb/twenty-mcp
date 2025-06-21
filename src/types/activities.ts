export interface Activity {
  id: string;
  type: string;
  title?: string;
  body?: string;
  createdAt: string;
  updatedAt: string;
  authorId?: string;
  author?: {
    id: string;
    name: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface Task extends Activity {
  type: 'task';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueAt?: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface Note extends Activity {
  type: 'note';
  title?: string;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorId?: string;
  author?: {
    id: string;
    name: {
      firstName: string;
      lastName: string;
    };
  };
  activityTargetId?: string;
  activityTarget?: {
    id: string;
    targetObjectId: string;
    targetObjectNameSingular: string;
  };
}

export interface CreateCommentInput {
  body: string;
  authorId?: string;
  activityTargetId?: string;
  targetObjectId?: string;
  targetObjectNameSingular?: string;
}

export interface ActivityFilter {
  type?: string[];
  dateFrom?: string;
  dateTo?: string;
  authorId?: string;
  assigneeId?: string;
  status?: string[];
  limit?: number;
  offset?: number;
}

export interface EntityActivitiesInput {
  entityId: string;
  entityType: 'person' | 'company' | 'opportunity';
  includeComments?: boolean;
  limit?: number;
  offset?: number;
}

export interface ActivityTimeline {
  activities: Activity[];
  totalCount: number;
  hasMore: boolean;
}