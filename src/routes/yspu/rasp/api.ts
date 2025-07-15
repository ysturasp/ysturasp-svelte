import type { Direction, ScheduleData } from '$lib/types/schedule';

const API_URL = 'https://script.google.com/macros/s/AKfycbxQmhIknsAvgkpP5nQOc8CWgH3KoiP_iWKumPKiitIdNatDmSHUce9erYIYU6hOVLA_/exec';

export async function getDirections(): Promise<Direction[]> {
  try {
    const response = await fetch(`${API_URL}?action=directions`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw error;
  }
}

export async function getSchedule(directionId: string): Promise<ScheduleData> {
  try {
    const response = await fetch(`${API_URL}?action=schedule&id=${directionId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
} 