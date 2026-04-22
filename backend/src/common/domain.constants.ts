export const PROVIDER_GITHUB = 'GITHUB' as const;

export const WORK_ITEM_TYPES = ['ISSUE', 'PULL_REQUEST'] as const;
export type WorkItemTypeValue = (typeof WORK_ITEM_TYPES)[number];

export const WORK_ITEM_STATES = ['OPEN', 'CLOSED'] as const;
export type WorkItemStateValue = (typeof WORK_ITEM_STATES)[number];

export const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type PriorityLevelValue = (typeof PRIORITY_LEVELS)[number];
