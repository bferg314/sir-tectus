const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  exitGame: () => ipcRenderer.send('exit-game'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen')
});
