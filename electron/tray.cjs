const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const fs = require('fs');

function createTray(mainWindow) {
  let iconPath;

  // 1. ROBUST PATH FINDING
  if (app.isPackaged) {
    // Production Strategy 1: Look in 'resources' folder (Requires 'extraResources' in package.json)
    const resourcePath = path.join(process.resourcesPath, 'icon.png');
    
    // Production Strategy 2: Look inside the ASAR bundle (Fallback)
    const asarPath = path.join(app.getAppPath(), 'icon.png');

    if (fs.existsSync(resourcePath)) {
      iconPath = resourcePath;
    } else {
      iconPath = asarPath;
    }
  } else {
    // Development Strategy
    const rootPath = app.getAppPath();
    const possiblePaths = [
      path.join(rootPath, 'public', 'icon.png'),
      path.join(rootPath, 'icon.png'),
      path.join(__dirname, 'icon.png')
    ];
    iconPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
  }

  // 2. CREATE ICON
  let trayIcon;
  try {
    if (fs.existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath);
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
      
      if (process.platform === 'darwin') {
        trayIcon.setTemplateImage(true);
      }
    } else {
      trayIcon = nativeImage.createEmpty();
      console.warn('Tray icon not found at:', iconPath);
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  const tray = new Tray(trayIcon);
  tray.setToolTip('OmniLab');

  // 3. CONTEXT MENU
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show OmniLab',
      click: () => {
        // SAFEGUARD: Check if window exists and isn't destroyed
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'New Chat',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
          mainWindow.webContents.send('cmd:new-chat'); 
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => { 
        app.isQuitting = true;
        app.quit(); 
      } 
    },
  ]);

  tray.setContextMenu(contextMenu);

  // 4. CLICK BEHAVIOR (FIXED CRASH HERE)
  tray.on('click', () => {
    // CRITICAL FIX: Check isDestroyed() to prevent "Object has been destroyed" error
    if (!mainWindow || mainWindow.isDestroyed()) return;
    
    if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  return tray;
}

module.exports = { createTray };