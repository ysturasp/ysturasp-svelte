<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Notification from '$lib/components/Notification.svelte';
  import SettingsCard from '$lib/components/SettingsCard.svelte';
  import SettingsFilters from '$lib/components/SettingsFilters.svelte';
  import EditSettingsModal from '$lib/components/EditSettingsModal.svelte';
  import type { Setting, FilterOptions, NotificationType, Notification as NotificationState } from '$lib/types';
  import { validateSettingsName } from '$lib/utils/validation';
  import { generateToken } from '$lib/utils/token';
  import { collectHiddenSubjects, collectSubgroupSettings } from '$lib/utils/storage';
  import { downloadCache, importCache, getCacheItems, clearSelectedCache, type CacheItem } from '$lib/utils/cache';
  import DeleteDataModal from '$lib/components/DeleteDataModal.svelte';
  import ApplySettingsModal from '$lib/components/ApplySettingsModal.svelte';

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_96MwIj8oq9qdVcjFz6lRL9XM3EAV_XV8I25ZykDh4FEWqaum6ev_GmDjort26MkbsQ/exec';

  let settings: Setting[] = [];
  let groups: string[] = [];
  let filteredSettings: Setting[] = [];
  let isLoading = true;
  let notification: NotificationState = { show: false, message: '', type: 'info' };

  let showConfirmModal = false;
  let showTokenModal = false;
  let showEditSettingsModal = false;

  let shareHiddenSubjects = false;
  let shareSubgroupSettings = false;
  let settingsName = '';

  let isProcessing = false;

  let showDeleteDataModal = false;
  let cacheItems: CacheItem[] = [];

  let showApplySettingsModal = false;
  let selectedSetting: Setting | null = null;

  onMount(async () => {
    await loadSharedSettings();
    generateRandomName();
  });

  async function loadSharedSettings() {
    try {
      isLoading = true;
      const response = await fetch(`${SCRIPT_URL}?action=get`);
      const data = await response.json() as Setting[];
      settings = data;
      
      const groupSet = new Set<string>(
        data.map((setting: Setting) => {
          const match = setting.name.match(/\((.*?)\)$/);
          return match ? match[1] : '';
        }).filter(Boolean)
      );
      groups = Array.from(groupSet);
      
      filterSettings({
        searchText: '',
        selectedGroup: '',
        selectedType: '',
        verifiedOnly: false
      });
      
      isLoading = false;
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
      showNotification('Ошибка при загрузке настроек', 'error');
      isLoading = false;
    }
  }

  function filterSettings(filters: FilterOptions) {
    filteredSettings = settings.filter(setting => {
      const matchesSearch = setting.name.toLowerCase().includes(filters.searchText.toLowerCase());
      const settingGroup = extractGroupFromName(setting.name);
      const matchesGroup = !filters.selectedGroup || settingGroup === filters.selectedGroup;
      
      const matchesType = !filters.selectedType || 
        (filters.selectedType === 'hidden' && setting.hasHiddenSubjects && !setting.hasSubgroupSettings) ||
        (filters.selectedType === 'subgroups' && !setting.hasHiddenSubjects && setting.hasSubgroupSettings) ||
        (filters.selectedType === 'both' && setting.hasHiddenSubjects && setting.hasSubgroupSettings);

      const matchesVerified = !filters.verifiedOnly || setting.verified;

      return matchesSearch && matchesGroup && matchesType && matchesVerified;
    });
  }

  function extractGroupFromName(name: string): string {
    const match = name.match(/\((.*?)\)$/);
    return match ? match[1] : '';
  }

  function showNotification(message: string, type: NotificationType = 'info') {
    notification = {
      show: true,
      message,
      type
    };
  }

  function generateRandomName() {
    const adjectives = [
      'Cosmic', 'Mystic', 'Silent', 'Hidden', 'Ancient', 'Brave', 'Clever',
      'Dancing', 'Electric', 'Fierce', 'Golden', 'Happy', 'Icy', 'Jolly'
    ];
    
    const nouns = [
      'Phoenix', 'Dragon', 'Spirit', 'Shadow', 'Crystal', 'River', 'Thunder',
      'Forest', 'Mountain', 'Ocean', 'Star', 'Moon', 'Sun', 'Wind'
    ];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    settingsName = `${randomAdjective} ${randomNoun}`;
  }

  async function handleSettingsApply(event: CustomEvent<string>) {
    const settingId = event.detail;
    try {
      showNotification('Загрузка настроек...', 'info');
      
      const response = await fetch(`${SCRIPT_URL}?action=get&id=${settingId}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const text = await response.text();
      const setting = JSON.parse(text);
      selectedSetting = setting;
      showApplySettingsModal = true;
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
      showNotification('Ошибка при загрузке настроек', 'error');
    }
  }

  async function handleApplySettingsConfirm() {
    if (!selectedSetting) return;

    try {
      if (selectedSetting.hiddenSubjects) {
        const hiddenSubjects = JSON.parse(selectedSetting.hiddenSubjects);
        Object.entries(hiddenSubjects).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
      }

      if (selectedSetting.subgroupSettings) {
        const subgroupSettings = JSON.parse(selectedSetting.subgroupSettings);
        if (subgroupSettings.subgroupSettings) {
          localStorage.setItem('subgroupSettings', subgroupSettings.subgroupSettings);
        }
      }

      showNotification('Настройки успешно применены!', 'success');
      showApplySettingsModal = false;
      setTimeout(() => location.reload(), 1500);
    } catch (error) {
      console.error('Ошибка при применении настроек:', error);
      showNotification('Ошибка при применении настроек', 'error');
    }
  }

  function handleFilterChange(event: CustomEvent) {
    filterSettings(event.detail);
  }

  async function handleShareSettings() {
    if (isProcessing) {
      showNotification('Пожалуйста, подождите...', 'warning');
      return;
    }
    isProcessing = true;

    try {
      const name = settingsName.trim();
      
      const validation = validateSettingsName(name);
      if (!validation.isValid) {
        showNotification(validation.reason || 'Некорректное название', 'error');
        return;
      }

      if (!shareHiddenSubjects && !shareSubgroupSettings) {
        showNotification('Пожалуйста, выберите хотя бы один тип настроек для публикации', 'warning');
        return;
      }

      const userGroup = localStorage.getItem('lastGroup') || '';
      const displayName = userGroup ? `${name} (${userGroup})` : name;

      const response = await fetch(`${SCRIPT_URL}?action=get`);
      const existingSettings = await response.json();
      
      const isDuplicate = existingSettings.some((setting: Setting) => 
        setting.name.toLowerCase() === displayName.toLowerCase()
      );

      if (isDuplicate) {
        throw new Error('Настройки с таким названием уже существуют. Пожалуйста, выберите другое название.');
      }

      const humanToken = await generateToken();

      const settings = {
        name: displayName,
        date: new Date().toISOString(),
        hiddenSubjects: shareHiddenSubjects ? JSON.stringify(collectHiddenSubjects()) : undefined,
        subgroupSettings: shareSubgroupSettings ? JSON.stringify(collectSubgroupSettings()) : undefined,
        token: humanToken
      };

      Object.keys(settings).forEach(key => {
        if (settings[key as keyof typeof settings] === undefined) {
          delete settings[key as keyof typeof settings];
        }
      });

      showNotification('Публикация настроек...', 'info');
      
      const shareResponse = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'share',
          settings: settings
        })
      });

      if (!shareResponse.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await shareResponse.json();
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.success) {
        throw new Error('Неизвестная ошибка при публикации настроек');
      }

      showTokenDialog(humanToken);
      showNotification('Настройки успешно опубликованы!', 'success');
      setTimeout(() => loadSharedSettings(), 1500);

    } catch (error) {
      console.error('Ошибка при публикации настроек:', error);
      showNotification(error instanceof Error ? error.message : 'Ошибка при публикации настроек', 'error');
    } finally {
      setTimeout(() => {
        isProcessing = false;
      }, 2000);
    }
  }

  function showTokenDialog(token: string) {
    showTokenModal = true;
    tokenValue = token;
  }

  let tokenValue = '';

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Токен скопирован в буфер обмена', 'success');
    } catch {
      showNotification('Не удалось скопировать токен', 'error');
    }
  }

  async function handleEditSettings(event: CustomEvent<string>) {
    const token = event.detail;
    showEditSettingsModal = false;

    try {
      showNotification('Проверка токена...', 'info');

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'edit',
          token: token
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.success) {
        throw new Error('Неверный токен');
      }

      showNotification('Настройки успешно обновлены', 'success');
      setTimeout(() => loadSharedSettings(), 1500);
    } catch (error) {
      console.error('Ошибка при редактировании настроек:', error);
      showNotification(error instanceof Error ? error.message : 'Ошибка при редактировании настроек', 'error');
    }
  }

  async function handleDeleteSettings(event: CustomEvent<string>) {
    const token = event.detail;
    showEditSettingsModal = false;

    try {
      showNotification('Проверка токена...', 'info');

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'delete',
          token: token
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.success) {
        throw new Error('Неверный токен');
      }

      showNotification('Настройки успешно удалены', 'success');
      setTimeout(() => loadSharedSettings(), 1500);
    } catch (error) {
      console.error('Ошибка при удалении настроек:', error);
      showNotification(error instanceof Error ? error.message : 'Ошибка при удалении настроек', 'error');
    }
  }

  function handleEditSettingsError(event: CustomEvent<string>) {
    showNotification(event.detail, 'error');
  }

  function handleDownload() {
    if (downloadCache()) {
      showNotification('Данные успешно скачаны', 'success');
    } else {
      showNotification('Ошибка при скачивании данных', 'error');
    }
  }

  async function handleImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      await importCache(file);
      showNotification('Данные успешно импортированы', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch (error) {
      console.error('Ошибка при импорте:', error);
      showNotification('Ошибка при импорте данных', 'error');
    }
    input.value = '';
  }

  function handleDeleteDataClick() {
    cacheItems = getCacheItems();
    showDeleteDataModal = true;
  }

  function handleDeleteData(event: CustomEvent<CacheItem[]>) {
    const items = event.detail;
    clearSelectedCache(items);
    showDeleteDataModal = false;
    showNotification('Выбранные данные успешно удалены', 'success');
    setTimeout(() => location.reload(), 1500);
  }
</script>

<svelte:head>
  <title>Экспорт и импорт данных | ystuRASP</title>
  <meta name="description" content="Экспорт и импорт кэша">
</svelte:head>

<PageLayout>
  <Header />
  
  <main class="container mx-auto px-3">
    <section>
      <h2 class="text-4xl font-semibold text-white mt-16 mb-4">🔐 Ваши данные принадлежат только Вам!</h2>
      
      <section class="bg-slate-800 rounded-lg p-6 mt-8">
        <h2 class="md:text-3xl text-xl font-semibold text-white mb-4">Экспорт и импорт Ваших данных</h2>
        <div class="flex flex-col md:flex-row gap-4">
          <button
            class="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
            on:click={handleDownload}
          >
            Скачать мои данные (JSON)
          </button>
          <input
            type="file"
            id="importFile"
            class="hidden"
            accept=".json"
            on:change={handleImport}
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
          >
          <button
            class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            on:click={() => document.getElementById('importFile')?.click()}
          >
            Импортировать данные
          </button>
          <button
            class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            on:click={handleDeleteDataClick}
          >
            Удалить данные
          </button>
        </div>
      </section>

      <section class="bg-slate-800 rounded-lg p-6 mt-8">
        <h2 class="md:text-3xl text-xl font-semibold text-white mb-4">Поделиться настройками</h2>
        <div class="flex flex-col gap-4">
          <div class="bg-slate-900 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-white mb-2">Мои настройки</h3>
            <div class="flex flex-wrap gap-4 mb-4">
              <div class="flex items-center">
                <label class="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={shareHiddenSubjects}
                    class="hidden peer"
                  >
                  <div class="w-5 h-5 border-2 border-slate-500 rounded flex items-center justify-center mr-2 transition-colors peer-checked:border-blue-500">
                    <svg
                      class="w-3 h-3 text-blue-500 {shareHiddenSubjects ? '' : 'hidden'}"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <span class="text-slate-400">Скрытые предметы</span>
                </label>
              </div>
              
              <div class="flex items-center">
                <label class="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={shareSubgroupSettings}
                    class="hidden peer"
                  >
                  <div class="w-5 h-5 border-2 border-slate-500 rounded flex items-center justify-center mr-2 transition-colors peer-checked:border-blue-500">
                    <svg
                      class="w-3 h-3 text-blue-500 {shareSubgroupSettings ? '' : 'hidden'}"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <span class="text-slate-400">Настройки подгрупп</span>
                </label>
              </div>
            </div>
            
            <div class="flex flex-col md:flex-row gap-4">
              <div class="flex gap-2 flex-1">
                <input
                  type="text"
                  bind:value={settingsName}
                  placeholder="Название настроек"
                  class="p-2 bg-slate-800 text-white rounded-lg focus:outline-none border border-blue-500 flex-1 transition-colors"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                >
                <button
                  on:click={generateRandomName}
                  class="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all"
                >
                  🎲
                </button>
              </div>
              <button
                class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all {isProcessing ? 'opacity-50 cursor-not-allowed' : ''}"
                on:click={handleShareSettings}
                disabled={isProcessing}
              >
                Поделиться настройками
              </button>
            </div>
          </div>

          <SettingsFilters {groups} on:filter={handleFilterChange} />

          <div class="bg-slate-900 p-4 rounded-lg">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-white">Доступные настройки</h3>
              <button
                class="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all"
                on:click={() => showEditSettingsModal = true}
              >
                Редактировать/Удалить настройки
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#if isLoading}
                <div class="col-span-full flex justify-center items-center p-8">
                  <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                </div>
              {:else if filteredSettings.length === 0}
                <div class="bg-slate-800 p-4 rounded-lg col-span-full">
                  <p class="text-slate-400 text-center">Настройки не найдены</p>
                </div>
              {:else}
                {#each filteredSettings as setting (setting.id)}
                  <SettingsCard {setting} on:apply={handleSettingsApply} />
                {/each}
              {/if}
            </div>
          </div>
        </div>
      </section>

      <h2 class="text-2xl font-semibold text-white mt-4">Зачем это нужно:</h2>
      <div class="flex flex-wrap justify-center gap-6 p-0 mt-4">
        <div class="card bg-slate-800 p-6 rounded-lg text-center max-w-md w-full">
          <div class="h-27 w-54 mx-auto mb-4 rounded-full">
            <p class="transportation" style="font-size: 100px;">📱👉 🖥️</p>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">При переносе на другое устройство</h3>
          <p class="text-slate-400 mb-4">
            Перенесите заметки, скрытые предметы и другую информацию, сохраните данные на старом и импортируйте их на новом
          </p>
          <div class="flex flex-wrap justify-center gap-2 mb-4">
            <span class="bg-gray-700 text-xs text-white py-1 px-2 rounded">Информация</span>
            <span class="bg-gray-700 text-xs text-white py-1 px-2 rounded">New</span>
          </div>
        </div>

        <div class="card bg-slate-800 p-6 rounded-lg text-center max-w-md w-full">
          <div class="h-27 w-54 mx-auto mb-4 rounded-full">
            <p class="transportation" style="font-size: 100px;">🗑️</p>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">При очистке истории браузера</h3>
          <p class="text-slate-400 mb-4">
            Очистка браузера неизбежно приведет к потере данных скрытых предметов и заметок, сделайте резервную копию Ваших данных перед очисткой
          </p>
          <div class="flex flex-wrap justify-center gap-2 mb-4">
            <span class="bg-gray-700 text-xs text-white py-1 px-2 rounded">Информация</span>
            <span class="bg-gray-700 text-xs text-white py-1 px-2 rounded">New</span>
          </div>
        </div>

        <div class="card bg-slate-800 p-6 rounded-lg text-center max-w-md w-full">
          <div class="h-27 w-54 mx-auto mb-4 rounded-full">
            <p class="transportation" style="font-size: 100px;">🥴</p>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">При проблемах на сайте</h3>
          <p class="text-slate-400 mb-4">
            Если сайт работает некорректно или запрашиваемая информация неактуальна попробуйте очистить данные, это удалит все ваши пользовательские данные
          </p>
          <div class="flex flex-wrap justify-center gap-2 mb-4">
            <span class="bg-gray-700 text-xs text-white py-1 px-2 rounded">Информация</span>
            <span class="bg-gray-700 text-xs text-white py-1 px-2 rounded">New</span>
          </div>
        </div>
      </div>
    </section>
  </main>

  <Footer />
</PageLayout>

<Modal
  title="Удаление данных"
  isOpen={showConfirmModal}
  on:close={() => showConfirmModal = false}
>
  <div class="text-slate-400 mb-4">Выберите данные для удаления:</div>
  <div class="flex justify-center gap-4">
    <button
      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
      on:click={() => showNotification('Функция в разработке', 'info')}
    >
      Удалить
    </button>
    <button
      class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
      on:click={() => showConfirmModal = false}
    >
      Отмена
    </button>
  </div>
</Modal>

<Modal
  title="⚠️ Важное сообщение"
  isOpen={showTokenModal}
  on:close={() => showTokenModal = false}
>
  <p class="text-slate-300 mb-4">
    Это ваш уникальный токен для управления настройками. Сохраните его - он будет показан только один раз!
  </p>
  <div class="bg-slate-900 p-3 rounded-lg mb-4 break-all">
    <p class="text-blue-400 font-mono text-sm">{tokenValue}</p>
  </div>
  <div class="flex gap-2 mb-4">
    <button
      on:click={() => copyToClipboard(tokenValue)}
      class="flex-1 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
    >
      Копировать токен
    </button>
  </div>
  <p class="text-slate-400 text-sm">
    С помощью этого токена вы сможете управлять или удалить свои настройки в будущем.
  </p>
</Modal>

<EditSettingsModal
  isOpen={showEditSettingsModal}
  on:close={() => showEditSettingsModal = false}
  on:edit={handleEditSettings}
  on:delete={handleDeleteSettings}
  on:error={handleEditSettingsError}
/>

<DeleteDataModal
  isOpen={showDeleteDataModal}
  items={cacheItems}
  on:close={() => showDeleteDataModal = false}
  on:delete={handleDeleteData}
/>

<ApplySettingsModal
  isOpen={showApplySettingsModal}
  setting={selectedSetting}
  on:close={() => showApplySettingsModal = false}
  on:confirm={handleApplySettingsConfirm}
/>

{#if notification.show}
  <Notification
    message={notification.message}
    type={notification.type}
    on:hide={() => notification.show = false}
  />
{/if}

<style>
  @media (max-width: 435px) {
    .transportation {
      font-size: 70px;
    }
  }
</style> 