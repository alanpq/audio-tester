const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const env = audioCtx.createGain();
const gain = audioCtx.createGain();
const osc = audioCtx.createOscillator();
osc.type = 'sin';
osc.connect(env).connect(gain).connect(audioCtx.destination);
env.gain.setValueAtTime(0, audioCtx.currentTime);
gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
osc.start();

const delay = 0.25;
const attack = 0.05;
const release = 0.05;
const noteLen = 1;
const noteGap = 0.5;



const buttons = {
  start: document.querySelector('a.start'),
  higher: document.querySelector('a.higher'),
  lower: document.querySelector('a.lower'),
  next: document.querySelector('a.next'),
}

const dom = {
  prompt: document.querySelector("p.prompt"),
  menu: document.querySelector("article.menu"),
  buttons: document.querySelector("section.buttons"),
  volume: document.querySelector("input"),
}

const intervals = [
  ["an octave", 2],
  ["a major sixth", 5/3],
  ["a perfect fifth", 3/2],
  ["a perfect fourth", 4/3],
  ["a major third", 5/4],
  ["a minor third", 6/5],
];

const state = {
  started: false,
  failed: false,
  canGuess: false,
  endTime: 0,

  correct: 0,
  total: 0,
  answer: 0,

  index: -1,
  freqA: 0,
  freqB: 0,
  interval: 0,

  correctSemi: 0,
  finalDiff: (440 * intervals[intervals.length-1][1]) - 440,

  volume: 0.5,
};

const playSound = (freqA, freqB) => {
  const noteAStart = audioCtx.currentTime + delay;
  const noteAStop  = noteAStart + noteLen;
  const noteBStart = noteAStop + noteGap;
  const noteBStop  = noteBStart + noteLen;
  state.endTime = noteBStart;

  osc.frequency.setValueAtTime(freqA, noteAStart);
  osc.frequency.setValueAtTime(freqB, noteBStart);

  // osc.start(noteAStart);
  env.gain.cancelScheduledValues(noteAStart);
  env.gain.setValueAtTime(0, noteAStart);
  env.gain.linearRampToValueAtTime(1, noteAStart + attack);
  env.gain.setValueAtTime(1, noteAStop - release);
  env.gain.linearRampToValueAtTime(0, noteAStop);

  env.gain.cancelScheduledValues(noteBStart);
  env.gain.setValueAtTime(0, noteBStart);
  env.gain.linearRampToValueAtTime(1, noteBStart + attack);
  env.gain.setValueAtTime(1, noteBStop - release);
  env.gain.linearRampToValueAtTime(0, noteBStop);
  // osc.stop(noteBStop);
}

const lerp = (a,b,t) => {
  return a + t * (b-a);
}

const createTest = () => {
  if (!state.started) return;
  if (audioCtx.currentTime <= state.endTime) return;
  state.canGuess = false;
  state.index++;
  state.total++;
  state.answer = Math.random() > 0.5;

  state.freqA = 440;
  let interval;
  if (state.index >= intervals.length) {
    state.finalDiff = lerp(state.finalDiff, 0, 0.2);
    state.freqB = state.freqA + state.finalDiff * (state.answer ? 1 : -1);
  } else {
    interval = intervals[state.index][1];
    if(state.answer) {
      state.freqB = state.freqA * interval;
    } else {
      state.freqB = state.freqA / interval;
    }
  }

  // console.log(state.answer ? 'higher' : 'lower');
  // if (state.index < intervals.length) {
  //   console.log(interval);
  //   console.log(intervals[state.index])
  // } else
  //   console.log(state.finalDiff + 'hz')
  // console.log(state.freqA);
  // console.log(state.freqB);

  
  playSound(state.freqA, state.freqB);

}


const start = () => {
  state.started = true;
  state.failed = false;
  state.canGuess = false;
  state.endTime = 0;

  state.correct = 0;
  state.total = 0;
  state.answer = 0;

  state.index = -1;
  state.freqA = 0;
  state.freqB = 0;
  state.interval = 0;

  state.correctSemi = 0;
  state.finalDiff = (440 * intervals[intervals.length-1][1]) - 440;
  next(true);
}

const end = () => {
  dom.menu.className = `out ${(state.started ? 'started' : '')}`;
  setTimeout(() => {
    state.started = false;
    dom.menu.className = "menu";
    dom.buttons.className = "buttons";
    if(state.correct == 0)
      dom.prompt.innerHTML = `Almost!<br> The 2nd tone was ${humanizeInterval(false)} than the 1st.<br>Unfortunately, you didn't get any right, but feel free to try again!`;
    else 
      dom.prompt.innerHTML = `Almost!<br> The 2nd tone was ${humanizeInterval(false)} than the 1st.<br>You got <pre>${state.correct}</pre> right, and were able to distinguish intervals all the way down to about <pre>${state.correctSemi.toFixed(2)}</pre> semitones!`;
    buttons.start.innerText = "Try again?";
  }, 0.2*1000);
}

const interval = (fromFrequency, toFrequency) => {
  return 12 * Math.log2(toFrequency / fromFrequency)
}

const humanizeInterval = (correct=true) => {
  const hilo = state.answer ? "higher" : "lower";
  const diff = Math.abs(state.freqB-state.freqA);

  const semitones = Math.abs(interval(state.freqA, state.freqB))
  if (correct) {
    state.correctSemi = semitones;
    console.log('new semi')
  }
  if (state.index < intervals.length) {
    return `${intervals[state.index][0]} - <pre>${diff.toFixed(2)}</pre> hz, or about <pre>${semitones.toFixed(2)}</pre> semitones ${hilo}`
  }
  return `<pre>${diff.toFixed(2)}</pre> hz, or roughly <pre>${semitones.toFixed(2)}</pre> semitones ${hilo}`;
} 

const guess = (guess) => {
  if (!state.started || !state.canGuess) return;
  if (audioCtx.currentTime <= state.endTime) return;
  if (guess == state.answer) {
    state.correct++;
  } else {
    end();
    return;
  }
  dom.menu.className = `out ${(state.started ? 'started' : '')}`;
  setTimeout(() => {
    dom.menu.className = "started";
    dom.buttons.className = "buttons next";
    dom.prompt.innerHTML = `Correct!<br> The 2nd tone was ${humanizeInterval()} than the 1st.`
  }, 0.2*1000);
  state.canGuess = false;
}

const next = (start=false) => {
  dom.menu.className = (start ? 'menu' : '') + " out " + (state.started && !start ? 'started' : '');
  setTimeout(() => {
    dom.buttons.className = "buttons";
    dom.menu.className = "started";
    dom.prompt.innerHTML = "Is the 2nd tone higher or lower?<br><i>(you can also use the up and down arrow keys)</i>"
    createTest();
    state.canGuess = true;
  }, 0.3*1000);
}

buttons.start.onclick = (e) => {
  if (audioCtx.state === 'suspended')
		audioCtx.resume();
  start();
  e.preventDefault();
}

buttons.next.onclick = (e) => {
  if (audioCtx.state === 'suspended')
		audioCtx.resume();
  next();
  e.preventDefault();
}

buttons.higher.onclick = (e) => {
  if (audioCtx.state === 'suspended')
		audioCtx.resume();
  guess(true);
  e.preventDefault();
}

buttons.lower.onclick = (e) => {
  if (audioCtx.state === 'suspended')
		audioCtx.resume();
  guess(false);
  e.preventDefault();
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) return;
  if (audioCtx.state === 'suspended')
		audioCtx.resume();
  switch (e.code) {
    case "ArrowUp":
      guess(true);
      e.preventDefault();
    break;
    case "ArrowDown":
      guess(false);
      e.preventDefault();
    break;
    default:
      if (!state.started) return start();
      if (!state.canGuess) return next();
    break;
  }
})

const vol = (t) => {
  state.volume = t.value/100;
  gain.gain.setValueAtTime(state.volume, audioCtx.currentTime);
}

dom.volume.addEventListener('input', (e) => {
  vol(e.target);
})

document.addEventListener('DOMContentLoaded', (event) => {
  setTimeout(() => {
    document.querySelector('body').style.opacity = 1;
  }, 200);
  vol(dom.volume);
});

