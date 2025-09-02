// Clean CAR Extractor Main Script (No anti-tampering for debugging)
// This version loads via script injection without eval

console.log('🚀 HAESL CAR Extractor Main Script Loading...');

// Global variables
let extractedData = [];
let isExtracting = false;
let isPaused = false;
let currentIndex = 0;
let totalCars = 0;
let ribbonMinimized = false;

// Add styles for the ribbon
GM_addStyle(`
    #carRibbon {
        position: fixed;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 400px;
        max-height: 80vh;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 0 8px 8px 0;
        color: #f0f6fc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        font-size: 12px;
        z-index: 10000;
        box-shadow: 2px 0 10px rgba(0,0,0,0.3);
        transition: transform 0.3s ease;
        overflow: hidden;
    }
    
    #carRibbon.minimized {
        transform: translateY(-50%) translateX(-350px);
    }
    
    #carRibbon .ribbon-header {
        background: #21262d;
        padding: 12px 16px;
        border-bottom: 1px solid #30363d;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
    }
    
    #carRibbon .ribbon-title {
        font-weight: 600;
        color: #58a6ff;
    }
    
    #carRibbon .ribbon-controls {
        display: flex;
        gap: 8px;
    }
    
    #carRibbon .control-btn {
        background: #21262d;
        border: 1px solid #30363d;
        color: #f0f6fc;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s;
    }
    
    #carRibbon .control-btn:hover {
        background: #30363d;
        border-color: #58a6ff;
    }
    
    #carRibbon .control-btn.start {
        background: #238636;
        border-color: #2ea043;
    }
    
    #carRibbon .control-btn.pause {
        background: #bf8700;
        border-color: #d4a72c;
    }
    
    #carRibbon .control-btn.stop {
        background: #da3633;
        border-color: #f85149;
    }
    
    #carRibbon .ribbon-content {
        padding: 16px;
        max-height: calc(80vh - 60px);
        overflow-y: auto;
    }
    
    #carRibbon .progress-section {
        margin-bottom: 16px;
        padding: 12px;
        background: #161b22;
        border-radius: 6px;
        border-left: 3px solid #58a6ff;
    }
    
    #carRibbon .progress-bar {
        width: 100%;
        height: 6px;
        background: #21262d;
        border-radius: 3px;
        overflow: hidden;
        margin: 8px 0;
    }
    
    #carRibbon .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #58a6ff, #79c0ff);
        width: 0%;
        transition: width 0.3s ease;
    }
    
    #carRibbon .data-table {
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 6px;
        overflow: hidden;
    }
    
    #carRibbon .data-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
        padding: 8px 12px;
        border-bottom: 1px solid #21262d;
        align-items: center;
        font-size: 11px;
    }
    
    #carRibbon .data-row:hover {
        background: #161b22;
    }
    
    #carRibbon .data-row.header {
        background: #21262d;
        font-weight: 600;
        color: #58a6ff;
        border-bottom: 2px solid #30363d;
    }
    
    #carRibbon .export-section {
        margin-top: 16px;
        text-align: center;
    }
    
    #carRibbon .export-btn {
        background: #238636;
        border: 1px solid #2ea043;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
    }
    
    #carRibbon .export-btn:hover {
        background: #2ea043;
        transform: translateY(-1px);
    }
    
    #carRibbon .export-btn:disabled {
        background: #21262d;
        border-color: #30363d;
        color: #8b949e;
        cursor: not-allowed;
        transform: none;
    }
    
    #carRibbon .toggle-btn {
        position: absolute;
        right: -25px;
        top: 20px;
        background: #21262d;
        border: 1px solid #30363d;
        color: #f0f6fc;
        width: 25px;
        height: 40px;
        border-radius: 0 4px 4px 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    #carRibbon .toggle-btn:hover {
        background: #30363d;
        border-color: #58a6ff;
    }
    
    .car-row-context-menu {
        position: absolute;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 6px;
        padding: 4px 0;
        z-index: 10001;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    
    .car-row-context-menu .menu-item {
        padding: 8px 16px;
        cursor: pointer;
        color: #f0f6fc;
        transition: background 0.2s;
    }
    
    .car-row-context-menu .menu-item:hover {
        background: #30363d;
    }
`);

// Create the ribbon interface
function createRibbon() {
    const ribbon = document.createElement('div');
    ribbon.id = 'carRibbon';
    ribbon.innerHTML = `
        <div class="ribbon-header">
            <div class="ribbon-title">🚗 CAR Extractor</div>
            <div class="ribbon-controls">
                <button class="control-btn start" id="startBtn" onclick="startExtraction()">Start</button>
                <button class="control-btn pause" id="pauseBtn" onclick="togglePause()" style="display: none;">Pause</button>
                <button class="control-btn stop" id="stopBtn" onclick="stopExtraction()" style="display: none;">Stop</button>
            </div>
        </div>
        <div class="toggle-btn" onclick="toggleRibbon()">
            <span id="toggleIcon">◀</span>
        </div>
        <div class="ribbon-content">
            <div class="progress-section">
                <div><strong>Progress:</strong> <span id="progressText">Ready to start</span></div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progressBar"></div>
                </div>
                <div id="statusText">Click Start to begin extraction</div>
            </div>
            
            <div class="data-table">
                <div class="data-row header">
                    <div>CAR No</div>
                    <div>Raised Date</div>
                    <div>Stage Owner</div>
                    <div>Target Date</div>
                    <div>Status</div>
                    <div>Remarks</div>
                </div>
                <div id="dataRows"></div>
            </div>
            
            <div class="export-section">
                <button class="export-btn" id="exportBtn" onclick="exportToCSV()" disabled>
                    📥 Export CSV (0 records)
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(ribbon);
    
    // Make ribbon draggable
    makeRibbonDraggable();
}

// Toggle ribbon minimize/maximize
function toggleRibbon() {
    const ribbon = document.getElementById('carRibbon');
    const icon = document.getElementById('toggleIcon');
    
    ribbonMinimized = !ribbonMinimized;
    
    if (ribbonMinimized) {
        ribbon.classList.add('minimized');
        icon.textContent = '▶';
    } else {
        ribbon.classList.remove('minimized');
        icon.textContent = '◀';
    }
}

// Make ribbon draggable
function makeRibbonDraggable() {
    const ribbon = document.getElementById('carRibbon');
    const header = ribbon.querySelector('.ribbon-header');
    
    let isDragging = false;
    let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
            header.style.cursor = 'grabbing';
        }
    }
    
    function dragMove(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            xOffset = currentX;
            yOffset = currentY;
            
            ribbon.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }
    
    function dragEnd() {
        isDragging = false;
        header.style.cursor = 'move';
    }
}

// Extraction functions
function startExtraction() {
    if (isExtracting) return;
    
    const carLinks = document.querySelectorAll('a[href*="/Reporting/Report/Index/"]');
    if (carLinks.length === 0) {
        updateStatus('No CAR reports found on this page');
        return;
    }
    
    totalCars = carLinks.length;
    currentIndex = 0;
    extractedData = [];
    isExtracting = true;
    isPaused = false;
    
    updateControls();
    updateStatus(`Starting extraction of ${totalCars} CARs...`);
    
    processNextCar(carLinks);
}

function togglePause() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (isPaused) {
        pauseBtn.textContent = 'Resume';
        updateStatus('Extraction paused');
    } else {
        pauseBtn.textContent = 'Pause';
        updateStatus('Extraction resumed');
        // Resume processing if we were in the middle of extraction
        if (isExtracting) {
            const carLinks = document.querySelectorAll('a[href*="/Reporting/Report/Index/"]');
            setTimeout(() => processNextCar(carLinks), 1000);
        }
    }
}

function stopExtraction() {
    isExtracting = false;
    isPaused = false;
    updateControls();
    updateStatus('Extraction stopped');
}

function processNextCar(carLinks) {
    if (!isExtracting || isPaused || currentIndex >= carLinks.length) {
        if (currentIndex >= carLinks.length && isExtracting) {
            completeExtraction();
        }
        return;
    }
    
    const link = carLinks[currentIndex];
    const carUrl = link.href;
    const carNumber = link.textContent.trim();
    
    updateProgress();
    updateStatus(`Processing CAR ${currentIndex + 1}/${totalCars}: ${carNumber}`);
    
    // Open CAR in new window
    const carWindow = window.open(carUrl, '_blank', 'width=1200,height=800');
    
    // Wait for window to load and extract data
    const checkWindow = setInterval(() => {
        if (carWindow.closed) {
            clearInterval(checkWindow);
            currentIndex++;
            setTimeout(() => processNextCar(carLinks), 2000); // 2 second delay between cars
            return;
        }
        
        try {
            if (carWindow.document.readyState === 'complete') {
                extractCarData(carWindow, carNumber);
                setTimeout(() => {
                    carWindow.close();
                    clearInterval(checkWindow);
                    currentIndex++;
                    setTimeout(() => processNextCar(carLinks), 2000);
                }, 3000); // Wait 3 seconds for data to load
            }
        } catch (e) {
            // Cross-origin issues, continue anyway
        }
    }, 1000);
    
    // Timeout after 10 seconds
    setTimeout(() => {
        if (!carWindow.closed) {
            carWindow.close();
            clearInterval(checkWindow);
            currentIndex++;
            setTimeout(() => processNextCar(carLinks), 1000);
        }
    }, 10000);
}

function extractCarData(carWindow, carNumber) {
    try {
        const doc = carWindow.document;
        
        // Extract data from the CAR details page
        const raisedDate = extractFieldValue(doc, 'Raised Date');
        const stageOwner = extractFieldValue(doc, 'Stage Owner');
        const targetDate = extractFieldValue(doc, 'Target Date');
        const status = extractFieldValue(doc, 'Status');
        
        const carData = {
            carNumber: carNumber,
            raisedDate: raisedDate,
            stageOwner: stageOwner,
            targetDate: targetDate,
            status: status,
            remarks: new Date().toLocaleDateString() // Today's date as remarks
        };
        
        extractedData.push(carData);
        addDataRow(carData);
        updateExportButton();
        
    } catch (error) {
        console.error('Error extracting CAR data:', error);
    }
}

function extractFieldValue(doc, fieldName) {
    // Try different selectors to find the field
    const selectors = [
        `label:contains("${fieldName}")`,
        `td:contains("${fieldName}")`,
        `th:contains("${fieldName}")`,
        `span:contains("${fieldName}")`,
        `div:contains("${fieldName}")`
    ];
    
    for (const selector of selectors) {
        try {
            const labels = Array.from(doc.querySelectorAll('label, td, th, span, div'));
            const label = labels.find(el => el.textContent.includes(fieldName));
            
            if (label) {
                // Try to find the associated value
                const nextSibling = label.nextElementSibling;
                if (nextSibling) {
                    return nextSibling.textContent.trim();
                }
                
                const parent = label.parentElement;
                if (parent) {
                    const nextCell = parent.nextElementSibling;
                    if (nextCell) {
                        return nextCell.textContent.trim();
                    }
                }
            }
        } catch (e) {
            continue;
        }
    }
    
    return 'N/A';
}

function addDataRow(carData) {
    const dataRows = document.getElementById('dataRows');
    const row = document.createElement('div');
    row.className = 'data-row';
    row.innerHTML = `
        <div>${carData.carNumber}</div>
        <div>${carData.raisedDate}</div>
        <div>${carData.stageOwner}</div>
        <div>${carData.targetDate}</div>
        <div>${carData.status}</div>
        <div>${carData.remarks}</div>
    `;
    
    // Add right-click context menu
    row.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, carData);
    });
    
    dataRows.appendChild(row);
}

function showContextMenu(event, carData) {
    // Remove existing context menu
    const existingMenu = document.querySelector('.car-row-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'car-row-context-menu';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    
    menu.innerHTML = `
        <div class="menu-item" onclick="refreshCarData('${carData.carNumber}')">🔄 Refresh this CAR</div>
        <div class="menu-item" onclick="removeCarData('${carData.carNumber}')">🗑️ Remove from list</div>
    `;
    
    document.body.appendChild(menu);
    
    // Remove menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', () => {
            menu.remove();
        }, { once: true });
    }, 100);
}

function refreshCarData(carNumber) {
    updateStatus(`Refreshing data for ${carNumber}...`);
    // Implementation for refreshing specific CAR data
    // This would re-fetch the data for this specific CAR
}

function removeCarData(carNumber) {
    extractedData = extractedData.filter(car => car.carNumber !== carNumber);
    renderDataTable();
    updateExportButton();
}

function renderDataTable() {
    const dataRows = document.getElementById('dataRows');
    dataRows.innerHTML = '';
    
    extractedData.forEach(carData => {
        addDataRow(carData);
    });
}

function updateControls() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (isExtracting) {
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
        stopBtn.style.display = 'inline-block';
    } else {
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        stopBtn.style.display = 'none';
    }
}

function updateProgress() {
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    
    const percentage = totalCars > 0 ? (currentIndex / totalCars) * 100 : 0;
    progressText.textContent = `${currentIndex}/${totalCars} (${Math.round(percentage)}%)`;
    progressBar.style.width = percentage + '%';
}

function updateStatus(message) {
    const statusText = document.getElementById('statusText');
    statusText.textContent = message;
}

function updateExportButton() {
    const exportBtn = document.getElementById('exportBtn');
    exportBtn.textContent = `📥 Export CSV (${extractedData.length} records)`;
    exportBtn.disabled = extractedData.length === 0;
}

function completeExtraction() {
    isExtracting = false;
    updateControls();
    updateStatus(`Extraction complete! ${extractedData.length} CARs processed.`);
}

function exportToCSV() {
    if (extractedData.length === 0) {
        alert('No data to export');
        return;
    }
    
    const headers = ['CAR No', 'Raised Date', 'Stage Owner', 'Target Date', 'Status', 'Remarks'];
    const csvContent = [
        headers.join(','),
        ...extractedData.map(car => [
            `"${car.carNumber}"`,
            `"${car.raisedDate}"`,
            `"${car.stageOwner}"`,
            `"${car.targetDate}"`,
            `"${car.status}"`,
            `"${car.remarks}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `HAESL_CAR_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Make functions globally accessible
window.startExtraction = startExtraction;
window.togglePause = togglePause;
window.stopExtraction = stopExtraction;
window.toggleRibbon = toggleRibbon;
window.exportToCSV = exportToCSV;
window.refreshCarData = refreshCarData;
window.removeCarData = removeCarData;

// Initialize when page loads
function initialize() {
    console.log('🚀 HAESL CAR Extractor initialized');
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(createRibbon, 1000);
        });
    } else {
        setTimeout(createRibbon, 1000);
    }
}

// Start initialization
initialize();
