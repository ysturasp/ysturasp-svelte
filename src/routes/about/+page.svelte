<script lang="ts">
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import PageLayout from '$lib/components/layout/PageLayout.svelte';
  import { onMount } from 'svelte';

  interface Post {
    title?: string;
    link?: string;
    date?: string;
    content?: string;
    image?: string;
    reactions?: Record<string, number>;
  }

  let loading = true;
  let posts: Post[] = [];
  let showModal = false;
  let selectedImage = '';
  let modalTransitioning = false;

  async function fetchBoostyPosts() {
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbyDHKXrUCxAiTxXdVcfXUkeBnPPstQdK3K-cDmserZQL4svFoi-oPjWkEDfqcx3bqHd/exec');
      posts = await response.json();
    } catch (error) {
      console.error('Error fetching Boosty posts:', error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchBoostyPosts();
  });

  function handleImageClick(imageUrl: string) {
    selectedImage = imageUrl;
    showModal = true;
  }

  function closeModal() {
    if (modalTransitioning) return;
    modalTransitioning = true;
    setTimeout(() => {
      showModal = false;
      modalTransitioning = false;
    }, 300);
  }

  function handleModalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.id === 'image-modal') {
      closeModal();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && showModal) {
      closeModal();
    }
  }
</script>

<svelte:head>
  <title>О нас - ystuRASP</title>
  <meta name="description" content="Узнайте статистику оценок студентов ЯГТУ, средние баллы и распределение оценок по различным дисциплинам. ysturasp">
  <link rel="icon" href="images/cat.png" type="image/png">
</svelte:head>

<PageLayout>
  <Header />
  <main class="container mx-auto mt-5 md:mt-7 px-3 md:px-0">
    <section id="boosty-news" class="bg-slate-800 rounded-lg p-6 mt-8">
      <h2 class="text-2xl sm:text-left lg:text-left md:text-left text-center font-semibold text-white mb-4">
        😜Наша история (дубляж постов с Boosty)
      </h2>
      <div class="text-center mt-[-11px] mb-8 md:mt-0 md:mb-6">
        <a href="https://boosty.to/ysturasp.me/donate" target="_blank" 
          class="bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition duration-300">
          Поддержать проект
        </a>
      </div>

      {#if loading}
        <div class="wrapper">
          <div class="circle"></div>
          <div class="circle"></div>
          <div class="circle"></div>
          <div class="shadow"></div>
          <div class="shadow"></div>
          <div class="shadow"></div>
          <span>Loading</span>
        </div>
      {:else if posts.length === 0}
        <p class="text-slate-400">Посты пока недоступны.</p>
      {:else}
        {#each posts as post}
          <div class="bg-slate-900 rounded-lg p-6 mb-8 shadow-lg hover:shadow-2xl transition-shadow duration-300">
            {#if post.link}
              <a href={post.link} target="_blank" class="text-2xl text-white font-bold hover:text-blue-400 transition-colors">
                {post.title}
              </a>
            {/if}
            {#if post.date}
              <p class="text-slate-400 text-sm mt-2 mb-4">
                📅 {new Intl.DateTimeFormat('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(new Date(post.date))}
              </p>
            {/if}
            {#if post.content}
              <div class="prose prose-invert max-w-none">
                {@html post.content
                  .replace(/\n{3,}/g, '\n\n')
                  .split('\n\n')
                  .map((paragraph: string) => {
                    const paragraphWithStyledLinks = paragraph.trim().replace(
                      /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
                      '<a href="$1" target="_blank" class="text-yellow-400 hover:text-yellow-300 transition-colors">$2</a>'
                    );
                    return `<p class="text-slate-300 mt-3 leading-relaxed">${paragraphWithStyledLinks}</p>`;
                  })
                  .join('')}
              </div>
            {/if}
            {#if post.image}
              {@const imageUrl = `https://lnk.su/api/image.get?url=${post.image.split('?')[0]}`}
              <div class="flex justify-center mt-5">
                <img
                  src={imageUrl}
                  alt="Post image"
                  style="max-height: 500px"
                  class="rounded-lg max-w-full hover:scale-105 transition-transform duration-300 cursor-pointer"
                  on:click={() => handleImageClick(imageUrl)}
                />
              </div>
            {/if}
            {#if post.reactions}
              <div class="reactions-container">
                {#each Object.entries(post.reactions) as [type, count]}
                  {#if count > 0}
                    <a href={post.link} target="_blank">
                      <div class="reaction-item">
                        <span>
                          {#if type === 'like'}👍
                          {:else if type === 'dislike'}👎
                          {:else if type === 'heart'}❤️
                          {:else if type === 'fire'}🔥
                          {:else if type === 'wonder'}😮
                          {:else if type === 'sad'}😢
                          {:else if type === 'angry'}😠
                          {:else if type === 'laught'}😄
                          {/if}
                        </span>
                        {count}
                      </div>
                    </a>
                  {/if}
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </section>
  </main>
</PageLayout>

{#if showModal}
  <div
    id="image-modal"
    class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center {modalTransitioning ? 'modal-closing' : 'modal-opening'}"
    on:click={handleModalClick}
  >
    <div class="relative">
      <img
        src={selectedImage}
        alt="Enlarged Image"
        class="rounded-lg max-w-[90vw] max-h-[90vh] object-contain"
      />
      <button
        class="absolute top-2 right-2 text-white bg-red-600 rounded-full p-2 w-5 h-5 md:w-10 md:h-10 flex items-center justify-center hover:bg-red-800"
        on:click={closeModal}
      >
        &times;
      </button>
    </div>
  </div>
{/if}

<svelte:window on:keydown={handleKeydown} />

<style>
  .wrapper {
    width: 200px;
    height: 60px;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .circle {
    width: 20px;
    height: 20px;
    position: absolute;
    border-radius: 50%;
    background-color: #fff;
    left: 15%;
    transform-origin: 50%;
    animation: circle 0.5s alternate infinite ease;
  }

  @keyframes circle {
    0% {
      top: 60px;
      height: 5px;
      border-radius: 50px 50px 25px 25px;
      transform: scaleX(1.7);
    }
    40% {
      height: 20px;
      border-radius: 50%;
      transform: scaleX(1);
    }
    100% {
      top: 0%;
    }
  }

  .circle:nth-child(2) {
    left: 45%;
    animation-delay: 0.2s;
  }

  .circle:nth-child(3) {
    left: auto;
    right: 15%;
    animation-delay: 0.3s;
  }

  .shadow {
    width: 20px;
    height: 4px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.5);
    position: absolute;
    top: 62px;
    transform-origin: 50%;
    z-index: -1;
    left: 15%;
    filter: blur(1px);
    animation: shadow 0.5s alternate infinite ease;
  }

  @keyframes shadow {
    0% {
      transform: scaleX(1.5);
    }
    40% {
      transform: scaleX(1);
      opacity: 0.7;
    }
    100% {
      transform: scaleX(0.2);
      opacity: 0.4;
    }
  }

  .shadow:nth-child(4) {
    left: 45%;
    animation-delay: 0.2s;
  }

  .shadow:nth-child(5) {
    left: auto;
    right: 15%;
    animation-delay: 0.3s;
  }

  .wrapper span {
    position: absolute;
    top: 75px;
    font-family: 'Lato';
    font-size: 20px;
    letter-spacing: 12px;
    color: #fff;
    left: 15%;
  }

  .modal-opening {
    animation: modalFadeIn 0.3s ease-out forwards;
  }

  .modal-closing {
    animation: modalFadeOut 0.3s ease-in forwards;
  }

  @keyframes modalFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes modalFadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  .reactions-container {
    display: flex;
    gap: 20px;
    margin-top: 24px;
    flex-wrap: wrap;
  }

  .reaction-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    background: rgba(30, 41, 59, 0.5);
    border-radius: 30px;
    font-size: 20px;
    color: #94a3b8;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .reaction-item:hover {
    transform: scale(1.05);
    background: rgba(30, 41, 59, 0.8);
  }

  .reaction-item span {
    font-size: 24px;
  }
</style> 