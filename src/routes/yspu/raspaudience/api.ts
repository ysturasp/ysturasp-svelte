import type { AudienceScheduleData } from '$lib/types/schedule';

export interface Audience {
    id: string;
    number: string;
}

const API_URL = 'https://script.google.com/macros/s/AKfycbxQmhIknsAvgkpP5nQOc8CWgH3KoiP_iWKumPKiitIdNatDmSHUce9erYIYU6hOVLA_/exec';

export async function getAudiences(): Promise<Audience[]> {
    try {
        const response = await fetch(`${API_URL}?action=auditories`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching audiences:', error);
        throw error;
    }
}

export async function getSchedule(audience: string): Promise<AudienceScheduleData> {
    try {
        const response = await fetch(`${API_URL}?action=auditory&id=${encodeURIComponent(audience)}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching audience schedule:', error);
        throw error;
    }
} 