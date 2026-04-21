const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');
const page = document.querySelector('.page');
const body = document.body;

if (menu && menuLinks) {
    menu.addEventListener('click', function () {
        menu.classList.toggle('is-active');
        menuLinks.classList.toggle('active');
    });
}



/* =========================================================
   SHARED PATCH / CABLE HELPERS
========================================================= */

const PATCH_COLORS = ["#ff4d4d", "#4dff88", "#4da6ff"];
let patchColorIndex = Number(sessionStorage.getItem("patchColorIndex") || 0);

let activeDragColor = sessionStorage.getItem("currentPatchColor") || PATCH_COLORS[0];

function getNextPatchColor() {
    const color = PATCH_COLORS[patchColorIndex % PATCH_COLORS.length];
    patchColorIndex += 1;
    sessionStorage.setItem("patchColorIndex", String(patchColorIndex));
    return color;
}

function applyCableColor(pathEl, plugEl, color) {
    pathEl.setAttribute("stroke", color);
    plugEl.setAttribute("fill", color);
}



function createSvgCable(svg, plugRadius = 5) {
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('class', 'cable-path');
    svg.appendChild(pathEl);

    const plugEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    plugEl.setAttribute('class', 'cable-plug');
    plugEl.setAttribute('r', String(plugRadius));
    svg.appendChild(plugEl);

    const color = sessionStorage.getItem("currentPatchColor") || PATCH_COLORS[0];
    applyCableColor(pathEl, plugEl, color);

    return { pathEl, plugEl };
}

function getElementCenterInSvg(element, svg) {
    if (!element || !svg) return null;

    const rect = element.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    return {
        x: rect.left + rect.width / 2 - svgRect.left,
        y: rect.top + rect.height / 2 - svgRect.top
    };
}





function drawSaggingCable(pathEl, plugEl, from, to, { isDragging = false } = {}) {
    if (!from || !to) return;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);

    const sagFactor = isDragging ? 0.12 : 0.22;
    const sag = Math.min(
        isDragging ? 55 : 90,
        Math.max(isDragging ? 18 : 28, distance * sagFactor)
    );

    const c1x = from.x + dx * 0.25;
    const c1y = from.y + sag;
    const c2x = from.x + dx * 0.75;
    const c2y = to.y + sag;

    const d = `M ${from.x} ${from.y}
               C ${c1x} ${c1y},
                 ${c2x} ${c2y},
                 ${to.x} ${to.y}`;

    pathEl.setAttribute('d', d);
    plugEl.setAttribute('cx', to.x);
    plugEl.setAttribute('cy', to.y);
}

function makeMousePointInSvg(event, svg) {
    const svgRect = svg.getBoundingClientRect();
    return {
        x: event.clientX - svgRect.left,
        y: event.clientY - svgRect.top
    };
}

function setupPatchDrag({
    svg,
    sourceElement,
    targetItems,
    targetSelector,
    getFromPoint,
    draw,
    clearHover,
    setHover,
    onDragStart,
    onDropValid,
    onDropInvalid,
    onResize
}) {
    let dragging = false;

    if (!sourceElement) return;

    sourceElement.addEventListener('mousedown', (e) => {
        e.preventDefault();

        if (onDragStart) onDragStart();

        dragging = true;
        document.body.style.cursor = 'crosshair';
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;

        const from = getFromPoint();
        const to = makeMousePointInSvg(e, svg);

        draw(from, to, { isDragging: true });

        clearHover();

        const hoveredHole = document.elementFromPoint(e.clientX, e.clientY)?.closest(targetSelector);
        const hoveredItem = hoveredHole?.closest(targetItems);

        if (hoveredItem) {
            setHover(hoveredItem);
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (!dragging) return;

        dragging = false;
        document.body.style.cursor = '';
        clearHover();

        const targetHole = document.elementFromPoint(e.clientX, e.clientY)?.closest(targetSelector);
        const targetItem = targetHole?.closest(targetItems);

        if (!targetItem) {
            if (onDropInvalid) onDropInvalid();
            return;
        }

        if (onDropValid) onDropValid(targetItem);
    });

    if (onResize) {
        window.addEventListener('resize', onResize);
    }
}



/* =========================================================
   PROJECT PATCH SELECTOR
========================================================= */

const projectPatchbay = document.querySelector('.project-patchbay');
const projectSvg = document.querySelector('#project-cable-layer');

if (projectPatchbay && projectSvg) {
    const sourceHole = document.querySelector('#project-source-hole');
    const projectJacks = [...document.querySelectorAll('.project-jack')];

    const titleEl = document.querySelector('#project-title');
    const subtitleEl = document.querySelector('#project-subtitle');
    const dateEl = document.querySelector('#project-date');
    const collabEl = document.querySelector('#project-collab');
    const descEl = document.querySelector('#project-description');
    const mediaEl = document.querySelector('#project-media');
    const extraEl = document.querySelector('#project-extra');

    const projects = {
        "pitch-imperfect": {
            title: "Pitch Imperfect",
            subtitle: "Virtual singing coach",
            date: "2024-11-01 - 2025-01-13",
            collab: "With Viktoria Björklund, Cornelia Kärnekull, and Filip Maras",
            description: "This project evaluated the potential of Furhat, a social robot, as a multi-modal pitch training tool. I was responisble for integrating Furhat with a custom backend for real-time pitch detection using the YIN algorithm and provided feedback through two distinct modalities: verbal cues and gestures.",
            media: `
                <iframe
                    src="https://www.youtube.com/embed/yD6-LCzyFVA?si=Hmmn5BcHHPjr2rfp"
                    title="Pitch Imperfect"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen>
                </iframe>
            `,
            extra: ``
        },

        "fm-synthesis": {
            title: "Chowning's FM Synthesis Legacy:",
            subtitle: "Crafting Realistic Bell Tones",
            date: "2024-03-15 - 2024-04-13",
            collab: "With Jarl Stephansson",
            description: "This project covered the theory and creation process of a frequency modulation (FM) synthesis model and the usage of it to create real-world sounding bell tones. Based on FM pioneer John M. Chowning’s work, we created the model in Max MSP.",
            media: `<img src="images/FM_schematic_white.png" alt="FM Synthesis schematic">`,
            extra: `
                <p>Listen to a bell sound produced by the model:</p>
                <audio controls>
                    <source src="audio/FM_Bell.wav" type="audio/wav">
                    <source src="audio/FM_Bell.mp3" type="audio/mp3">
                </audio>
            `
        },

        "drumboks": {
            title: "DRUMBOKS",
            subtitle: "Motion-detecting drums",
            date: "2023-04-20 - 2023-05-30",
            collab: "With Stefan Ivchenko",
            description: "A cost effective, portable, and interactive musical instrument. The DRUMBOKS explores the possibilities of an non-physical drum kit controlled solely by the movements of its user. This was done using accelerometers to record and define the motion of a pair of drumsticks, and an IR sensor detecting when a foot is playing the kickdrum.",
            media: `
                <iframe
                    src="https://www.youtube.com/embed/PjHZCnnp7nQ?si=O_NC-GdWh4HD1EUk"
                    title="DRUMBOKS"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen>
                </iframe>
            `,
            extra: ``
        },

        "burden-of-proof": {
            title: "Burden of Proof",
            subtitle: "Interactive documentary",
            date: "2021-11-15 - 2022-01-12",
            collab: "With Viktoria Björklund, Harald Hamrin Reinhed, Emmy Klum, Tore Stenberg, Simon Wanna, and Oscar Wester",
            description: "Burden of Proof is an interactive murder mystery putting its audience in the role of investigator. As head of audio post-production I composed an original soundtrack, did sound design and created the final mix for the entire project. Watch the preview to see and hear excerpt of the documentary and to also witness my horrid acting.",
            media: `
                <iframe
                    src="https://www.youtube.com/embed/2j3MzluSkJg?si=3pZVLxdWMrpO8gfx"
                    title="Burden of Proof"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen>
                </iframe>
            `,
            extra: ``
        },

        "david-guetta": {
            title: "Is David Guetta a fraud?",
            subtitle: "A Feature-Based Playlist Optimization Inspired by Professional DJ Practices",
            date: "2021-11-15 - 2022-01-12",
            collab: "Jarl Stephansson and Filip Maras",
            description: "A music playlist sorter that calculates the optimal order for a DJ to move through a set of songs with minimal jumps in tempo and key between each song. This happens through a pipeline of custom algorithms for tempo and key detection as well as cost minimization and evaluation against real DJ-sets. Key detection used a template-based method and was specifically adjusted to perform well on EDM music.",
            extra: ``
        },

        "sound-step": {
            title: "SoundStep",
            subtitle: "A Mobile sonification system for real time running feedback",
            date: "2021-11-15 - 2022-01-12",
            collab: "David Segal",
            description: "Developed SoundStep, a sonification platform that analyzes running data and provides real-time auditory feedback using only a smartphone and headphones, supporting both research and enhancing the runner’s experience. So far, the project has been presented at the AM.ICAD 2025 and SportsHCI 25 as demos and also participated in the International Joint Student Research Symposium at BINUS University 2025, and is still in active development.",
            extra: ``
        }
    };

    let activeProject = projectPatchbay.dataset.activeProject || "pitch-imperfect";
    let projectDragging = false;

    const { pathEl: projectPathEl, plugEl: projectPlugEl } = createSvgCable(projectSvg);

    function getProjectHoleCenterFromJack(jack) {
        if (!jack) return null;
        const hole = jack.querySelector('.hole');
        return getElementCenterInSvg(hole, projectSvg);
    }

    function getSourceCenter() {
        return getElementCenterInSvg(sourceHole, projectSvg);
    }

    function drawProjectCable(from, to, opts = {}) {
        drawSaggingCable(projectPathEl, projectPlugEl, from, to, opts);
    }

    function getActiveProjectJack() {
        return document.querySelector(`.project-jack[data-project="${activeProject}"]`);
    }

    function clearProjectHover() {
        projectJacks.forEach(j => j.classList.remove('target-hover'));
    }

    function setActiveProjectVisual(projectKey) {
        projectJacks.forEach(j => {
            j.classList.toggle('active', j.dataset.project === projectKey);
        });
    }

    function renderProject(projectKey) {
        const project = projects[projectKey];
        if (!project) return;

        const display = document.querySelector('#project-display');
        display.classList.remove('project-fade--in');
        display.classList.add('project-fade');

        setTimeout(() => {
            titleEl.textContent = project.title;
            subtitleEl.textContent = project.subtitle;
            dateEl.textContent = project.date;
            collabEl.textContent = project.collab;
            descEl.textContent = project.description;
            mediaEl.innerHTML = project.media;
            extraEl.innerHTML = project.extra;

            display.classList.add('project-fade--in');
        }, 120);

        activeProject = projectKey;
        setActiveProjectVisual(projectKey);

        const from = getSourceCenter();
        const to = getProjectHoleCenterFromJack(getActiveProjectJack());

        if (from && to) {
            drawProjectCable(from, to, { isDragging: false });
        }
    }

    document.addEventListener('mousedown', (e) => {
        
        const activeHole = getActiveProjectJack()?.querySelector('.hole');
        if (!activeHole) return;
        if (e.target !== activeHole) return;

        e.preventDefault();

        activeDragColor = getNextPatchColor();
        sessionStorage.setItem("currentPatchColor", activeDragColor);
        applyCableColor(projectPathEl, projectPlugEl, activeDragColor);

        projectDragging = true;
        document.body.style.cursor = 'crosshair';
    });

    document.addEventListener('mousemove', (e) => {
        if (!projectDragging) return;

        const from = getSourceCenter();
        const to = makeMousePointInSvg(e, projectSvg);

        drawProjectCable(from, to, { isDragging: true });

        clearProjectHover();

        const hoveredHole = document.elementFromPoint(e.clientX, e.clientY)?.closest('.hole');
        const hoveredJack = hoveredHole?.closest('.project-jack');

        if (hoveredJack && hoveredJack.dataset.project !== activeProject) {
            hoveredJack.classList.add('target-hover');
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (!projectDragging) return;

        projectDragging = false;
        document.body.style.cursor = '';
        clearProjectHover();

        const targetHole = document.elementFromPoint(e.clientX, e.clientY)?.closest('.hole');
        const targetJack = targetHole?.closest('.project-jack');

        if (!targetJack || targetJack.dataset.project === activeProject) {
            renderProject(activeProject);
            return;
        }

        renderProject(targetJack.dataset.project);
    });

    projectJacks.forEach(jack => {
        const label = jack.querySelector('.project-jack__label');
        if (!label) return;

        label.addEventListener('click', () => {
            renderProject(jack.dataset.project);
        });
    });

    window.addEventListener('resize', () => {
        renderProject(activeProject);
    });

    renderProject(activeProject);
}



/*Oscilloscope logic*/


/* =========================================================
   OSCILLOSCOPE
========================================================= */

const scopeCanvas = document.querySelector('#scope-canvas');

if (scopeCanvas) {
    const ctx = scopeCanvas.getContext('2d');

    const audioFiles = [
        'audio/Heartless (-1dB).wav',
    ];

    const chosenFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];

    let samples = null;
    let offset = 0;
    let stride = 350;
    let windowSize = 1400;

    async function loadScopeAudio(url) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const channel = audioBuffer.getChannelData(0);

        samples = channel;
        stride = Math.max(40, Math.floor(audioBuffer.sampleRate / 300));
        windowSize = Math.min(2200, Math.max(900, Math.floor(audioBuffer.sampleRate * 0.03)));
    }

    function drawScopeBackground(w, h) {
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(120,255,170,0.10)';
        ctx.lineWidth = 1;

        for (let x = 0; x <= w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        for (let y = 0; y <= h; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(120,255,170,0.18)';
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
    }

    function drawScopeWaveform() {
        if (!samples) return;

        const w = scopeCanvas.width;
        const h = scopeCanvas.height;

        drawScopeBackground(w, h);

        ctx.beginPath();

        for (let x = 0; x < w; x++) {
            const t = x / (w - 1);
            const index = Math.floor(offset + t * windowSize) % samples.length;
            const sample = samples[index] || 0;

            const y = h * 0.5 + sample * h * 0.32;

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.strokeStyle = 'rgba(125,255,147,0.25)';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.beginPath();

        for (let x = 0; x < w; x++) {
            const t = x / (w - 1);
            const index = Math.floor(offset + t * windowSize) % samples.length;
            const sample = samples[index] || 0;

            const y = h * 0.5 + sample * h * 0.32;

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.strokeStyle = '#7dff93';
        ctx.lineWidth = 2;
        ctx.stroke();

        offset = (offset + stride) % samples.length;

        requestAnimationFrame(drawScopeWaveform);
    }

    loadScopeAudio(chosenFile)
        .then(() => {
            drawScopeWaveform();
        })
        .catch((error) => {
            console.error('Failed to load oscilloscope audio:', error);
        });
}