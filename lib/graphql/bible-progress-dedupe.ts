export let lastServerSavedProgressKey: string | null = null;

export function resetBibleProgressDedupeKey() {
  lastServerSavedProgressKey = null;
}

export function setBibleProgressDedupeKey(key: string | null) {
  lastServerSavedProgressKey = key;
}
