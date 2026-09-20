const { contextBridge, ipcRenderer } = require('electron');

// Expose safe platform metadata and game controls to the web renderer
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  exitGame: () => ipcRenderer.send('exit-game'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen')
});
