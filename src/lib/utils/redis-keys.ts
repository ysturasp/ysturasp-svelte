export function normalizeGroupName(groupName: string): string {
	return groupName.trim().toUpperCase();
}

export function getGroupScheduleKey(groupName: string): string {
	const normalized = normalizeGroupName(groupName);
	return `schedule:${normalized}`;
}

export function getTeacherScheduleKey(teacherId: string): string {
	return `schedule:teacher:${teacherId.trim()}`;
}

export function getAudienceScheduleKey(audienceId: string): string {
	return `schedule:audience:${audienceId.trim()}`;
}

export function getGroupsListKey(): string {
	return 'schedule:groups_list';
}

export function getActualGroupsKey(): string {
	return 'ystu:actual_groups';
}

export function getTeachersListKey(): string {
	return 'schedule:teachers';
}

export function getInstitutesListKey(): string {
	return 'schedule:institutes';
}

export function getAudiencesListKey(): string {
	return 'schedule:audiences';
}

export function getYspuScheduleKey(fileId: string): string {
	return `schedule:yspu:${fileId.trim()}`;
}

export function getYspuTeachersListKey(folderId: string): string {
	return `schedule:yspu:${folderId.trim()}:teachers`;
}

export function getYspuTeacherScheduleKey(folderId: string, teacherId: string): string {
	return `schedule:yspu:${folderId.trim()}:teacher:${teacherId.trim()}`;
}

export function getYspuAudiencesListKey(folderId: string): string {
	return `schedule:yspu:${folderId.trim()}:audiences`;
}

export function getYspuAudienceScheduleKey(folderId: string, audienceId: string): string {
	return `schedule:yspu:${folderId.trim()}:audience:${audienceId.trim()}`;
}

export function getStatisticsDisciplinesKey(institute: string): string {
	return `statistics:disciplines:${institute}`;
}

export function getStatisticsSubjectKey(institute: string, discipline: string): string {
	return `statistics:subject:${institute}:${encodeURIComponent(discipline)}`;
}
