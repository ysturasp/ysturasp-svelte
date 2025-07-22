<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { NotificationOptions } from '../types';
  import { getUserId, getReferralStats, updateReferralStats } from '../utils/api';

  const dispatch = createEventDispatcher<{
    close: void;
    showNotification: NotificationOptions;
  }>();

  let referralCount = 0;
  let statsLimit = 10;
  let referralLink = '';

  async function updateStats() {
    const stats = await getReferralStats();
    referralCount = stats.referralCount;
    statsLimit = stats.statsLimit;
  }

  function copyReferralLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          dispatch('showNotification', {
            message: 'Ссылка скопирована!',
            type: 'success'
          });
        })
        .catch(() => {
          fallbackCopy();
        });
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    const referralLinkElement = document.getElementById('referralLink') as HTMLInputElement;
    referralLinkElement.select();
    try {
      document.execCommand('copy');
      dispatch('showNotification', {
        message: 'Ссылка скопирована!',
        type: 'success'
      });
    } catch (err) {
      dispatch('showNotification', {
        message: 'Не удалось скопировать ссылку',
        type: 'error'
      });
    }
  }

  onMount(() => {
    const userId = getUserId();
    referralLink = `${window.location.origin}${window.location.pathname}?ref=${userId}`;
    updateStats();
  });
</script>

<div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-[1001]">
  <div class="flex md:items-center md:justify-center h-full md:min-h-screen md:p-4" style="background-color: #0b0f15ad;">
    <div class="w-full h-full md:h-auto md:max-w-2xl bg-slate-800 md:rounded-2xl shadow-xl flex flex-col ring-1 ring-blue-500/50">
      <div class="flex justify-between items-center p-4">
        <h3 class="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <img src="https://ysturasp.github.io/tg_emoji/Animals and Nature/Glowing Star.webp" alt="Star-Struck" class="w-8 h-8"/>
          <span>Получите больше возможностей!</span>
        </h3>
        <button 
          class="text-slate-400 hover:text-white p-2"
          on:click={() => dispatch('close')}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="flex-1 p-4 -mt-4 space-y-2 overflow-y-auto">
        <div class="text-slate-300">
          <p class="text-lg mb-4">Разблокируйте дополнительные возможности, приглашая других студентов!</p>
          
          <div class="space-y-1 mb-4">
            <h4 class="text-white font-semibold">Что вы получаете:</h4>
            <ul class="list-disc list-inside space-y-3 ml-2">
              <li class="flex items-center">
                <span class="text-2xl mr-2">📊</span>
                <span>Больше просмотров статистики оценок</span>
              </li>
              <li class="flex items-center">
                <span class="text-2xl mr-2">🎯</span>
                <span>Расширенная аналитика успеваемости</span>
              </li>
            </ul>
          </div>

          <div class="bg-slate-700 p-4 md:p-0 rounded-2xl">
            <div class="flex flex-col items-center justify-center">
              <div class="w-full p-0 md:p-4">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-white font-semibold mb-2">Ваша реферальная ссылка:</h4>
                  <button 
                    class="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                    on:click={copyReferralLink}
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                    </svg>
                    Копировать
                  </button>
                </div>
                <div class="relative">
                  <input 
                    type="text" 
                    id="referralLink" 
                    readonly 
                    class="w-full bg-transparent text-white font-mono"
                    value={referralLink}
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-1 mb-4">
            <h4 class="text-white font-semibold">Как это работает:</h4>
            <ol class="list-decimal list-inside space-y-1 ml-2">
              <li>Поделитесь своей уникальной ссылкой с другими студентами</li>
              <li>Когда они перейдут по ссылке и начнут пользоваться сервисом, вы получите бонусы</li>
              <li>За каждого приглашенного студента +10 просмотров статистики в день</li>
            </ol>
          </div>

          <div class="bg-slate-700 p-4 rounded-2xl">
            <h4 class="text-white font-semibold mb-2">Ваша статистика:</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold">{referralCount}</div>
                <div class="text-sm">Приглашено</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold">{statsLimit}</div>
                <div class="text-sm">Лимит просмотров/день</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-slate-700 md:rounded-b-lg mt-auto">
        <button 
          class="w-full bg-blue-600 text-white rounded-2xl px-4 py-3 hover:bg-blue-700 transition-all"
          on:click={() => dispatch('close')}
        >
          Понятно!
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  input[readonly] {
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  }
</style> 