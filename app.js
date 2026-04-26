const STORAGE_KEY = "simple-alarms";

const clockEl = document.getElementById("clock");
const formEl = document.getElementById("alarm-form");
const inputEl = document.getElementById("alarm-time");
const listEl = document.getElementById("alarm-list");
const ringingEl = document.getElementById("ringing");
const stopBtn = document.getElementById("stop-btn");

let alarms = loadAlarms();
let audioCtx = null;
let ringingTimer = null;

render();
tick();
setInterval(tick, 1000);

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const time = inputEl.value;
  if (!time) return;
  if (alarms.some((a) => a.time === time)) {
    inputEl.value = "";
    return;
  }
  alarms.push({ id: crypto.randomUUID(), time, lastRung: null });
  alarms.sort((a, b) => a.time.localeCompare(b.time));
  saveAlarms();
  render();
  inputEl.value = "";
});

listEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  alarms = alarms.filter((a) => a.id !== btn.dataset.id);
  saveAlarms();
  render();
});

stopBtn.addEventListener("click", stopRinging);

function tick() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString("ja-JP", { hour12: false });

  const hhmm = now.toTimeString().slice(0, 5);
  const today = now.toDateString();

  for (const alarm of alarms) {
    if (alarm.time === hhmm && alarm.lastRung !== today) {
      alarm.lastRung = today;
      saveAlarms();
      startRinging();
      break;
    }
  }
}

function startRinging() {
  ringingEl.hidden = false;
  playBeep();
  ringingTimer = setInterval(playBeep, 1200);
}

function stopRinging() {
  ringingEl.hidden = true;
  if (ringingTimer) {
    clearInterval(ringingTimer);
    ringingTimer = null;
  }
}

function playBeep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (_) {}
}

function render() {
  listEl.innerHTML = "";
  for (const alarm of alarms) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.className = "time";
    span.textContent = alarm.time;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = alarm.id;
    btn.textContent = "削除";
    li.append(span, btn);
    listEl.append(li);
  }
}

function loadAlarms() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAlarms() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
}
