const mic = document.getElementById('mic-btn');
const label = document.getElementById('status');
const feed = document.getElementById('list');

const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
let active = false;
let text = '';

const readData = () => JSON.parse(localStorage.getItem('journal_entries') || '[]');
const writeData = (v) => localStorage.setItem('journal_entries', JSON.stringify(v));

if (!SpeechAPI) {
  mic.disabled = true;
  label.textContent = 'Voice recognition not supported';
}

mic.onclick = () => {
  if (!SpeechAPI) return;

  if (!active) {
    text = '';

    rec = new SpeechAPI();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (e) => {
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          text += ' ' + e.results[i][0].transcript;
        }
      }
    };

    rec.onerror = (e) => {
      // 'aborted' and 'no-speech' are natural terminations on mobile, ignore them
      if (e.error === 'aborted' || e.error === 'no-speech') return;

      active = false;
      mic.classList.remove('recording');
      label.textContent = e.error === 'not-allowed' ? 'Mic access denied' : `Error: ${e.error}`;
    };

    rec.onend = () => {
      active = false;
      mic.classList.remove('recording');
      saveNote();
    };

    active = true;
    mic.classList.add('recording');
    label.textContent = 'Listening...';

    try {
      rec.start();
    } catch (err) {
      active = false;
      mic.classList.remove('recording');
      label.textContent = 'Tap to try again';
    }
  } else {
    active = false;
    mic.classList.remove('recording');
    label.textContent = 'Saving...';

    try {
      rec.stop();
    } catch (err) {
      saveNote();
    }
  }
};

function saveNote() {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) {
    label.textContent = 'No voice detected';
    return;
  }

  const list = readData();
  list.unshift({
    id: Date.now(),
    date: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    text: clean.charAt(0).toUpperCase() + clean.slice(1) + '.',
    words: clean.split(' ').length
  });

  writeData(list);
  show();
  label.textContent = 'Saved';
}

feed.onclick = (e) => {
  const btn = e.target.closest('.del');
  if (!btn) return;
  writeData(readData().filter((item) => item.id !== Number(btn.dataset.id)));
  show();
};

function show() {
  const list = readData();
  feed.innerHTML = list.map((item) => `
    <div class="card">
      <div class="topbar">
        <time>${item.date}</time>
        <div class="top-info">
          <span>${item.words || item.wordCount || 0} words</span>
          <button class="del" data-id="${item.id}">Delete</button>
        </div>
      </div>
      <section><p>${item.text || item.cleanText || ''}</p></section>
    </div>
  `).join('');
}

show();