const micBtn = document.getElementById('mic-btn');
const statusText = document.getElementById('status');
const journalList = document.getElementById('list');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition;
let recording = false;
let spokenText = '';

if (!SpeechRecognition) {
  micBtn.disabled = true;
  statusText.textContent = 'Voice recognition not supported in this browser';
}

micBtn.addEventListener('click', () => {
  if (!SpeechRecognition) return;

  recording ? stopRecording() : startRecording();
});

function startRecording() {
  spokenText = '';
  recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    for (const result of event.results) {

      statusText.textContent += result[0].transcript + ' ';

      if (result.isFinal) {
        spokenText += result[0].transcript + ' ';
      }
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') return;

    recording = false;
    micBtn.classList.remove('recording');

    statusText.textContent = event.error === 'not-allowed' ? 'Mic access denied' : 'Error: ' + event.error;
  };

  recognition.onend = () => {
    recording = false;
    micBtn.classList.remove('recording');
    micBtn.classList.add('processing');
    saveEntry();
  };

  recognition.start();
  recording = true;
  micBtn.classList.add('recording');
  statusText.textContent = 'Listening...';
}

function stopRecording() {
  recording = false;
  micBtn.classList.remove('recording');
  micBtn.classList.add('processing');
  statusText.textContent = 'Saving...';
  recognition.stop();
}

function saveEntry() {
  const text = spokenText.trim().replace(/\s+/g, ' ');

  if (!text) {
    statusText.textContent = 'No voice detected';
    return;
  }

  const entry = {
    id: Date.now(),
    date: new Date().toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'short'
    }),
    text: text.charAt(0).toUpperCase() + text.slice(1) + '.',
    words: text.split(' ').length
  };

  const entries = getEntries();

  entries.unshift(entry);
  localStorage.setItem('journal_entries', JSON.stringify(entries));

  renderEntries();
  statusText.textContent = 'Saved';
  micBtn.classList.remove('processing');
}

function getEntries() {
  const stored = localStorage.getItem('journal_entries');

  return JSON.parse(stored || '[]');
}

journalList.addEventListener('click', (event) => {
  const button = event.target.closest('.del');

  if (!button) return;

  const id = Number(button.dataset.id);
  const e = getEntries().filter(entry => entry.id !== id);

  localStorage.setItem('journal_entries', JSON.stringify(e));
  renderEntries();
});

function renderEntries() {
  const entries = getEntries();

  journalList.innerHTML = entries.map(entry => {
    const text = entry.text || '';
    const words = entry.words || text.trim().split(/\s+/).length;
    const date = entry.date || 'Just now';

    return `
          <div class="card">
            <div class="topbar"><time>${date}</time>
                <div class="top-info"><span>${words} words</span><button data-id="${entry.id}" class="del"> <i class="icon-trash"></i> Delete</button></div>
            </div>
            <section>
                <p>${text}</p>
            </section>
        </div>
    `;
  }).join('');
}

renderEntries();