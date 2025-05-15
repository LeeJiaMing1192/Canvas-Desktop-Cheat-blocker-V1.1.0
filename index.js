const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');


const userDataDir = app.getPath('userData');
const logFile = path.join(userDataDir, 'app.log');
const exePath = path.join(process.resourcesPath, 'BackgroundManager.exe');

let mainWindow;
let blockerProcess = null;
let isTestSubmitted = false;

function logToFile(message) {
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`, 'utf8');
    } catch (e) {
        console.error(`Error writing to log file ${logFile}: ${e.message}`);
        console.error(`[${timestamp}] ${message}`);
    }
}

// ==================== TAB BLOCKER ====================
function launchTabBlocker() {
    if (!fs.existsSync(exePath)) {
        logToFile(' tab_blocker.exe not found at: ' + exePath);
        return;
    }

    logToFile('Launching tab_blocker.exe...');
    try {
        blockerProcess = spawn(exePath, [], { windowsHide: true });

        blockerProcess.on('error', (err) => {
            logToFile('Tab blocker process error: ' + err.message);
        });

        blockerProcess.on('exit', (code, signal) => {
            logToFile(`Tab blocker process exited with code ${code} and signal ${signal}`);
            blockerProcess = null;
        });

        blockerProcess.on('spawn', () => {
            logToFile('Tab blocker process spawned successfully (PID: ' + blockerProcess.pid + ').');
        });

    } catch (e) {
        logToFile('Failed to spawn tab_blocker.exe: ' + e.message);
        blockerProcess = null;
    }
}

// ==================== QUIZ SUBMISSION HANDLER ====================
function unlockAndExit() {
    if (isTestSubmitted) return;
    isTestSubmitted = true;
    
    logToFile('Quiz submitted - unlocking system...');

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setKiosk(false);
        mainWindow.setFullScreen(false);
        mainWindow.setResizable(true);
    }

    if (blockerProcess && !blockerProcess.killed) {
        logToFile(' Stopping blocker program...');
        blockerProcess.kill('SIGTERM');
    }

   
    setTimeout(() => {
        logToFile('🚪 Exiting application...');
        app.quit();
    }, 2000);
}

// ==================== MAIN WINDOW ====================
function createWindow() {
    logToFile(' Creating main window...');
    mainWindow = new BrowserWindow({
        fullscreen: true,
        kiosk: true,
        resizable: false,
        minimizable: false,
        closable: true,
        skipTaskbar: true,
        alwaysOnTop: true,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Load the Canvas LMS login page
    const targetUrl = 'https://lsts.instructure.com/login/canvas';
    logToFile('➡️ Loading initial URL: ' + targetUrl);
    mainWindow.loadURL(targetUrl)
        .catch(err => {
            logToFile(' Error calling loadURL for ' + targetUrl + ': ' + err.message);
        });

    // ==================== QUIZ SUBMISSION DETECTION ====================
    // Primary detection via API request
    session.defaultSession.webRequest.onCompleted((details) => {
        logToFile(`[NETWORK] ${details.method} ${details.url} - ${details.statusCode}`);
        
        // Updated detection for the actual submission endpoint
        if (details.url.includes('/api/quiz_sessions/') && 
            details.url.includes('/submit') &&
            details.method === 'POST' &&
            (details.statusCode === 200 || details.statusCode === 302)) {
            logToFile(' Quiz submission detected via API!');
            unlockAndExit();
        }
    });

    // Fallback detection via URL changes
    mainWindow.webContents.on('did-navigate', (event, url) => {
        logToFile('Navigated to: ' + url);
        if (url.includes('submission') || url.includes('result')) {
            logToFile(' Quiz submission detected via URL!');
            unlockAndExit();
        }
    });

    // Start blocker when page finishes loading
    mainWindow.webContents.on('did-finish-load', () => {
        logToFile(' Finished loading URL: ' + mainWindow.webContents.getURL());
        if (!isTestSubmitted) {
            launchTabBlocker();
        }
    });

    // Error handling
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        logToFile(`Failed to load URL: ${validatedURL}, Error: ${errorDescription}`);
    });
}

// ==================== APP LIFECYCLE ====================
app.on('ready', () => {
    logToFile(' App is ready.');

    if (process.platform === 'win32') {
        app.setAppUserModelId('com.yourcompany.quizapp');
    }

    if (process.platform === 'darwin' && app.dock) {
        app.dock.hide();
    }

    createWindow();

    app.on('web-contents-created', (event, contents) => {
        contents.setWindowOpenHandler(() => {
            return { action: 'deny' };
        });
    });
});

app.on('window-all-closed', () => {
    logToFile(' All windows closed.');
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null || mainWindow.isDestroyed()) {
        createWindow();
    }
});

app.on('will-quit', () => {
    logToFile(' App is about to quit.');
    if (blockerProcess && !blockerProcess.killed) {
        logToFile('Killing tab blocker process...');
        blockerProcess.kill('SIGKILL');
    }
});

// Initial log entry
logToFile('Electron app script started.');