<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getDatabase, ref, onValue, set, remove, serverTimestamp, get, type Database } from 'firebase/database';
  import { browser } from '$app/environment';
  import { database as defaultDatabase } from '$lib/config/firebase';

  export let variant: 'desktop' | 'mobile' = 'desktop';
  
  let count = 1;
  let groupStats: Record<string, number> = {};
  let userId: string = browser ? sessionStorage.getItem('onlineUserId') || Math.random().toString(36).substr(2, 9) : '';
  let database: Database = defaultDatabase;
  let unsubscribeConnected: (() => void) | null = null;
  let unsubscribeOnline: (() => void) | null = null;
  let initialized = false;

  if (browser && !sessionStorage.getItem('onlineUserId')) {
    sessionStorage.setItem('onlineUserId', userId);
  }

  const waitForElements = async () => {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      const instituteSelect = document.getElementById('institute-select') as HTMLSelectElement;
      const groupSelect = document.getElementById('group-select') as HTMLSelectElement;
      
      if (instituteSelect && groupSelect && 
          instituteSelect.options.length > 0 && 
          groupSelect.options.length > 0 &&
          groupSelect.selectedIndex > 0) {
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    return false;
  };

  const getGroupFromSelect = () => {
    if (!browser) return 'Гость';
    
    const instituteSelect = document.getElementById('institute-select') as HTMLSelectElement;
    const groupSelect = document.getElementById('group-select') as HTMLSelectElement;
    
    if (!instituteSelect || !groupSelect) return 'Гость';

    const selectedInstitute = instituteSelect?.options[instituteSelect?.selectedIndex]?.text || '';
    const selectedGroup = groupSelect?.options[groupSelect?.selectedIndex]?.text || '';
    
    const defaultValues = [
      'Выберите направление',
      'Выберите профиль',
      'Выберите группу',
      'Сначала выберите профиль'
    ];
    
    if (!selectedInstitute || 
        !selectedGroup || 
        defaultValues.includes(selectedInstitute) || 
        defaultValues.includes(selectedGroup)) {
      return 'Гость';
    }

    return `ЯГПУ ${selectedInstitute} - ${selectedGroup}`;
  };

  const updateUserStatus = async (online: boolean, forceUpdate = false) => {
    if (!browser || !database || !userId) return;
    
    const userStatusRef = ref(database, '/online/' + userId);

    if (online) {
      try {
        const snapshot = await get(userStatusRef);
        if (!snapshot.exists() || forceUpdate) {
          const group = getGroupFromSelect();
          await set(userStatusRef, {
            online: true,
            group,
            timestamp: serverTimestamp()
          });
          
          if (!initialized) {
            window.addEventListener('beforeunload', () => {
              const cleanupRef = ref(database, '/online/' + userId);
              remove(cleanupRef).catch(console.error);
            });
            initialized = true;
          }
        }
      } catch (error) {
        console.error('Ошибка установки статуса:', error);
      }
    } else {
      try {
        await remove(userStatusRef);
      } catch (error) {
        console.error('Ошибка удаления статуса:', error);
      }
    }
  };

  const handleGroupChange = () => {
    if (!browser || !database || !userId) return;
    
    const userStatusRef = ref(database, '/online/' + userId);
    const group = getGroupFromSelect();
    
    set(userStatusRef, {
      online: true,
      group,
      timestamp: serverTimestamp()
    }).catch(error => console.error('Ошибка обновления группы:', error));
  };

  onMount(async () => {
    if (!browser) return;

    try {
      const elementsReady = await waitForElements();
      
      const connectedRef = ref(database, '.info/connected');
      unsubscribeConnected = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          updateUserStatus(true, elementsReady);
        }
      });

      const onlineRef = ref(database, '/online');
      unsubscribeOnline = onValue(onlineRef, (snapshot) => {
        const users = snapshot.val() || {};
        count = Object.keys(users).length;

        groupStats = {};
        Object.values(users).forEach((user: any) => {
          if (user.group) {
            groupStats[user.group] = (groupStats[user.group] || 0) + 1;
          }
        });
      });

      const groupSelect = document.getElementById('group-select');
      const instituteSelect = document.getElementById('institute-select');
      
      if (groupSelect) {
        groupSelect.addEventListener('change', handleGroupChange);
      }
      if (instituteSelect) {
        instituteSelect.addEventListener('change', handleGroupChange);
      }

      if (elementsReady) {
        await updateUserStatus(true, true);
      }

    } catch (error) {
      console.error('Ошибка инициализации Firebase:', error);
    }
  });

  onDestroy(() => {
    if (browser) {
      unsubscribeConnected?.();
      unsubscribeOnline?.();
      
      updateUserStatus(false);
      
      const groupSelect = document.getElementById('group-select');
      const instituteSelect = document.getElementById('institute-select');
      
      if (groupSelect) {
        groupSelect.removeEventListener('change', handleGroupChange);
      }
      if (instituteSelect) {
        instituteSelect.removeEventListener('change', handleGroupChange);
      }
    }
  });

  $: groupInfo = `Количество пользователей на сайте прямо сейчас\n${Object.entries(groupStats)
    .map(([group, count]) => `${group}: ${count} чел.`)
    .join('\n')}`;
</script>

<div class="online-users-counter {variant}" data-groups={groupInfo}>
  <div class="online-indicator"></div>
  <span>{count}</span> онлайн
</div>

<style>
  .online-users-counter {
    background: rgba(30, 41, 59, 0.9);
    backdrop-filter: blur(4px);
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid rgba(59, 130, 246, 0.5);
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: help;
    position: relative;
  }

  .online-users-counter:hover::after {
    content: "Количество пользователей на сайте прямо сейчас";
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(30, 41, 59, 0.95);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    white-space: nowrap;
    border: 1px solid rgba(59, 130, 246, 0.5);
    z-index: 50;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .online-users-counter:hover::before {
    content: "";
    position: absolute;
    top: calc(100% + 3px);
    left: 50%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid rgba(59, 130, 246, 0.5);
  }

  .online-users-counter.mobile {
    display: none;
    margin: 8px auto;
    margin-bottom: -8px;
    width: fit-content;
  }

  @media (max-width: 768px) {
    .online-users-counter.desktop {
      display: none;
    }

    .online-users-counter.mobile {
      display: flex;
    }

    .online-users-counter:hover::after {
      bottom: auto;
      top: calc(100% + 8px);
    }

    .online-users-counter:hover::before {
      bottom: auto;
      top: calc(100% + 3px);
      border-top: none;
      border-bottom: 5px solid rgba(59, 130, 246, 0.5);
    }
  }

  .online-indicator {
    width: 6px;
    height: 6px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }

  .online-users-counter[data-groups]::after {
    content: attr(data-groups);
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(30, 41, 59, 0.95);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    white-space: pre;
    text-align: center;
    border: 1px solid rgba(59, 130, 246, 0.5);
    z-index: 50;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    display: none;
  }

  .online-users-counter[data-groups]:hover::after {
    display: block;
  }

  @media (max-width: 768px) {
    .online-users-counter[data-groups]::after {
      bottom: auto;
      top: calc(100% + 8px);
    }
  }
</style> 