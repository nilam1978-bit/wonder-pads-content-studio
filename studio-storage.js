// One atomic snapshot per browser origin. The revision check prevents a stale
// tab from overwriting work already saved by another tab.
const studioStorage = (() => {
  const databaseName = 'wonder-pads-content-studio';
  const storeName = 'workspace';
  const workspaceKey = 'current';
  let opening;

  function open() {
    if (!opening) {
      opening = new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1);
        let blocked = false;
        request.onupgradeneeded = () => request.result.createObjectStore(storeName);
        request.onerror = () => reject(request.error);
        request.onblocked = () => {
          blocked = true;
          reject(new Error('Close other Content Studio tabs, then try saving again.'));
        };
        request.onsuccess = () => {
          const db = request.result;
          if (blocked) { db.close(); return; }
          db.onversionchange = () => { db.close(); opening = null; };
          db.onclose = () => { opening = null; };
          resolve(db);
        };
      }).catch(error => { opening = null; throw error; });
    }
    return opening;
  }

  async function read() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(workspaceKey);
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error || new Error('Could not read saved work.'));
    });
  }

  async function write(state, expectedRevision) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.get(workspaceKey);
      let failure;
      const revision = (expectedRevision ?? 0) + 1;
      request.onsuccess = () => {
        if ((request.result?.revision ?? null) !== expectedRevision) {
          failure = new Error('Another tab saved a newer version.');
          failure.name = 'RevisionConflictError';
          tx.abort();
          return;
        }
        try {
          store.put({ state, revision }, workspaceKey);
        } catch (error) {
          failure = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(revision);
      tx.onabort = () => reject(failure || tx.error || new Error('The browser interrupted the save.'));
    });
  }

  return { read, write };
})();

function studioSaveError(error) {
  if (error?.name === 'QuotaExceededError') return 'Browser storage is full.';
  if (error?.name === 'RevisionConflictError') return 'Another tab saved a newer version. Download a backup before reloading.';
  return 'This browser could not save your latest changes.';
}
