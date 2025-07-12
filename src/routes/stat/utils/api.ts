import type { InstituteId, Stats, Instructors } from '../types';

const STATS_URLS: Record<InstituteId, string> = {
  'btn-digital-systems': 'https://script.google.com/macros/s/AKfycbxdL_UC__SmYJiPHmlsD4-T1ZiglPvgnehXed1OR9Qjk_fJ3rPxrVBT5Z0Zh1CiI7sC/exec',
  'btn-architecture-design': 'https://script.google.com/macros/s/AKfycbyN0A6BDc-w1yUVLkn25J_fW7s3wpdaR6SgL6s3uBeUAfrBsxJb0pYKuWr3M03mkzGWrA/exec',
  'btn-civil-transport': 'https://script.google.com/macros/s/AKfycbzbxLrOI2rA8ZzVfrT6RXIG5ADMl_5NdAQd8NEIYfg-qKkWVe_fGyB5pDolsCOtH14Mxw/exec'
};

const INSTRUCTOR_URLS: Record<InstituteId, string> = {
  'btn-digital-systems': 'https://script.google.com/macros/s/AKfycby2mh-j-haUvit8bfirQ7fOGh-8S_VFJ3c-DvIc25XM0zgjJPcJYVgc_tEeLJ-h9aaj7w/exec',
  'btn-architecture-design': 'https://script.google.com/macros/s/AKfycbxKdSyy9JZAlFfj8KivDJbDsWyOWy1yRzUSI2TYeGBLitVsbpBxbIAaw0sz3STy9mpu/exec',
  'btn-civil-transport': 'https://script.google.com/macros/s/AKfycbzIby7Zm8Jk_LdtCQEPib4aYnvjqv1ucyH3a9aghfwNDu9QyMbCflmolCpd8uK-joPasw/exec'
};

const TOP_ANTITOP_URLS: Record<InstituteId, string> = {
  'btn-digital-systems': 'https://script.google.com/macros/s/AKfycbwGCkkHXW776ydUQZETrk9_zYv_ZYvz7MsPQ0p0AdYNjWe8iTems3pxgdpsT7rP7-bg/exec',
  'btn-architecture-design': 'https://script.google.com/macros/s/AKfycbzC6yVUPqlPRubATCOV5GdcgeaFj8O42DSFuOORCVSm6BMki4tW3tCdrTE65C1PoqeDcQ/exec',
  'btn-civil-transport': 'https://script.google.com/macros/s/AKfycbz_5IGSgCYpiJ8zCx7qkwCTj2IE_IN51TlPwi5HlqYUCpnTcQegAuC3vFACV1dUnFxp/exec'
};

export async function getSubjectStats(institute: InstituteId, discipline: string): Promise<Stats> {
  const url = `${STATS_URLS[institute]}?discipline=${encodeURIComponent(discipline)}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data;
}

export async function getInstructors(institute: InstituteId, subject: string): Promise<Instructors> {
  const url = `${INSTRUCTOR_URLS[institute]}?subject=${encodeURIComponent(subject)}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data;
}

export async function getTopAntiTop(institute: InstituteId) {
  const response = await fetch(TOP_ANTITOP_URLS[institute]);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data;
}

export async function getReferralStats() {
  // TODO: реализовать получение статистики рефералов
  return {
    referralCount: 0,
    statsLimit: 10
  };
}

export async function updateReferralStats() {
  // TODO: реализовать обновление статистики рефералов
}

export function getUserId(): string {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem('userId', userId);
  }
  return userId;
}

function generateUserId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
} 