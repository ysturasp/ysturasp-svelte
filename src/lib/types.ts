export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  show: boolean;
  message: string;
  type: NotificationType;
}

export interface FilterOptions {
  searchText: string;
  selectedGroup: string;
  selectedType: string;
  verifiedOnly: boolean;
}

export interface Setting {
  id: string;
  name: string;
  date: string;
  hiddenSubjects?: string;
  subgroupSettings?: string;
  token?: string;
  verified?: boolean;
  hasHiddenSubjects?: boolean;
  hasSubgroupSettings?: boolean;
}

export interface SubjectType {
  type: number;
  teacher: string;
}

export interface HiddenSubjects {
  [key: string]: {
    [subject: string]: SubjectType[];
  };
}

export interface SubgroupSettings {
  subgroupSettings: string;
}

export interface CacheItem {
  key: string;
  value: string;
  selected?: boolean;
} 