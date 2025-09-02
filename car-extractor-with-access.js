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

        // All the variables from the working script
        let isExtracting = false;
        let isPaused = false;
        let extractedData = [];
        let extractedCarNumbers = new Set();
        let currentIndex = 0;
        let carLinks = [];
        let selectedCarId = null;

        // Include all your working functions here...
        // (For brevity, I'm showing just the signatures - you'd copy the full implementations)

        // Function to minimize the ribbon
        function minimizeRibbon() {
            const ribbon = document.getElementById('car-extractor-ribbon');
            const minimizedBtn = document.getElementById('ribbon-minimized-btn');
            const body = document.body;
            
            if (ribbon && minimizedBtn) {
                ribbon.style.display = 'none';
                minimizedBtn.style.display = 'flex';
                body.classList.add('ribbon-minimized');
            }
        }

        // Function to maximize the ribbon
        function maximizeRibbon() {
            const ribbon = document.getElementById('car-extractor-ribbon');
            const minimizedBtn = document.getElementById('ribbon-minimized-btn');
            const body = document.body;
            
            if (ribbon && minimizedBtn) {
                ribbon.style.display = 'block';
                minimizedBtn.style.display = 'none';
                body.classList.remove('ribbon-minimized');
            }
        }

        // Function to create context menu for individual CAR refresh
        function createContextMenu() {
            const contextMenu = document.createElement('div');
            contextMenu.id = 'car-context-menu';
            contextMenu.className = 'car-context-menu';
            contextMenu.innerHTML = `
                <div class="car-context-menu-item" id="refresh-car-item">🔄 Refresh CAR</div>
            `;
            document.body.appendChild(contextMenu);
            
            // Add click listener for refresh action
            document.getElementById('refresh-car-item').addEventListener('click', refreshSelectedCar);
            
            // Hide context menu when clicking elsewhere
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.car-context-menu')) {
                    contextMenu.style.display = 'none';
                }
            });
            
            // Prevent default context menu on the ribbon
            document.addEventListener('contextmenu', (e) => {
                if (e.target.closest('#car-extractor-ribbon')) {
                    e.preventDefault();
                }
            });
        }

        // Function to show context menu for a CAR entry
        function showContextMenu(event, carId) {
            event.preventDefault();
            event.stopPropagation();
            
            selectedCarId = carId;
            const contextMenu = document.getElementById('car-context-menu');
            
            if (contextMenu) {
                contextMenu.style.display = 'block';
                contextMenu.style.left = event.pageX + 'px';
                contextMenu.style.top = event.pageY + 'px';
            }
        }

        // Function to refresh a specific CAR
        async function refreshSelectedCar() {
            if (!selectedCarId) return;
            
            const contextMenu = document.getElementById('car-context-menu');
            if (contextMenu) {
                contextMenu.style.display = 'none';
            }
            
            console.log(`🔄 Refreshing CAR: ${selectedCarId}`);
            updateStatus(`Refreshing ${selectedCarId}...`);
            
            // Find the CAR link from our stored links
            const carLink = carLinks.find(link => link.carId === selectedCarId);
            if (!carLink) {
                console.error(`CAR link not found for ${selectedCarId}`);
                updateStatus(`❌ Could not find link for ${selectedCarId}`);
                return;
            }
            
            // Update the entry to show loading state
            const entryDiv = document.getElementById(`car-entry-${selectedCarId}`);
            if (entryDiv) {
                entryDiv.className = 'car-entry loading';
                entryDiv.innerHTML = `
                    <div class="car-id">${selectedCarId}</div>
                    <div class="car-details">Refreshing...</div>
                `;
            }
            
            try {
                // Process the single CAR
                await processCarLink(carLink, 0, 1, true); // Pass true for refresh mode
                updateStatus(`✅ Refreshed ${selectedCarId}`);
            } catch (error) {
                console.error('Error refreshing CAR:', error);
                updateStatus(`❌ Failed to refresh ${selectedCarId}`);
                
                // Update entry with error
                if (entryDiv) {
                    entryDiv.className = 'car-entry error';
                    entryDiv.innerHTML = `
                        <div class="car-id">${selectedCarId}</div>
                        <div class="car-details" style="color: #fca5a5;">Error: Failed to refresh</div>
                    `;
                }
            }
            
            selectedCarId = null;
        }
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
        // Function to start extraction
        async function startExtraction() {
            if (isExtracting) {
                console.log('🛑 Extraction already in progress');
                return;
            }

            isExtracting = true;
            isPaused = false;
            currentIndex = 0;
            extractedData = [];
            extractedCarNumbers = new Set();
            
            const startBtn = document.getElementById('start-extraction-btn');
            const pauseBtn = document.getElementById('pause-extraction-btn');
            const stopBtn = document.getElementById('stop-extraction-btn');
            
            if (startBtn) startBtn.disabled = true;
            if (pauseBtn) pauseBtn.disabled = false;
            if (stopBtn) stopBtn.disabled = false;
            
            // Clear existing entries and show loading
            updateCarDisplay([]);
            updateStatus('🔍 Scanning for CAR links...');
            updateProgress(0, 0);
            
            try {
                // Find all CAR links on the page
                carLinks = findCarLinks();
                console.log(`🎯 Found ${carLinks.length} CAR links`);
                
                if (carLinks.length === 0) {
                    throw new Error('No CAR links found on this page');
                }
                
                updateStatus(`✅ Found ${carLinks.length} CARs. Starting extraction...`);
                updateProgress(0, carLinks.length);
                
                // Process each CAR link
                for (let i = 0; i < carLinks.length && isExtracting; i++) {
                    currentIndex = i;
                    
                    // Wait if paused
                    while (isPaused && isExtracting) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    
                    if (!isExtracting) break;
                    
                    const carLink = carLinks[i];
                    updateStatus(`📋 Processing ${carLink.carId} (${i + 1}/${carLinks.length})`);
                    
                    try {
                        await processCarLink(carLink, i, carLinks.length);
                    } catch (error) {
                        console.error(`❌ Error processing ${carLink.carId}:`, error);
                        // Continue with next CAR even if one fails
                    }
                    
                    // Small delay between requests to be nice to the server
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                if (isExtracting) {
                    updateStatus(`✅ Extraction completed! Found ${extractedData.length} CARs`);
                } else {
                    updateStatus(`⏹️ Extraction stopped by user`);
                }
                
            } catch (error) {
                console.error('❌ Extraction error:', error);
                updateStatus(`❌ Error: ${error.message}`);
            } finally {
                isExtracting = false;
                isPaused = false;
                
                // Reset button states
                if (startBtn) startBtn.disabled = false;
                if (pauseBtn) pauseBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = true;
            }
        }

        // Function to pause extraction
        function pauseExtraction() {
            if (!isExtracting) return;
            
            isPaused = !isPaused;
            const pauseBtn = document.getElementById('pause-extraction-btn');
            
            if (isPaused) {
                updateStatus('⏸️ Extraction paused');
                if (pauseBtn) pauseBtn.textContent = '▶️ Resume';
            } else {
                updateStatus('▶️ Extraction resumed');
                if (pauseBtn) pauseBtn.textContent = '⏸️ Pause';
            }
        }

        // Function to stop extraction
        function stopExtraction() {
            if (!isExtracting) return;
            
            isExtracting = false;
            isPaused = false;
            
            const startBtn = document.getElementById('start-extraction-btn');
            const pauseBtn = document.getElementById('pause-extraction-btn');
            const stopBtn = document.getElementById('stop-extraction-btn');
            
            if (startBtn) startBtn.disabled = false;
            if (pauseBtn) {
                pauseBtn.disabled = true;
                pauseBtn.textContent = '⏸️ Pause';
            }
            if (stopBtn) stopBtn.disabled = true;
            
            updateStatus('⏹️ Extraction stopped');
        }
        // Function to export data to CSV
        function exportResults() {
            if (extractedData.length === 0) {
                alert('❌ No data to export. Please run extraction first.');
                return;
            }

            console.log('📄 Exporting to CSV...');
            
            // Create CSV header
            const headers = ['CAR no', 'Raised Date', 'Stage Owner', 'Target Date', 'Status', 'Remarks'];
            let csvContent = headers.join(',') + '\n';
            
            // Add data rows
            extractedData.forEach(car => {
                const row = [
                    car.carId || '',
                    car.raisedDate || '',
                    car.stageOwner || '',
                    car.targetDate || '',
                    car.status || '',
                    (car.remarks || '').replace(/"/g, '""') // Escape quotes in remarks
                ].map(field => `"${field}"`).join(',');
                csvContent += row + '\n';
            });
            
            // Create and trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `HAESL_CAR_Data_${new Date().toISOString().slice(0, 10)}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                updateStatus(`✅ Exported ${extractedData.length} CARs to CSV`);
                console.log('✅ CSV export completed');
            } else {
                console.error('❌ Browser does not support CSV download');
                updateStatus('❌ CSV export not supported in this browser');
            }
        }

        // Function to update button states
        function updateButtonStates(state) {
            const startBtn = document.getElementById('start-extraction-btn');
            const pauseBtn = document.getElementById('pause-extraction-btn');
            const stopBtn = document.getElementById('stop-extraction-btn');
            const exportBtn = document.getElementById('export-results-btn');
            const clearBtn = document.getElementById('clear-results-btn');
            
            switch (state) {
                case 'idle':
                    if (startBtn) startBtn.disabled = false;
                    if (pauseBtn) pauseBtn.disabled = true;
                    if (stopBtn) stopBtn.disabled = true;
                    if (exportBtn) exportBtn.disabled = extractedData.length === 0;
                    if (clearBtn) clearBtn.disabled = extractedData.length === 0;
                    break;
                case 'extracting':
                    if (startBtn) startBtn.disabled = true;
                    if (pauseBtn) pauseBtn.disabled = false;
                    if (stopBtn) stopBtn.disabled = false;
                    if (exportBtn) exportBtn.disabled = true;
                    if (clearBtn) clearBtn.disabled = true;
                    break;
                case 'paused':
                    if (startBtn) startBtn.disabled = true;
                    if (pauseBtn) pauseBtn.disabled = false;
                    if (stopBtn) stopBtn.disabled = false;
                    if (exportBtn) exportBtn.disabled = true;
                    if (clearBtn) clearBtn.disabled = true;
                    break;
            }
        }

        // Function to clear all results
        function clearResults() {
            extractedData = [];
            extractedCarNumbers.clear();
            updateCarDisplay([]);
            updateStatus('🧹 Results cleared');
            updateProgress(0, 0);
            updateButtonStates('idle');
        }

        // Function to debug page information
        function debugPage() {
            console.log('🔍 CAR Extractor Debug Information:');
            console.log('Current URL:', window.location.href);
            console.log('Page Title:', document.title);
            console.log('Extracted Data Count:', extractedData.length);
            console.log('CAR Links Found:', carLinks.length);
            console.log('Is Extracting:', isExtracting);
            console.log('Is Paused:', isPaused);
            console.log('Current Index:', currentIndex);
            
            // Look for CAR table elements
            const tables = document.querySelectorAll('table');
            console.log('Tables on page:', tables.length);
            
            const carElements = document.querySelectorAll('a[href*="CAR"]');
            console.log('Elements with CAR in href:', carElements.length);
            
            // Show current extracted data
            if (extractedData.length > 0) {
                console.log('Sample extracted data:', extractedData[0]);
            }
            
            updateStatus(`🔍 Debug info logged to console`);
        }

        // Function to find all CAR links on the current page
        function findCarLinks() {
            console.log('Starting to find CAR links...');
            
            // Look for CAR number links in the table
            const links = [];
            
            // Method 1: Find CAR number links directly
            console.log('Method 1: Looking for CAR number links...');
            const carLinks = Array.from(document.querySelectorAll('a'))
                .filter(link => {
                    const text = link.textContent.trim();
                    const isCarLink = /^CAR-\d+$/.test(text);
                    console.log(`Link text: "${text}", matches CAR pattern: ${isCarLink}, href: ${link.href}`);
                    return isCarLink;
                });
            
            console.log(`Found ${carLinks.length} CAR number links`);
            
            carLinks.forEach((link, index) => {
                const carId = link.textContent.trim();
                console.log(`CAR link ${index + 1}: ${carId} -> ${link.href}`);
                
                links.push({
                    carId: carId,
                    url: link.href,
                    element: link,
                    method: 'car-number-link'
                });
            });
            
            // Method 2: Look in table cells for CAR patterns
            console.log('Method 2: Looking in table cells...');
            const tableCells = document.querySelectorAll('td, th');
            console.log(`Found ${tableCells.length} table cells to check`);
            
            tableCells.forEach((cell, index) => {
                const cellText = cell.textContent.trim();
                const carMatch = cellText.match(/^CAR-\d+$/);
                if (carMatch) {
                    console.log(`Cell ${index}: Found CAR ${carMatch[0]}`);
                    
                    // Look for links within this cell
                    const cellLinks = cell.querySelectorAll('a');
                    if (cellLinks.length > 0) {
                        const link = cellLinks[0];
                        const carId = carMatch[0];
                        
                        if (!links.find(l => l.carId === carId)) {
                            console.log(`  Adding link: ${link.href}`);
                            links.push({
                                carId: carId,
                                url: link.href,
                                element: link,
                                method: 'table-cell'
                            });
                        }
                    }
                }
            });
            
            console.log(`Total unique CAR links found: ${links.length}`);
            links.forEach((link, index) => {
                console.log(`${index + 1}. ${link.carId} - ${link.url} (method: ${link.method})`);
            });
            
            return links;
        }

        // Function to process a single CAR link
        async function processCarLink(carLink, index, total, isRefresh = false) {
            return new Promise((resolve, reject) => {
                console.log(`🔗 Opening CAR: ${carLink.carId}`);
                
                // Create a window to handle the CAR details
                const popup = window.open(carLink.url, '_blank', 'width=1000,height=800');
                
                let timeoutId;
                let attempts = 0;
                const maxAttempts = 30; // 30 seconds timeout
                
                const checkPopup = () => {
                    attempts++;
                    
                    if (popup.closed) {
                        clearTimeout(timeoutId);
                        reject(new Error(`Popup was closed for ${carLink.carId}`));
                        return;
                    }
                    
                    if (attempts >= maxAttempts) {
                        clearTimeout(timeoutId);
                        popup.close();
                        reject(new Error(`Timeout waiting for data from ${carLink.carId}`));
                        return;
                    }
                    
                    try {
                        // Check if popup has loaded and try to get data
                        if (popup.document && popup.document.readyState === 'complete') {
                            // Wait a bit more for AJAX content to load
                            setTimeout(() => {
                                try {
                                    // Try to extract data
                                    const carData = popup.extractDataFromCurrentPage ? 
                                        popup.extractDataFromCurrentPage() : 
                                        extractDataFromPopup(popup);
                                    
                                    if (carData && carData.carId) {
                                        console.log(`✅ Got data for ${carData.carId}:`, carData);
                                        
                                        // Update extracted data
                                        const existingIndex = extractedData.findIndex(car => car.carId === carData.carId);
                                        if (existingIndex >= 0) {
                                            extractedData[existingIndex] = carData;
                                        } else {
                                            extractedData.push(carData);
                                        }
                                        
                                        extractedCarNumbers.add(carData.carId);
                                        
                                        // Update display
                                        updateCarDisplay(extractedData);
                                        updateProgress(isRefresh ? total : index + 1, total);
                                        
                                        popup.close();
                                        clearTimeout(timeoutId);
                                        resolve(carData);
                                    } else {
                                        // Continue checking
                                        timeoutId = setTimeout(checkPopup, 1000);
                                    }
                                } catch (error) {
                                    console.log('Extraction attempt failed, retrying...', error);
                                    timeoutId = setTimeout(checkPopup, 1000);
                                }
                            }, 2000); // Wait 2 seconds for content to load
                        } else {
                            timeoutId = setTimeout(checkPopup, 1000);
                        }
                    } catch (error) {
                        console.log('Popup check failed, retrying...', error);
                        timeoutId = setTimeout(checkPopup, 1000);
                    }
                };
                
                // Start checking after popup loads
                setTimeout(checkPopup, 2000);
            });
        }

        // Function to extract data from popup window
        function extractDataFromPopup(popup) {
            const data = {
                carId: '',
                raisedDate: '',
                stageOwner: '',
                targetDate: '',
                status: '',
                remarks: '',
                error: null
            };

            try {
                // Get CAR ID from URL or page
                const urlMatch = popup.location.href.match(/\/([A-Fa-f0-9-]+)#!/);
                if (urlMatch) {
                    const pageText = popup.document.body.textContent;
                    const carMatch = pageText.match(/CAR-\d+/);
                    if (carMatch) {
                        data.carId = carMatch[0];
                    }
                }

                // Extract various fields from the popup document
                const doc = popup.document;
                
                // Look for raised date
                const labels = doc.querySelectorAll('div.details-label, .g-label, label');
                labels.forEach(label => {
                    const labelText = (label.textContent || label.innerText).trim().toLowerCase();
                    if (labelText.includes('raised date')) {
                        let valueElement = label.nextElementSibling;
                        if (valueElement) {
                            const dateMatch = valueElement.textContent.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
                            if (dateMatch) {
                                data.raisedDate = dateMatch[0];
                            }
                        }
                    }
                });

                // Extract other fields...
                // This is a simplified version - the full version would be much longer

                return data;
            } catch (error) {
                console.error('Error extracting data from popup:', error);
                data.error = error.message;
                return data;
            }
        }

        // Helper functions for UI updates
        function updateStatus(message) {
            const statusElement = document.getElementById('status-info');
            if (statusElement) {
                statusElement.textContent = message;
                console.log('Status:', message);
            }
        }

        function updateProgress(current, total) {
            const progressElement = document.getElementById('progress-info');
            if (progressElement) {
                progressElement.textContent = total > 0 ? `${current}/${total}` : '';
            }
        }

        function updateCarDisplay(cars) {
            const resultsContainer = document.getElementById('car-results');
            if (!resultsContainer) return;

            resultsContainer.innerHTML = '';

            cars.forEach(car => {
                const entryDiv = document.createElement('div');
                entryDiv.id = `car-entry-${car.carId}`;
                entryDiv.className = 'car-entry';
                
                // Add right-click event for context menu
                entryDiv.addEventListener('contextmenu', (e) => showContextMenu(e, car.carId));
                
                entryDiv.innerHTML = `
                    <div class="car-id">${car.carId}</div>
                    <div class="car-details">
                        <div><strong>Raised:</strong> ${car.raisedDate || 'N/A'}</div>
                        <div><strong>Owner:</strong> ${car.stageOwner || 'N/A'}</div>
                        <div><strong>Target:</strong> ${car.targetDate || 'N/A'}</div>
                        <div><strong>Status:</strong> ${car.status || 'N/A'}</div>
                        ${car.remarks ? `<div><strong>Remarks:</strong> ${car.remarks}</div>` : ''}
                    </div>
                `;
                
                resultsContainer.appendChild(entryDiv);
            });
        }

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
