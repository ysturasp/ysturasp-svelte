export type Setting = {
  id: string;
  name: string;
  date: string;
  hasHiddenSubjects: boolean;
  hasSubgroupSettings: boolean;
  verified: boolean;
  hiddenSubjects?: string;
  subgroupSettings?: string;
  token?: string;
};

export type FilterOptions = {
  searchText: string;
  selectedGroup: string;
  selectedType: string;
  verifiedOnly: boolean;
};

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export type Notification = {
  show: boolean;
  message: string;
  type: NotificationType;
}; 