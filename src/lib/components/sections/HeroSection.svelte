<script>
    const features = [
        {
            href: "/rasp",
            icon: "https://ysturasp.github.io/tg_emoji/People/Man Technologist.webp",
            title: "Расписание студентов",
            description: "Узнайте расписание своей группы",
            gradient: "from-blue-500/10 to-blue-600/20",
            border: "border-blue-500",
            hover: "hover:border-blue-400/40 hover:shadow-blue-500",
            glowFrom: "from-blue-600",
            glowTo: "to-blue-700"
        },
        {
            href: "/raspprep",
            icon: "https://ysturasp.github.io/tg_emoji/People/Man Teacher.webp",
            title: "Расписание преподавателей",
            description: "Расписание для преподавателей",
            gradient: "from-purple-500/10 to-purple-600/20",
            border: "border-purple-500",
            hover: "hover:border-purple-400/40 hover:shadow-purple-500",
            glowFrom: "from-purple-600",
            glowTo: "to-purple-700"
        },
        {
            href: "/raspaudience",
            icon: "https://ysturasp.github.io/tg_emoji/Travel and Places/Classical Building.webp",
            title: "Расписание аудиторий",
            description: "Найдите свободную аудиторию",
            gradient: "from-green-500/10 to-green-600/20",
            border: "border-green-500",
            hover: "hover:border-green-400/40 hover:shadow-green-500",
            glowFrom: "from-green-600",
            glowTo: "to-green-700"
        },
        {
            href: "/stat",
            icon: "https://ysturasp.github.io/tg_emoji/Objects/Bar Chart.webp",
            title: "Статистика оценок",
            description: "Анализ успеваемости",
            gradient: "from-yellow-500/10 to-yellow-600/20",
            border: "border-yellow-500",
            hover: "hover:border-yellow-400/40 hover:shadow-yellow-500",
            glowFrom: "from-yellow-600",
            glowTo: "to-yellow-700"
        }
    ];
</script>

<section class="hero-gradient rounded-2xl p-2 md:p-8 text-center py-4 md:py-16 mb-16 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse"></div>
    <h1 class="hero-title text-3xl md:text-5xl font-bold pb-2 md:pb-6">Добро пожаловать в ystuRASP</h1>
    <p class="text-md md:text-xl text-slate-300 mb-2 md:mb-6 max-w-2xl mx-auto">Ваш универсальный помощник для учебы в ЯГТУ</p>
    
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {#each features as feature}
            <a href={feature.href}
                class="hero-card group relative overflow-hidden rounded-xl  bg-gradient-to-br {feature.gradient} border {feature.border} p-4 backdrop-blur-sm transition-all {feature.hover}">
                <div class="absolute inset-0 bg-gradient-to-br {feature.glowFrom} {feature.glowTo} opacity-0 transition-opacity group-hover:opacity-10">
                </div>
                <div class="relative z-10">
                    <img src={feature.icon} alt={feature.title} class="mx-auto mb-2" />
                    <h3 class="mb-2 text-base lg:text-lg font-semibold text-white">{feature.title}</h3>
                    <p class="text-xs lg:text-sm text-slate-300">{feature.description}</p>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r {feature.glowFrom} {feature.glowTo} transform scale-x-0 transition-transform origin-left group-hover:scale-x-100">
                </div>
            </a>
        {/each}
    </div>
</section> 