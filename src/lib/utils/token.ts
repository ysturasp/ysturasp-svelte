interface EntropyData {
    timeSpent: number;
    mouseMoves: number;
    mousePositions: [number, number][];
    scrolls: number;
    scrollPositions: number[];
    clicks: number;
    clickPositions: [number, number][];
    keystrokes: number;
    eventIntervals: number[];
    userAgent: string;
    screenSize: string;
    timestamp: number;
    random: Uint32Array;
}

export function generateToken(): Promise<string> {
    const events: any[] = [];
    let startTime = Date.now();
    let mouseMoves = 0;
    let mousePositions: [number, number][] = [];
    let scrolls = 0;
    let scrollPositions: number[] = [];
    let clicks = 0;
    let clickPositions: [number, number][] = [];
    let keystrokes = 0;
    let lastEventTime = startTime;
    let eventIntervals: number[] = [];

    function handleMouseMove(e: MouseEvent) {
        mouseMoves++;
        mousePositions.push([e.clientX, e.clientY]);
        const now = Date.now();
        eventIntervals.push(now - lastEventTime);
        lastEventTime = now;
    }

    function handleScroll() {
        scrolls++;
        scrollPositions.push(window.scrollY);
        const now = Date.now();
        eventIntervals.push(now - lastEventTime);
        lastEventTime = now;
    }

    function handleClick(e: MouseEvent) {
        clicks++;
        clickPositions.push([e.clientX, e.clientY]);
        const now = Date.now();
        eventIntervals.push(now - lastEventTime);
        lastEventTime = now;
    }

    function handleKeypress() {
        keystrokes++;
        const now = Date.now();
        eventIntervals.push(now - lastEventTime);
        lastEventTime = now;
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClick);
    document.addEventListener('keypress', handleKeypress);

    return new Promise(resolve => {
        setTimeout(() => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('scroll', handleScroll);
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keypress', handleKeypress);

            const timeSpent = Date.now() - startTime;
            
            const entropy: EntropyData = {
                timeSpent,
                mouseMoves,
                mousePositions: mousePositions.slice(-10),
                scrolls,
                scrollPositions: scrollPositions.slice(-5),
                clicks,
                clickPositions,
                keystrokes,
                eventIntervals: eventIntervals.slice(-20),
                userAgent: navigator.userAgent,
                screenSize: `${window.innerWidth}x${window.innerHeight}`,
                timestamp: Date.now(),
                random: crypto.getRandomValues(new Uint32Array(4))
            };

            const entropyStr = JSON.stringify(entropy);
            
            const encoder = new TextEncoder();
            const data = encoder.encode(entropyStr);
            
            crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                
                const finalToken = btoa(`${hashHex}_${Date.now()}`).replace(/=/g, '');
                resolve(finalToken);
            });
        }, 1000);
    });
} 