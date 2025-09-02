// ==UserScript==
// @name         HAESL CAR Batch Extractor - Access Controlled
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  CAR Batch Extractor with GitHub access control
// @author       You
// @match        https://haesl.gaelenlighten.com/Reporting/ReportingManagement*
// @match        https://haesl.gaelenlighten.com/Reporting/Report/Index/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function() {
    'use strict';

    // Access Control Configuration
    const ACCESS_CONTROL_URL = 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/access-control.json';

    // Generate user fingerprint
    function generateUserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('HAESL_CAR_USER', 2, 2);
        const fingerprint = canvas.toDataURL();
        return btoa(fingerprint.slice(-30)).slice(0, 8);
    }

    const USER_ID = generateUserFingerprint();
    console.log('🔐 CAR Extractor - User ID:', USER_ID);

    // Show status message
    function showStatus(message, type = 'info') {
        const existing = document.getElementById('access-status-msg');
        if (existing) existing.remove();

        const colors = { success: '#28a745', error: '#dc3545', info: '#17a2b8' };
        const statusDiv = document.createElement('div');
        statusDiv.id = 'access-status-msg';
        statusDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: ${colors[type]};
            color: white; padding: 15px; border-radius: 8px; z-index: 999999;
            font-family: Consolas, monospace; font-size: 13px; max-width: 350px;
        `;
        statusDiv.textContent = message;
        document.body.appendChild(statusDiv);

        if (type === 'success') {
            setTimeout(() => statusDiv.remove(), 3000);
        }
    }

    // Check access with GitHub
    function checkAccess() {
        return new Promise((resolve) => {
            showStatus('🔍 Checking access...', 'info');

            GM_xmlhttpRequest({
                method: 'GET',
                url: ACCESS_CONTROL_URL + '?t=' + Date.now(),
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const config = JSON.parse(response.responseText);
                            
                            if (!config.enabled) {
                                showStatus('🚫 System disabled', 'error');
                                resolve(false);
                                return;
                            }

                            const user = config.authorizedUsers?.find(u => u.id === USER_ID);
                            if (!user) {
                                showStatus(`🚫 Access denied for ${USER_ID}`, 'error');
                                resolve(false);
                                return;
                            }

                            if (!user.enabled || new Date() >= new Date(user.expires)) {
                                showStatus('🚫 Access expired or disabled', 'error');
                                resolve(false);
                                return;
                            }

                            showStatus(`✅ Access granted for ${user.name}`, 'success');
                            resolve(true);

                        } catch (e) {
                            showStatus('❌ Config error', 'error');
                            resolve(false);
                        }
                    } else {
                        showStatus('❌ Cannot reach GitHub', 'error');
                        resolve(false);
                    }
                },
                onerror: function() {
                    showStatus('❌ Network error', 'error');
                    resolve(false);
                }
            });
        });
    }

    // The main CAR Extractor script (from your working version)
    async function initializeCarExtractor() {
        console.log('🚀 Initializing CAR Extractor...');

        // Create left ribbon UI
        function createUI() {
            const ribbon = document.createElement('div');
            ribbon.id = 'car-extractor-ribbon';
            ribbon.innerHTML = `
                <div class="ribbon-header">
                    <span>CAR BATCH EXTRACTOR v2.0</span>
                    <button id="minimize-ribbon-btn" title="Minimize">-</button>
                </div>
                <div id="ribbon-content">
                    <button id="debug-page-btn">debug</button>
                    <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                        <button id="start-extraction-btn">start</button>
                        <button id="pause-extraction-btn" disabled>pause</button>
                        <button id="stop-extraction-btn" disabled>stop</button>
                    </div>
                    <div id="progress-info">Ready to extract CAR data</div>
                    <div id="status-info">Waiting for input...</div>
                    <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                        <button id="export-results-btn" disabled>export</button>
                        <button id="clear-results-btn">clear</button>
                    </div>
                    <div id="car-results"></div>
                </div>
            `;
            document.body.appendChild(ribbon);
            
            // Create minimized state button
            const minimizedBtn = document.createElement('div');
            minimizedBtn.id = 'ribbon-minimized-btn';
            minimizedBtn.innerHTML = '📋';
            minimizedBtn.title = 'Show CAR Extractor';
            minimizedBtn.style.display = 'none';
            document.body.appendChild(minimizedBtn);
            
            // Add event listeners
            document.getElementById('debug-page-btn').addEventListener('click', debugPage);
            document.getElementById('start-extraction-btn').addEventListener('click', startExtraction);
            document.getElementById('pause-extraction-btn').addEventListener('click', pauseExtraction);
            document.getElementById('stop-extraction-btn').addEventListener('click', stopExtraction);
            document.getElementById('export-results-btn').addEventListener('click', exportResults);
            document.getElementById('clear-results-btn').addEventListener('click', clearResults);
            document.getElementById('minimize-ribbon-btn').addEventListener('click', minimizeRibbon);
            document.getElementById('ribbon-minimized-btn').addEventListener('click', maximizeRibbon);
            
            // Create context menu for individual CAR refresh
            createContextMenu();
        }

        // Add CSS for the ribbon
        GM_addStyle(`
            #car-extractor-ribbon {
                position: fixed;
                left: 0;
                top: 0;
                width: 320px;
                height: 100vh;
                background: linear-gradient(180deg, #0d1117 0%, #161b22 50%, #1c2128 100%);
                color: #c9d1d9;
                z-index: 10000;
                box-shadow: 2px 0 10px rgba(0, 0, 0, 0.6);
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                overflow-y: auto;
                padding: 15px;
                border-right: 1px solid #30363d;
            }
            
            #car-extractor-ribbon button {
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 11px;
                font-weight: 500;
                letter-spacing: 0.5px;
                transition: all 0.2s ease;
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(5px);
            }
            
            #car-extractor-ribbon button:hover {
                border-color: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
            
            #debug-page-btn {
                background: rgba(33, 136, 209, 0.15) !important;
                color: #58a6ff !important;
            }
            
            #debug-page-btn:hover {
                background: rgba(33, 136, 209, 0.25) !important;
            }
            
            #start-extraction-btn {
                background: rgba(46, 160, 67, 0.15) !important;
                color: #56d364 !important;
            }
            
            #start-extraction-btn:hover {
                background: rgba(46, 160, 67, 0.25) !important;
            }
            
            #pause-extraction-btn {
                background: rgba(187, 128, 9, 0.15) !important;
                color: #e3b341 !important;
            }
            
            #pause-extraction-btn:hover {
                background: rgba(187, 128, 9, 0.25) !important;
            }
            
            #stop-extraction-btn {
                background: rgba(218, 54, 51, 0.15) !important;
                color: #f85149 !important;
            }
            
            #stop-extraction-btn:hover {
                background: rgba(218, 54, 51, 0.25) !important;
            }
            
            #export-results-btn {
                background: rgba(102, 117, 127, 0.15) !important;
                color: #8b949e !important;
            }
            
            #export-results-btn:hover {
                background: rgba(102, 117, 127, 0.25) !important;
            }
            
            #clear-results-btn {
                background: rgba(240, 126, 37, 0.15) !important;
                color: #ff8c42 !important;
            }
            
            #clear-results-btn:hover {
                background: rgba(240, 126, 37, 0.25) !important;
            }
            
            .car-entry {
                background: rgba(22, 27, 34, 0.6);
                margin-bottom: 6px;
                padding: 8px;
                border-radius: 4px;
                border-left: 2px solid #21262d;
                font-size: 11px;
                line-height: 1.4;
                border: 1px solid rgba(48, 54, 61, 0.5);
                backdrop-filter: blur(3px);
            }
            
            .car-entry.loading {
                border-left-color: #e3b341;
                background: rgba(187, 128, 9, 0.1);
                border-color: rgba(187, 128, 9, 0.3);
            }
            
            .car-entry.error {
                border-left-color: #f85149;
                background: rgba(218, 54, 51, 0.1);
                border-color: rgba(218, 54, 51, 0.3);
            }
            
            .car-entry:hover {
                background: rgba(22, 27, 34, 0.8);
                border-color: rgba(48, 54, 61, 0.8);
            }
            
            .car-id {
                font-weight: bold;
                font-size: 12px;
                margin-bottom: 4px;
                color: #58a6ff;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            }
            
            .car-details {
                color: #8b949e;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            }
            
            .car-details div {
                margin-bottom: 1px;
            }
            
            .car-details strong {
                color: #c9d1d9;
                font-weight: 500;
            }
            
            #progress-info {
                font-size: 11px;
                color: #7d8590;
                min-height: 14px;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                background: rgba(13, 17, 23, 0.5);
                padding: 4px 8px;
                border-radius: 3px;
                border: 1px solid rgba(48, 54, 61, 0.3);
            }
            
            #status-info {
                font-size: 10px;
                color: #656d76;
                min-height: 12px;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                background: rgba(13, 17, 23, 0.3);
                padding: 3px 6px;
                border-radius: 3px;
                font-style: italic;
            }
            
            #car-results {
                margin-top: 10px;
                max-height: 60vh;
                overflow-y: auto;
            }
            
            #car-results::-webkit-scrollbar {
                width: 6px;
            }
            
            #car-results::-webkit-scrollbar-track {
                background: rgba(13, 17, 23, 0.3);
                border-radius: 3px;
            }
            
            #car-results::-webkit-scrollbar-thumb {
                background: rgba(48, 54, 61, 0.6);
                border-radius: 3px;
            }
            
            #car-results::-webkit-scrollbar-thumb:hover {
                background: rgba(48, 54, 61, 0.8);
            }
            
            /* Adjust main content to make space for ribbon */
            body {
                margin-left: 320px !important;
                transition: margin-left 0.3s ease !important;
            }
            
            body.ribbon-minimized {
                margin-left: 0px !important;
            }
            
            /* Add some terminal-like styling */
            .ribbon-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #58a6ff;
                font-weight: 600;
                text-shadow: 0 0 5px rgba(88, 166, 255, 0.3);
                margin-bottom: 15px;
                font-size: 14px;
                border-bottom: 1px solid rgba(48, 54, 61, 0.5);
                padding-bottom: 8px;
            }
            
            #minimize-ribbon-btn {
                background: rgba(88, 166, 255, 0.15) !important;
                color: #58a6ff !important;
                border: 1px solid rgba(88, 166, 255, 0.3) !important;
                border-radius: 3px !important;
                padding: 2px 8px !important;
                font-size: 12px !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
            }
            
            #minimize-ribbon-btn:hover {
                background: rgba(88, 166, 255, 0.25) !important;
                transform: scale(1.05) !important;
            }
            
            #ribbon-minimized-btn {
                position: fixed;
                left: 10px;
                top: 10px;
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
                border: 2px solid #30363d;
                border-radius: 8px;
                color: #58a6ff;
                font-size: 18px;
                cursor: pointer;
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.6);
                transition: all 0.2s ease;
            }
            
            #ribbon-minimized-btn:hover {
                background: linear-gradient(135deg, #161b22 0%, #1c2128 100%);
                border-color: #58a6ff;
                transform: scale(1.1);
                box-shadow: 0 0 15px rgba(88, 166, 255, 0.4);
            }
            
            .car-context-menu {
                position: fixed;
                background: linear-gradient(180deg, #161b22 0%, #1c2128 100%);
                border: 1px solid #30363d;
                border-radius: 6px;
                padding: 4px 0;
                z-index: 10002;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 11px;
                min-width: 120px;
                display: none;
            }
            
            .car-context-menu-item {
                padding: 6px 12px;
                color: #c9d1d9;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .car-context-menu-item:hover {
                background: rgba(88, 166, 255, 0.15);
                color: #58a6ff;
            }
            
            .car-context-menu-item:active {
                background: rgba(88, 166, 255, 0.25);
            }
        `);

        // All the variables and functions from your working script
        let extractionInProgress = false;
        let shouldStop = false;
        let isPaused = false;
        let extractedData = [];
        let currentCarIndex = 0;
        let carLinks = [];
        let selectedCarId = null;

        // Include all your working functions here...
        // (For brevity, I'm showing just the signatures - you'd copy the full implementations)

        function minimizeRibbon() { /* Your implementation */ }
        function maximizeRibbon() { /* Your implementation */ }
        function createContextMenu() { /* Your implementation */ }
        function showContextMenu(event, carId) { /* Your implementation */ }
        function refreshSelectedCar() { /* Your implementation */ }
        function formatTodayForRemarks() {
            try {
                const today = new Date();
                const day = today.getDate().toString().padStart(2, '0');
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const month = months[today.getMonth()];
                return `${day} ${month}`;
            } catch (error) {
                console.log('Error formatting today\'s date:', error);
                return 'Today';
            }
        }
        function findCarLinks() { /* Your implementation */ }
        function extractDataFromCurrentPage() { /* Your implementation */ }
        function handleCarDetailsWindow() { /* Your implementation */ }
        function processCarLink(carLink, index, total, isRefresh = false) { /* Your implementation */ }
        function addCarEntry(carId, data, isLoading = false) { /* Your implementation */ }
        function updateCarEntry(carId, data) { /* Your implementation */ }
        function updateStatus(message) { /* Your implementation */ }
        function updateProgress(current, total) { /* Your implementation */ }
        function startExtraction() { /* Your implementation */ }
        function pauseExtraction() { /* Your implementation */ }
        function stopExtraction() { /* Your implementation */ }
        function updateButtonStates(state) { /* Your implementation */ }
        function clearResults() { /* Your implementation */ }
        function debugPage() { /* Your implementation */ }
        function exportResults() { /* Your implementation */ }

        // Initialize the UI
        createUI();
        updateButtonStates('idle');
    }

    // Main initialization - check access first, then load the CAR extractor
    async function initialize() {
        console.log('🔐 CAR Extractor - Access Control Check');

        // Skip access check for popup windows
        if (window.location.href.includes('#!/details') && window.opener) {
            // This is a popup window for data extraction - let it proceed
            return;
        }

        // Check if we're on the main reporting page
        if (window.location.href.includes('/Reporting/ReportingManagement')) {
            const hasAccess = await checkAccess();
            if (hasAccess) {
                setTimeout(initializeCarExtractor, 2000);
            }
        }
    }

    // Start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
