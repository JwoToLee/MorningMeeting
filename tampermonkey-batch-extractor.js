// ==UserScript==
// @name         HAESL CAR Batch Extractor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Loop through all CARs in the report listing and extract data to display in a left ribbon
// @author       You
// @match        https://haesl.gaelenlighten.com/Reporting/ReportingManagement*
// @match        https://haesl.gaelenlighten.com/Reporting/Report/Index/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

        // Create left ribbon UI
    function createUI() {
        const ribbon = document.createElement('div');
        ribbon.id = 'car-extractor-ribbon';
        ribbon.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px;">CAR Batch Extractor</div>
            <button id="debug-page-btn" style="width: 100%; margin-bottom: 10px; padding: 8px; background: #007ACC; color: white; border: none; border-radius: 4px; cursor: pointer;">Debug Page</button>
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <button id="start-extraction-btn" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Start</button>
                <button id="pause-extraction-btn" style="flex: 1; padding: 8px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer;" disabled>Pause</button>
                <button id="stop-extraction-btn" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;" disabled>Stop</button>
            </div>
            <div id="progress-info" style="margin-bottom: 10px; font-size: 12px; color: #e5e7eb;">Ready to extract CAR data</div>
            <div id="status-info" style="margin-bottom: 10px; font-size: 11px; color: #cbd5e1;"></div>
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <button id="export-results-btn" style="flex: 1; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;" disabled>Export CSV</button>
                <button id="clear-results-btn" style="flex: 1; padding: 8px; background: #fd7e14; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear</button>
            </div>
            <div id="car-results"></div>
        `;
        document.body.appendChild(ribbon);
        
        // Add event listeners
        document.getElementById('debug-page-btn').addEventListener('click', debugPage);
        document.getElementById('start-extraction-btn').addEventListener('click', startExtraction);
        document.getElementById('pause-extraction-btn').addEventListener('click', pauseExtraction);
        document.getElementById('stop-extraction-btn').addEventListener('click', stopExtraction);
        document.getElementById('export-results-btn').addEventListener('click', exportResults);
        document.getElementById('clear-results-btn').addEventListener('click', clearResults);
    }

    // Add CSS for the ribbon
    GM_addStyle(`
        #car-extractor-ribbon {
            position: fixed;
            left: 0;
            top: 0;
            width: 300px;
            height: 100vh;
            background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%);
            color: white;
            z-index: 10000;
            box-shadow: 3px 0 15px rgba(0, 0, 0, 0.3);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            overflow-y: auto;
            padding: 15px;
        }
        
        .car-entry {
            background: rgba(255, 255, 255, 0.1);
            margin-bottom: 8px;
            padding: 10px;
            border-radius: 6px;
            border-left: 4px solid #10b981;
            font-size: 12px;
            line-height: 1.3;
        }
        
        .car-entry.loading {
            border-left-color: #f59e0b;
            background: rgba(245, 158, 11, 0.1);
        }
        
        .car-entry.error {
            border-left-color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
        }
        
        .car-id {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 4px;
            color: #fbbf24;
        }
        
        .car-details {
            color: #e5e7eb;
        }
        
        .car-details div {
            margin-bottom: 2px;
        }
        
        #progress-info {
            font-size: 12px;
            color: #e5e7eb;
            min-height: 16px;
        }
        
        #status-info {
            font-size: 11px;
            color: #cbd5e1;
            min-height: 14px;
        }
        
        #car-results {
            margin-top: 10px;
            max-height: 60vh;
            overflow-y: auto;
        }
        
        /* Adjust main content to make space for ribbon */
        body {
            margin-left: 300px !important;
        }
    `);

    let extractionInProgress = false;
    let shouldStop = false;
    let isPaused = false;
    let extractedData = [];
    let currentCarIndex = 0;
    let carLinks = [];

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

    // Function to extract data from the current CAR details page
    function extractDataFromCurrentPage() {
        console.log('Starting data extraction from current page...');
        
        const data = {
            carId: '',
            raisedDate: '',
            stageOwner: '',
            targetDate: '',
            status: '',
            error: null
        };

        try {
            // Try to get CAR ID from URL or page
            console.log('Extracting CAR ID...');
            const urlMatch = window.location.href.match(/\/([A-Fa-f0-9-]+)#!/);
            if (urlMatch) {
                // Look for CAR ID on the page
                const pageText = document.body.textContent;
                const carMatch = pageText.match(/CAR-\d+/);
                if (carMatch) {
                    data.carId = carMatch[0];
                    console.log('Found CAR ID:', data.carId);
                }
            }

            // Extract Raised Date
            console.log('Extracting raised date...');
            const allLabels = document.querySelectorAll('div.details-label, .g-label, label');
            console.log(`Found ${allLabels.length} label elements`);
            
            allLabels.forEach((label, index) => {
                const labelText = (label.textContent || label.innerText).trim().toLowerCase();
                if (labelText.includes('raised date') || labelText === 'raised date:') {
                    console.log(`Found raised date label at index ${index}:`, labelText);
                    let valueElement = label.nextElementSibling;
                    if (!valueElement) {
                        valueElement = label.parentElement.querySelector('.staticText, .g-value');
                    }
                    if (!valueElement && label.parentElement) {
                        const parentText = label.parentElement.textContent;
                        const dateMatch = parentText.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
                        if (dateMatch) {
                            data.raisedDate = dateMatch[0];
                            console.log('Found raised date from parent:', data.raisedDate);
                        }
                    } else if (valueElement) {
                        const dateMatch = valueElement.textContent.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
                        if (dateMatch) {
                            data.raisedDate = dateMatch[0];
                            console.log('Found raised date from value element:', data.raisedDate);
                        }
                    }
                }
            });

            // Extract stage information
            console.log('Extracting stage information...');
            const stages = document.querySelectorAll("li.stage-li");
            console.log(`Found ${stages.length} stage elements`);
            
            let investigationCompleted = false;
            let investigationData = {};
            let qaData = {};

            stages.forEach((stage, stageIndex) => {
                console.log(`Processing stage ${stageIndex}...`);
                
                function findSiblingData(labelText) {
                    const label = Array.from(stage.querySelectorAll('div.details-label'))
                        .find(el => el.textContent.trim() === labelText);
                    if (label && label.nextElementSibling) {
                        const staticText = label.nextElementSibling.querySelector('.staticText');
                        return staticText ? staticText.textContent.trim() : label.nextElementSibling.textContent.trim();
                    }
                    return null;
                }

                function findStaticTextData(labelText) {
                    const label = Array.from(stage.querySelectorAll('div.details-label'))
                        .find(el => el.textContent.trim() === labelText);
                    if (label && label.nextElementSibling) {
                        const staticTextContainer = label.nextElementSibling.querySelector('.staticTextContainer');
                        return staticTextContainer ? staticTextContainer.textContent.trim() : null;
                    }
                    return null;
                }

                const stageText = stage.textContent || stage.innerText;
                const lowerStageText = stageText.toLowerCase();
                console.log(`Stage ${stageIndex} text contains:`, lowerStageText.substring(0, 100));

                if (lowerStageText.includes('investigation')) {
                    console.log('Found investigation stage');
                    const owner = findSiblingData("Stage Owner:");
                    const targetDate = findStaticTextData("Target Date");
                    const completedDate = findSiblingData("Completed date");
                    const status = findSiblingData("Status:");

                    investigationData = {
                        owner: owner ? owner.replace(/Cancel|Save/g, '').trim() : '',
                        targetDate: targetDate ? targetDate.replace(/Cancel|Save/g, '').trim() : 
                                   (completedDate ? completedDate.replace(/Cancel|Save/g, '').trim() : ''),
                        status: status ? status.replace(/Cancel|Save/g, '').trim() : ''
                    };
                    
                    console.log('Investigation data:', investigationData);

                    if (completedDate || (status && status.toLowerCase().includes('complete'))) {
                        investigationCompleted = true;
                        console.log('Investigation marked as completed');
                    }
                }

                if (lowerStageText.includes('qa') && lowerStageText.includes('follow')) {
                    console.log('Found QA follow-up stage');
                    const owner = findSiblingData("Stage Owner:");
                    const targetDate = findStaticTextData("Target Date");
                    const completedDate = findSiblingData("Completed date");
                    const status = findSiblingData("Status:");

                    qaData = {
                        owner: owner ? owner.replace(/Cancel|Save/g, '').trim() : '',
                        targetDate: targetDate ? targetDate.replace(/Cancel|Save/g, '').trim() : 
                                   (completedDate ? completedDate.replace(/Cancel|Save/g, '').trim() : ''),
                        status: status ? status.replace(/Cancel|Save/g, '').trim() : ''
                    };
                    
                    console.log('QA data:', qaData);
                }
            });

            // Determine which stage to show
            console.log('Determining which stage to show...');
            console.log('Investigation completed:', investigationCompleted);
            console.log('QA data available:', !!qaData.owner);
            
            if (investigationCompleted && qaData.owner) {
                data.stageOwner = qaData.owner;
                data.targetDate = qaData.targetDate;
                data.status = qaData.status || 'QA Follow-up';
                console.log('Using QA data');
            } else if (investigationData.owner) {
                data.stageOwner = investigationData.owner;
                data.targetDate = investigationData.targetDate;
                data.status = investigationData.status || 'Investigation';
                console.log('Using Investigation data');
            }

            console.log('Final extracted data:', data);

        } catch (error) {
            console.error('Error during data extraction:', error);
            data.error = error.message;
        }

        return data;
    }

    // Function to handle data extraction in a CAR details window
    function handleCarDetailsWindow() {
        console.log('🔍 CAR details window loaded, checking for extraction task...');
        console.log('Window name:', window.name);
        
        // Try to find the extraction task that matches this window
        const allKeys = Object.keys(sessionStorage);
        const extractionKeys = allKeys.filter(key => key.startsWith('carExtraction_'));
        
        console.log('Available extraction keys:', extractionKeys);
        
        if (extractionKeys.length === 0) {
            console.log('❌ No extraction task found for this window');
            console.log('All sessionStorage keys:', allKeys);
            return;
        }
        
        // Find the most recent extraction task or one that matches the window name
        let extractionInfo = null;
        let extractionKey = null;
        
        if (window.name && window.name.includes('car_window_')) {
            // Try to match by window name
            const windowId = window.name.replace('car_window_', '');
            extractionKey = `carExtraction_${windowId}`;
            if (sessionStorage.getItem(extractionKey)) {
                extractionInfo = JSON.parse(sessionStorage.getItem(extractionKey));
                console.log('✅ Found extraction task by window name:', extractionInfo);
            }
        }
        
        // If not found by window name, use the first available one
        if (!extractionInfo && extractionKeys.length > 0) {
            extractionKey = extractionKeys[0];
            extractionInfo = JSON.parse(sessionStorage.getItem(extractionKey));
            console.log('📋 Using first available extraction task:', extractionInfo);
        }
        
        if (!extractionInfo) {
            console.log('❌ Could not find valid extraction info');
            return;
        }
        
        // Mark this extraction as being processed to avoid conflicts
        extractionInfo.processing = true;
        sessionStorage.setItem(extractionKey, JSON.stringify(extractionInfo));
        
        // Wait for page to load completely, then extract data
        setTimeout(() => {
            console.log(`🚀 Extracting data for ${extractionInfo.carId} (${extractionInfo.extractionId})...`);
            console.log('Current page title:', document.title);
            console.log('Page fully loaded, checking for stage elements...');
            
            // Check if stage elements exist
            const stages = document.querySelectorAll("li.stage-li");
            console.log(`Found ${stages.length} stage elements`);
            
            const carData = extractDataFromCurrentPage();
            carData.carId = extractionInfo.carId; // Ensure correct CAR ID
            
            console.log(`📊 Extracted data for ${extractionInfo.carId}:`, carData);
            
            // Send data back to parent window
            if (window.opener && !window.opener.closed) {
                console.log('📤 Sending data to parent window...');
                window.opener.postMessage({
                    type: 'CAR_DATA_EXTRACTED',
                    extractionId: extractionInfo.extractionId,
                    carData: carData
                }, '*');
                
                console.log('✅ Data sent to parent window');
                
                // Clean up this extraction task immediately
                sessionStorage.removeItem(extractionKey);
                
                // Close the window after a brief delay
                setTimeout(() => {
                    console.log('🔚 Closing popup window...');
                    window.close();
                }, 1000);
            } else {
                console.error('❌ Parent window not available');
                sessionStorage.removeItem(extractionKey);
                window.close();
            }
            
        }, 5000); // Wait 5 seconds for page to fully load
    }

    // Initialize the UI when the page loads
    function init() {
        console.log('Initializing CAR Batch Extractor...');
        console.log('Current URL:', window.location.href);
        
        // Check if we're on a CAR details page (has #!/details)
        if (window.location.href.includes('#!/details')) {
            console.log('Detected CAR details page');
            
            // Check if this is a popup window for data extraction
            if (window.opener) {
                console.log('This is a popup window, handling data extraction...');
                handleCarDetailsWindow();
                return;
            } else {
                console.log('This is not a popup window, skipping extraction');
                return;
            }
        }
        
        // Check if we're on the main CAR list page
        if (window.location.href.includes('/Reporting/ReportingManagement')) {
            console.log('Detected CAR list page');
            
            // Wait for the page to be fully loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        createUI();
                    }, 1000);
                });
            } else {
                setTimeout(() => {
                    createUI();
                }, 1000);
            }
        }
    }    // Function to continue extraction after returning from a CAR details page
    function continueExtraction() {
        if (sessionStorage.getItem('extractionInProgress') !== 'true') return;
        
        console.log('Continuing extraction after navigation...');
        
        // Restore extracted data
        extractedData = JSON.parse(sessionStorage.getItem('extractedData') || '[]');
        
        // Recreate the UI if it doesn't exist
        if (!document.getElementById('car-extractor-ribbon')) {
            createUI();
        }
        
        // Update the ribbon with extracted data
        extractedData.forEach(data => {
            addCarEntry(data.carId, data);
        });
        
        // Continue with next CAR or finish
        setTimeout(() => {
            const carLinks = findCarLinks();
            const nextIndex = extractedData.length;
            
            if (nextIndex < carLinks.length) {
                updateStatus(`Continuing extraction... ${nextIndex + 1}/${carLinks.length}`);
                processCarLink(carLinks[nextIndex], nextIndex, carLinks.length);
            } else {
                // Extraction complete
                updateStatus(`🎉 Extraction complete! Processed ${extractedData.length} CARs`);
                console.log('=== EXTRACTION COMPLETE ===');
                
                const exportBtn = document.getElementById('export-results-btn');
                if (exportBtn) exportBtn.disabled = false;
                
                // Clear session storage
                sessionStorage.removeItem('extractionInProgress');
                sessionStorage.removeItem('extractedData');
                
                extractionInProgress = false;
                const startBtn = document.getElementById('start-extraction-btn');
                if (startBtn) startBtn.disabled = false;
            }
        }, 1000);
    }

    // Function to process a single CAR by opening it in a new window
    async function processCarLink(carLink, index, total) {
        return new Promise((resolve) => {
            updateStatus(`Opening ${carLink.carId} (${index + 1}/${total}) in new window...`);
            
            // Add loading entry to ribbon
            addCarEntry(carLink.carId, null, true);
            
            console.log(`Opening ${carLink.carId} in new window: ${carLink.url}`);
            
            // Create a unique identifier for this extraction using more specificity
            const extractionId = `${Date.now()}_${index}_${carLink.carId.replace(/[^a-zA-Z0-9]/g, '')}`;
            
            // Store extraction info that the new window can access
            sessionStorage.setItem(`carExtraction_${extractionId}`, JSON.stringify({
                carId: carLink.carId,
                index: index,
                total: total,
                extractionId: extractionId
            }));
            
            // Open the CAR details page in a new window with unique window name
            const detailsUrl = carLink.url + '#!/details';
            const windowName = `car_window_${extractionId}`;
            const newWindow = window.open(detailsUrl, windowName, 'width=1200,height=800');
            
            let resolved = false; // Flag to prevent multiple resolutions
            
            // Set up a message listener to receive data from the new window
            const messageHandler = (event) => {
                // More specific check for this exact extraction
                if (event.data && 
                    event.data.type === 'CAR_DATA_EXTRACTED' && 
                    event.data.extractionId === extractionId &&
                    !resolved) {
                    
                    resolved = true; // Mark as resolved to prevent duplicates
                    
                    console.log(`✅ Received data for ${carLink.carId} (${extractionId}):`, event.data.carData);
                    
                    // Immediately store the data in the main window
                    const receivedData = event.data.carData;
                    extractedData.push(receivedData);
                    
                    // Update the ribbon with extracted data
                    updateCarEntry(carLink.carId, receivedData);
                    updateProgress(index + 1, total);
                    
                    // Clean up the message listener first
                    window.removeEventListener('message', messageHandler);
                    
                    // Immediate cleanup and resolution
                    sessionStorage.removeItem(`carExtraction_${extractionId}`);
                    
                    // Close the new window
                    if (newWindow && !newWindow.closed) {
                        newWindow.close();
                    }
                    
                    // Resolve immediately
                    resolve();
                }
            };
            
            window.addEventListener('message', messageHandler);
            
            // Set up a timeout in case the new window doesn't respond
            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.log(`⏰ Timeout reached for ${carLink.carId} (${extractionId})`);
                    
                    if (newWindow && !newWindow.closed) {
                        newWindow.close();
                    }
                    window.removeEventListener('message', messageHandler);
                    sessionStorage.removeItem(`carExtraction_${extractionId}`);
                    
                    // Add error entry if we didn't get data
                    const errorData = {
                        carId: carLink.carId,
                        error: 'Timeout - window did not respond'
                    };
                    updateCarEntry(carLink.carId, errorData);
                    extractedData.push(errorData);
                    
                    resolve();
                }
            }, 20000); // Increased to 20 second timeout
            
            // Also listen for window close events to clean up
            const checkWindowClosed = setInterval(() => {
                if (newWindow.closed && !resolved) {
                    resolved = true;
                    clearInterval(checkWindowClosed);
                    clearTimeout(timeoutId);
                    window.removeEventListener('message', messageHandler);
                    sessionStorage.removeItem(`carExtraction_${extractionId}`);
                    
                    console.log(`🔴 Window closed before data received for ${carLink.carId}`);
                    const errorData = {
                        carId: carLink.carId,
                        error: 'Window closed before data extraction'
                    };
                    updateCarEntry(carLink.carId, errorData);
                    extractedData.push(errorData);
                    
                    resolve();
                }
            }, 1000);
        });
    }

    // Function to add a CAR entry to the ribbon
    function addCarEntry(carId, data, isLoading = false) {
        const resultsDiv = document.getElementById('car-results');
        
        let entryClass = 'car-entry';
        if (isLoading) entryClass += ' loading';
        if (data && data.error) entryClass += ' error';
        
        const entryDiv = document.createElement('div');
        entryDiv.className = entryClass;
        entryDiv.id = `car-entry-${carId}`;
        
        if (isLoading) {
            entryDiv.innerHTML = `
                <div class="car-id">${carId}</div>
                <div class="car-details">Loading...</div>
            `;
        } else if (data && data.error) {
            entryDiv.innerHTML = `
                <div class="car-id">${carId}</div>
                <div class="car-details" style="color: #fca5a5;">Error: ${data.error}</div>
            `;
        } else if (data) {
            entryDiv.innerHTML = `
                <div class="car-id">${carId}</div>
                <div class="car-details">
                    <div><strong>Raised:</strong> ${data.raisedDate || 'Unknown'}</div>
                    <div><strong>Owner:</strong> ${data.stageOwner || 'Unknown'}</div>
                    <div><strong>Target:</strong> ${data.targetDate || 'Unknown'}</div>
                    <div><strong>Status:</strong> ${data.status || 'Unknown'}</div>
                </div>
            `;
        }
        
        resultsDiv.appendChild(entryDiv);
        resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }

    // Function to update an existing CAR entry
    function updateCarEntry(carId, data) {
        const entryDiv = document.getElementById(`car-entry-${carId}`);
        if (entryDiv) {
            entryDiv.className = 'car-entry' + (data.error ? ' error' : '');
            
            if (data.error) {
                entryDiv.innerHTML = `
                    <div class="car-id">${carId}</div>
                    <div class="car-details" style="color: #fca5a5;">Error: ${data.error}</div>
                `;
            } else {
                entryDiv.innerHTML = `
                    <div class="car-id">${carId}</div>
                    <div class="car-details">
                        <div><strong>Raised:</strong> ${data.raisedDate || 'Unknown'}</div>
                        <div><strong>Owner:</strong> ${data.stageOwner || 'Unknown'}</div>
                        <div><strong>Target:</strong> ${data.targetDate || 'Unknown'}</div>
                        <div><strong>Status:</strong> ${data.status || 'Unknown'}</div>
                    </div>
                `;
            }
        }
        
        // Also log the update for debugging
        console.log(`Updated ribbon entry for ${carId}:`, data);
    }

    // Function to update status message
    function updateStatus(message) {
        const statusElement = document.getElementById('status-info');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    // Function to update progress bar
    function updateProgress(current, total) {
        const progressElement = document.getElementById('progress-info');
        if (progressElement) {
            if (total === 0) {
                progressElement.textContent = 'Ready to extract CAR data';
            } else {
                progressElement.textContent = `Progress: ${current}/${total} (${Math.round((current/total)*100)}%)`;
            }
        }
    }

    // Function to create progress bar
    function createProgressBar() {
        const header = document.getElementById('ribbon-header');
        if (!document.querySelector('.progress-bar')) {
            const progressDiv = document.createElement('div');
            progressDiv.innerHTML = '<div class="progress-bar"><div class="progress-fill"></div></div>';
            header.appendChild(progressDiv);
        }
    }

    // Main extraction function
    async function startExtraction() {
        if (extractionInProgress && !isPaused) return;
        
        // Update button states
        updateButtonStates('extracting');
        
        if (isPaused) {
            // Resume extraction
            isPaused = false;
            updateStatus(`🔄 Resuming extraction from CAR ${currentCarIndex + 1}/${carLinks.length}...`);
            console.log('=== RESUMING EXTRACTION ===');
        } else {
            // Start new extraction
            extractionInProgress = true;
            shouldStop = false;
            isPaused = false;
            extractedData = [];
            currentCarIndex = 0;
            
            updateStatus('Finding CAR links...');
            
            // Clear previous results first
            document.getElementById('car-results').innerHTML = '';
            
            console.log('=== STARTING CAR LINK DETECTION ===');
            console.log('Page URL:', window.location.href);
            console.log('Page title:', document.title);
            
            carLinks = findCarLinks();
            
            if (carLinks.length === 0) {
                updateStatus('❌ No CAR links found on this page');
                console.log('=== NO LINKS FOUND ===');
                
                extractionInProgress = false;
                updateButtonStates('idle');
                return;
            }
            
            updateStatus(`✅ Found ${carLinks.length} CARs. Starting window-based extraction...`);
            console.log('=== STARTING EXTRACTION ===');
        }
        
        // Process CARs sequentially starting from currentCarIndex
        for (let i = currentCarIndex; i < carLinks.length; i++) {
            if (shouldStop) {
                updateStatus('⏹️ Extraction stopped by user');
                break;
            }
            
            if (isPaused) {
                currentCarIndex = i;
                updateStatus(`⏸️ Extraction paused at CAR ${i + 1}/${carLinks.length}`);
                updateButtonStates('paused');
                return;
            }
            
            currentCarIndex = i;
            console.log(`🔄 Processing CAR ${i + 1}/${carLinks.length}: ${carLinks[i].carId}`);
            
            // Process one CAR at a time and wait for completion
            await processCarLink(carLinks[i], i, carLinks.length);
            
            console.log(`✅ Completed processing ${carLinks[i].carId}`);
            
            // Small delay between requests to be respectful and prevent conflicts
            if (i < carLinks.length - 1) { // Don't delay after the last CAR
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        if (!shouldStop && !isPaused) {
            updateStatus(`🎉 Extraction complete! Processed ${extractedData.length} CARs`);
            console.log('=== EXTRACTION COMPLETE ===');
            extractionInProgress = false;
            updateButtonStates('completed');
        }
    }

    // Function to pause extraction
    function pauseExtraction() {
        isPaused = true;
        updateStatus(`⏸️ Pausing extraction after current CAR...`);
        console.log('=== PAUSING EXTRACTION ===');
    }

    // Function to stop extraction
    function stopExtraction() {
        shouldStop = true;
        isPaused = false;
        extractionInProgress = false;
        updateStatus('⏹️ Stopping extraction...');
        console.log('=== STOPPING EXTRACTION ===');
        updateButtonStates('idle');
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
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.textContent = 'Start';
                    startBtn.style.background = '#28a745';
                }
                if (pauseBtn) pauseBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = true;
                if (exportBtn) exportBtn.disabled = extractedData.length === 0;
                if (clearBtn) clearBtn.disabled = false;
                break;
                
            case 'extracting':
                if (startBtn) {
                    startBtn.disabled = true;
                    startBtn.textContent = 'Running...';
                    startBtn.style.background = '#6c757d';
                }
                if (pauseBtn) pauseBtn.disabled = false;
                if (stopBtn) stopBtn.disabled = false;
                if (exportBtn) exportBtn.disabled = true;
                if (clearBtn) clearBtn.disabled = true;
                break;
                
            case 'paused':
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.textContent = 'Resume';
                    startBtn.style.background = '#17a2b8';
                }
                if (pauseBtn) pauseBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = false;
                if (exportBtn) exportBtn.disabled = extractedData.length === 0;
                if (clearBtn) clearBtn.disabled = false;
                break;
                
            case 'completed':
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.textContent = 'Start';
                    startBtn.style.background = '#28a745';
                }
                if (pauseBtn) pauseBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = true;
                if (exportBtn) exportBtn.disabled = extractedData.length === 0;
                if (clearBtn) clearBtn.disabled = false;
                break;
        }
    }

    // Function to clear results
    function clearResults() {
        document.getElementById('car-results').innerHTML = '';
        extractedData = [];
        currentCarIndex = 0;
        carLinks = [];
        updateStatus('Results cleared - ready for new extraction');
        updateButtonStates('idle');
        
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.remove();
        }
        
        // Update progress info
        updateProgress(0, 0);
    }

    // Function to debug the current page
    function debugPage() {
        console.log('=== PAGE DEBUG INFO ===');
        console.log('URL:', window.location.href);
        console.log('Title:', document.title);
        
        // Show page structure
        console.log('Tables:', document.querySelectorAll('table').length);
        console.log('Rows:', document.querySelectorAll('tr').length);
        console.log('Links:', document.querySelectorAll('a').length);
        
        // Show all CAR references
        const pageText = document.body.textContent;
        const carMatches = pageText.match(/CAR-\d+/g);
        console.log('CAR IDs found:', carMatches);
        
        // Show first 10 links
        const links = document.querySelectorAll('a');
        console.log('First 10 links:');
        for (let i = 0; i < Math.min(10, links.length); i++) {
            console.log(`  ${i + 1}. "${links[i].textContent.trim()}" -> ${links[i].href}`);
        }
        
        // Try to find the specific links we need
        const reportLinks = document.querySelectorAll('a[href*="/Reporting/Report/Index/"]');
        console.log(`Report/Index links: ${reportLinks.length}`);
        reportLinks.forEach((link, i) => {
            console.log(`  Report link ${i + 1}: ${link.href}`);
        });
        
        // Look for kendo grid or other data structures
        const kendoGrids = document.querySelectorAll('.k-grid, [data-role="grid"]');
        console.log('Kendo grids found:', kendoGrids.length);
        
        const tables = document.querySelectorAll('table');
        tables.forEach((table, i) => {
            console.log(`Table ${i + 1}: class="${table.className}", id="${table.id}", rows=${table.querySelectorAll('tr').length}`);
        });
        
        updateStatus('Debug info logged to console - press F12 to view');
    }

    // Function to export results
    function exportResults() {
        if (extractedData.length === 0) {
            alert('No data to export. Please run extraction first.');
            return;
        }
        
        console.log('=== EXPORTING RESULTS ===');
        console.log(`Exporting ${extractedData.length} records`);
        
        // Create CSV header
        let csvContent = 'CAR No,Raised Date,Stage Owner,Target Date,Status\n';
        
        // Add data rows
        let successfulExports = 0;
        extractedData.forEach((data, index) => {
            if (!data.error) {
                const row = [
                    data.carId || '',
                    data.raisedDate || '',
                    data.stageOwner || '',
                    data.targetDate || '',
                    data.status || ''
                ].map(field => {
                    // Escape quotes and wrap in quotes
                    const escaped = String(field).replace(/"/g, '""');
                    return `"${escaped}"`;
                }).join(',');
                
                csvContent += row + '\n';
                successfulExports++;
                console.log(`Row ${index + 1}: ${data.carId} - ${data.stageOwner}`);
            } else {
                console.log(`Skipping row ${index + 1} due to error: ${data.error}`);
            }
        });
        
        console.log(`Successfully exported ${successfulExports} rows out of ${extractedData.length} total`);
        
        // Create and download the file
        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `car_data_${new Date().toISOString().split('T')[0]}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            updateStatus(`✅ Exported ${successfulExports} CARs to CSV file`);
            console.log('=== EXPORT COMPLETE ===');
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting data. Please check console for details.');
            updateStatus('❌ Export failed');
        }
    }

    // Initialize the UI when the page loads
    function init() {
        console.log('Initializing CAR Batch Extractor...');
        console.log('Current URL:', window.location.href);
        
        // Check if we're on a CAR details page (has #!/details)
        if (window.location.href.includes('#!/details')) {
            console.log('Detected CAR details page');
            
            // Check if this is a popup window for data extraction
            if (window.opener) {
                console.log('This is a popup window, handling data extraction...');
                handleCarDetailsWindow();
                return;
            } else {
                console.log('This is not a popup window, skipping extraction');
                return;
            }
        }
        
        // Check if we're on the main CAR list page
        if (window.location.href.includes('/Reporting/ReportingManagement')) {
            console.log('Detected CAR list page');
            
            // Wait for the page to be fully loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        createUI();
                    }, 1000);
                });
            } else {
                setTimeout(() => {
                    createUI();
                }, 1000);
            }
        }
    }

    // Start the initialization
    init();

})();
