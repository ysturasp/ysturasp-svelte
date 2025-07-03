export function collectHiddenSubjects(): Record<string, any> {
    const hiddenSubjects: Record<string, any> = {};
    const lastGroup = localStorage.getItem('lastGroup');
    
    if (!lastGroup) return hiddenSubjects;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`hiddenSubjects_${lastGroup}`)) {
            try {
                hiddenSubjects[key] = JSON.parse(localStorage.getItem(key) || '{}');
            } catch (e) {
                console.error('Ошибка при парсинге скрытых предметов:', e);
            }
        }
    }
    return hiddenSubjects;
}

export function collectSubgroupSettings(): { subgroupSettings: string | null } {
    return {
        subgroupSettings: localStorage.getItem('subgroupSettings')
    };
} 