const { app, BrowserWindow } = require('electron');
const path = require('path');

// ÉP ELECTRON BẬT MAX LOA: Tắt chính sách chặn âm thanh tự động
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true, // Mở lên là chiếm trọn màn hình y như Web
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Bật cái này để React gọi được window.close()
      webSecurity: false // Cho phép đọc file mp3 ở local
    }
  });

  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Bấm ESC để thoát
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape') {
      app.quit();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});