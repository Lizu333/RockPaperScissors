import { appState } from "./state.js";


let audioCtx = null;


function initAudio() {
    if (!audioCtx) {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return;
        }

        audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

window.addEventListener("click", initAudio, { once: true });
window.addEventListener("keydown", initAudio, { once: true });


function playSound(type) {
    if (!appState.soundEnabled) {
        return;
    }

    initAudio();

    if (!audioCtx) {
        return;
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);

    } else if (type === "win") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.start(now);
        osc.stop(now + 0.25);

    } else if (type === "lose") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.2);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);

    } else if (type === "draw") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);

    } else if (type === "gameover-win") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.start(now);
        osc.stop(now + 0.45);

    } else if (type === "computer") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(620, now + 0.08);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);
    }
}



export { initAudio, playSound };