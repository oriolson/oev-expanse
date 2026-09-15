import './style.css';

const DB_NAME = 'ctrl-cast-log';
const STORE_NAME = 'catches';
const DB_VERSION = 1;

const db = {
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async all() {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.caughtAt.localeCompare(a.caughtAt)));
      request.onerror = () => reject(request.error);
    });
  },
  async save(catchEntry) {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(catchEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  async replaceAll(entries) {
    const database = await this.open();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    entries.forEach((entry) => store.put(entry));
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
};

const elements = {
  catchDialog: document.querySelector('#catch-dialog'),
  backupDialog: document.querySelector('#backup-dialog'),
  form: document.querySelector('#catch-form'),
  catchList: document.querySelector('#catch-list'),
  catchCount: document.querySelector('#catch-count'),
  formError: document.querySelector('#form-error'),
  backupError: document.querySelector('#backup-error'),
  detailFields: document.querySelector('#detail-fields'),
  detailsToggle: document.querySelector('#details-toggle'),
};

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
document.querySelector('#today-date').textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'long', month: 'long', day: 'numeric',
}).format(new Date()).toUpperCase();

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[character]));

function displayMeasure(value, unit) {
  return value ? `${value}${unit}` : null;
}

function renderCatch(catchEntry) {
  const size = [displayMeasure(catchEntry.length, '"'), displayMeasure(catchEntry.weight, ' lb')].filter(Boolean).join(' · ');
  return `<article class="catch-item">
    <div class="catch-stamp">${new Date(catchEntry.caughtAt).getDate()}</div>
    <div class="catch-info">
      <h3>${escapeHtml(catchEntry.species)}</h3>
      <p>${escapeHtml(catchEntry.location || 'Location not noted')} <span>·</span> ${dateFormatter.format(new Date(catchEntry.caughtAt))}</p>
      ${catchEntry.lure ? `<p class="catch-detail">${escapeHtml(catchEntry.lure)}${catchEntry.depth ? ` at ${escapeHtml(catchEntry.depth)} ft` : ''}</p>` : ''}
    </div>
    <div class="catch-size">${size || '—'}</div>
  </article>`;
}

async function refreshCatches() {
  const catches = await db.all();
  elements.catchCount.textContent = `${catches.length} ${catches.length === 1 ? 'catch' : 'catches'}`;
  elements.catchList.innerHTML = catches.length
    ? catches.map(renderCatch).join('')
    : `<div class="empty-state"><p class="empty-number">01</p><h3>The water is waiting.</h3><p>Your catches will become a map of the days worth repeating.</p></div>`;
}

function openCatchLog() {
  elements.form.reset();
  elements.form.caughtAt.value = new Date().toISOString();
  elements.formError.hidden = true;
  elements.detailFields.hidden = true;
  elements.detailsToggle.setAttribute('aria-expanded', 'false');
  elements.detailsToggle.innerHTML = 'Add conditions <span aria-hidden="true">+</span>';
  elements.catchDialog.showModal();
  elements.form.species.focus();
}

function toggleDetails() {
  const isHidden = elements.detailFields.hidden;
  elements.detailFields.hidden = !isHidden;
  elements.detailsToggle.setAttribute('aria-expanded', String(isHidden));
  elements.detailsToggle.innerHTML = `${isHidden ? 'Hide conditions' : 'Add conditions'} <span aria-hidden="true">${isHidden ? '−' : '+'}</span>`;
}

async function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const photo = formData.get('photo');
  const entry = {
    id: crypto.randomUUID(),
    species: formData.get('species').trim(),
    length: formData.get('length'),
    weight: formData.get('weight'),
    location: formData.get('location').trim(),
    lure: formData.get('lure').trim(),
    depth: formData.get('depth'),
    water: formData.get('water').trim(),
    weather: formData.get('weather').trim(),
    notes: formData.get('notes').trim(),
    caughtAt: formData.get('caughtAt'),
    photo: photo instanceof File && photo.size ? await photo.arrayBuffer() : null,
    photoType: photo instanceof File && photo.size ? photo.type : null,
  };
  try {
    await db.save(entry);
    elements.catchDialog.close();
    await refreshCatches();
  } catch (error) {
    elements.formError.textContent = 'That catch could not be saved. Free up some device space and try again.';
    elements.formError.hidden = false;
  }
}

function serializeCatch(entry) {
  return { ...entry, photo: entry.photo ? Array.from(new Uint8Array(entry.photo)) : null };
}

async function exportLog() {
  const catches = await db.all();
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), catches: catches.map(serializeCatch) })], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: `tide-mark-${new Date().toISOString().slice(0, 10)}.json` });
  link.click();
  URL.revokeObjectURL(url);
}

async function importLog(event) {
  const [file] = event.target.files;
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.version !== 1 || !Array.isArray(data.catches) || data.catches.some((entry) => !entry.id || !entry.species || !entry.caughtAt)) {
      throw new Error('Invalid backup');
    }
    await db.replaceAll(data.catches.map((entry) => ({ ...entry, photo: entry.photo ? new Uint8Array(entry.photo).buffer : null })));
    elements.backupDialog.close();
    await refreshCatches();
  } catch (error) {
    elements.backupError.textContent = 'That file is not a Ctrl+Cast Log backup.';
    elements.backupError.hidden = false;
  } finally {
    event.target.value = '';
  }
}

document.querySelector('#open-log').addEventListener('click', openCatchLog);
document.querySelector('#close-log').addEventListener('click', () => elements.catchDialog.close());
document.querySelector('#backup-button').addEventListener('click', () => elements.backupDialog.showModal());
document.querySelector('#close-backup').addEventListener('click', () => elements.backupDialog.close());
elements.detailsToggle.addEventListener('click', toggleDetails);
elements.form.addEventListener('submit', handleSubmit);
document.querySelector('#export-button').addEventListener('click', exportLog);
document.querySelector('#import-input').addEventListener('change', importLog);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));
}

refreshCatches();
