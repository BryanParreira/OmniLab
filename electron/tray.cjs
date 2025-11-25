// electron/tray.js
const { Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('path');

function createTray(app, mainWindow) {
  // Use the uploaded image as tray icon (local path)
  const iconPath = '/mnt/data/IMG_63BB57B2-D9A6-449D-9BD1-BFF9B2CA0082.jpeg';
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    // Resize for tray if too big
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  } catch (e) {
    console.warn('Tray icon load failed, using default.');
    trayIcon = nativeImage.createEmpty();
  }

  const tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Lumina',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Open Workspace',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('main:action', { type: 'open-workspace' });
          mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    { label: 'Settings', click: () => { mainWindow.webContents.send('main:action', { type: 'open-settings' }); mainWindow.show(); } },
    { label: 'Quit', click: () => { app.quit(); } },
  ]);

  tray.setToolTip('Lumina — Dev Launcher');
  tray.setContextMenu(contextMenu);

  // Tray click toggles
  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) mainWindow.hide();
    else { mainWindow.show(); mainWindow.focus(); }
  });

  // Register a global shortcut to toggle window
  try {
    globalShortcut.register('CommandOrControl+K', () => {
      if (!mainWindow) return;
      if (mainWindow.isVisible()) mainWindow.hide();
      else { mainWindow.show(); mainWindow.focus(); }
    });
  } catch (e) {
    console.warn('Failed to register global shortcut in tray', e);
  }

  return tray;
}

module.exports = { createTray };
