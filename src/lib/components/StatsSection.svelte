<script lang="ts">
  import { onMount } from 'svelte';
  import anime from 'animejs';
  import { inview } from 'svelte-inview';

  type InviewDetail = {
    inView: boolean;
    entry: IntersectionObserverEntry;
  };

  const stats = [
    {
      value: 400,
      label: 'Активных пользователей',
      color: 'blue',
      icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm6 5H6v-.99c.2-.72 3.3-2.01 6-2.01s5.8 1.29 6 2v1z'
    },
    {
      value: 3000,
      label: 'Просмотров расписания',
      color: 'purple',
      icon: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z'
    },
    {
      value: 30000,
      label: 'Оценок в базе',
      color: 'green',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z'
    }
  ];

  let animated = false;

  function handleInview({ detail }: { detail: InviewDetail }) {
    if (detail.inView && !animated) {
      animated = true;
      animateStats();
    }
  }

  function animateStats() {
    const numberElements = document.querySelectorAll('.number');
    numberElements.forEach((el) => {
      const value = (el as HTMLElement).dataset.value;
      anime({
        targets: el,
        innerHTML: [0, value],
        round: 1,
        duration: 2000,
        easing: 'easeInOutExpo',
        delay: 300
      });
    });

    anime({
      targets: '.stat-card',
      translateY: [50, 0],
      opacity: [0, 1],
      duration: 1500,
      delay: anime.stagger(200),
      easing: 'easeOutElastic(1, .5)'
    });

    anime({
      targets: '.stat-circle',
      scale: [0, 1],
      opacity: [0, 1],
      duration: 1000,
      delay: anime.stagger(200),
      easing: 'easeOutElastic(1, .5)'
    });

    initParticles();
  }

  function initParticles() {
    const colors = {
      blue: '#3B82F6',
      purple: '#8B5CF6',
      green: '#10B981'
    };

    Object.entries(colors).forEach(([type, color]) => {
      setInterval(() => {
        const container = document.querySelector(`.${type}-particles`);
        if (!container) return;

        const particle = document.createElement('div');
        particle.className = `particle ${type}-particle`;
        particle.style.cssText = `
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: ${color};
          left: ${Math.random() * 100}%;
          bottom: 0;
          opacity: 0;
        `;
        container.appendChild(particle);

        anime({
          targets: particle,
          translateY: [-anime.random(20, 60), 0],
          translateX: [anime.random(-20, 20), 0],
          opacity: [
            { value: [0, 0.8], duration: 400 },
            { value: 0, duration: 600 }
          ],
          scale: [
            { value: [0, 1], duration: 200 },
            { value: 0, duration: 800 }
          ],
          easing: 'easeOutElastic(1, .6)',
          duration: 2000,
          complete: () => {
            particle.remove();
          }
        });
      }, 200);
    });
  }

  function handleMouseEnter(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    anime({
      targets: card,
      boxShadow: [
        '0 0 0 rgba(59, 130, 246, 0)',
        '0 0 30px rgba(59, 130, 246, 0.3)'
      ],
      scale: 1.02,
      duration: 800,
      easing: 'easeOutElastic(1, .6)'
    });

    anime({
      targets: card.querySelector('.stat-circle'),
      scale: 1.5,
      duration: 500,
      easing: 'easeOutElastic(1, .5)'
    });

    anime({
      targets: card.querySelector('svg'),
      rotate: '10deg',
      duration: 500,
      easing: 'easeOutElastic(1, .5)'
    });
  }

  function handleMouseLeave(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    anime({
      targets: card,
      boxShadow: '0 0 0 rgba(59, 130, 246, 0)',
      scale: 1,
      duration: 800,
      easing: 'easeOutElastic(1, .6)'
    });

    anime({
      targets: card.querySelector('.stat-circle'),
      scale: 1,
      duration: 500,
      easing: 'easeOutElastic(1, .5)'
    });

    anime({
      targets: card.querySelector('svg'),
      rotate: '0deg',
      duration: 500,
      easing: 'easeOutElastic(1, .5)'
    });
  }
</script>

<section
  class="stats-section py-8 relative overflow-hidden"
  use:inview={{ unobserveOnEnter: true }}
  on:inview_change={handleInview}
>
  <div class="absolute inset-0"></div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
    {#each stats as { value, label, color, icon }}
      <div
        class="stat-card bg-slate-800 p-8 rounded-2xl backdrop-blur-sm relative group"
        style="border: 1px solid {color === 'blue' ? '#3B82F6' : color === 'purple' ? '#8B5CF6' : '#10B981'};"
        on:mouseenter={handleMouseEnter}
        on:mouseleave={handleMouseLeave}
        role="button"
        tabindex="0"
      >
        <div class="particles-container absolute bottom-0 left-0 w-full h-16 overflow-hidden">
          <div class="particles-wave flex {color}-particles"></div>
        </div>

        <div
          class="stat-number font-bold text-4xl"
          style="background: linear-gradient(to right, {color === 'blue' ? '#60A5FA' : color === 'purple' ? '#A78BFA' : '#34D399'}, {color === 'blue' ? '#3B82F6' : color === 'purple' ? '#8B5CF6' : '#10B981'}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"
        >
          <span class="number" data-value={value}>0</span>+
        </div>

        <div class="stat-label text-slate-400 mt-2">{label}</div>

        <div
          class="stat-circle absolute -top-2 -right-2 w-4 h-4 rounded-full"
          style="background-color: {color === 'blue' ? '#3B82F6' : color === 'purple' ? '#8B5CF6' : '#10B981'}; z-index: 10;"
        ></div>

        <svg
          class="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20"
          style="color: {color === 'blue' ? 'rgba(59, 130, 246, 0.1)' : color === 'purple' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)'}"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d={icon} />
        </svg>
      </div>
    {/each}
  </div>
</section>

<style>
  .stats-section {
    perspective: 1000px;
  }

  .stat-card {
    transform: translateY(0) scale(1);
    opacity: 1;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .particles-container {
    pointer-events: none;
  }
</style> 