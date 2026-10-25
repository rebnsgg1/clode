/** true, якщо фронтенд запущено всередині десктопної програми (а не у звичайному браузері під час розробки) */
export const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
