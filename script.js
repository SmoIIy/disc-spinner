import list from "./list.json" with { type: "json" };

const SPIN_DURATION = 4000; // ms
const SPIN_LOOPS = 4; // full trips through the list before it lands
const IDLE_SPEED = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : 25; // px per second

const listEl = document.querySelector("#list");
const track = document.querySelector(".track");
const template = document.querySelector("#template");
const spinButton = document.querySelector(".container-body > button");
const dialog = document.querySelector("#result");
const resultName = document.querySelector("#result-name");
const resultDescription = document.querySelector("#result-description");

let position = 0; // how far the track has scrolled, in px
let busy = false; // true from the start of a spin until the popup closes
let lastFrame = performance.now();

const renderList = (items) => {
    items.forEach(({ name }) => {
        const clone = template.content.cloneNode(true);
        clone.querySelector(".list-item-name").textContent = name;
        track.appendChild(clone);
    });
};

// The track holds two copies of the list, so one copy is half its height
const loopHeight = () => track.offsetHeight / 2;

// Wraps the position into a single copy, so the scroll never runs out
const moveTo = (value) => {
    const loop = loopHeight();
    position = ((value % loop) + loop) % loop;
    track.style.transform = `translateY(${-position}px)`;
};

// Slow background drift, paused while spinning or showing a result
const drift = (now) => {
    if (!busy) moveTo(position + (IDLE_SPEED * (now - lastFrame)) / 1000);
    lastFrame = now;
    requestAnimationFrame(drift);
};

// Starts fast and slows to a stop
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

const spin = () => {
    busy = true;
    spinButton.disabled = true;
    listEl.classList.remove("blur");
    const index = Math.floor(Math.random() * list.length);
    const item = track.children[index];
    const loop = loopHeight();

    // The position that puts the chosen item in the middle of #list
    const target =
        item.offsetTop + item.offsetHeight / 2 - listEl.clientHeight / 2;

    const start = position;
    const distance =
        ((((target - start) % loop) + loop) % loop) + SPIN_LOOPS * loop;
    const startTime = performance.now();

    const step = (now) => {
        const t = Math.min((now - startTime) / SPIN_DURATION, 1);
        moveTo(start + distance * easeOutCubic(t));

        if (t < 1) requestAnimationFrame(step);
        else showResult(list[index]);
    };

    requestAnimationFrame(step);
};

const showResult = ({ name, description }) => {
    listEl.classList.add("blur");
    resultName.textContent = name;
    resultDescription.textContent = description;
    resultDescription.hidden = !description;
    dialog.returnValue = "";
    dialog.showModal();
};

// Runs whenever the popup closes. "Spin again" spins straight away;
// closing with Esc just resets so the main button can be used again.
const handleClose = () => {
    busy = false;
    spinButton.disabled = false;
    if (dialog.returnValue === "spin") spin();
};

renderList([...list, ...list]);
spinButton.addEventListener("click", spin);
dialog.addEventListener("close", handleClose);
requestAnimationFrame(drift);
