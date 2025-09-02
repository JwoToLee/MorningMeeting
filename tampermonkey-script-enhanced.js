// ==UserScript==
// @name         HAESL Report Data Extractor (Enhanced)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Extract Investigation and QA Follow up data from HAESL reports - Enhanced version
// @author       You
// @match        https://haesl.gaelenlighten.com/Reporting/Report/Index/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Wait for page to load completely
    function waitForElements() {
        return new Promise((resolve) => {
            const checkForElements = () => {
                // Check for the key elements we identified in the HTML structure
                const stageContainers = document.querySelectorAll('li[data-stage-type="report"]');
                const inlineContainers = document.querySelectorAll('div[id*="inline-container"]');
                const staticContainers = document.querySelectorAll('.staticTextContainer');
                const userLinks = document.querySelectorAll('a[href*="UserProfile"]');
                
                if (stageContainers.length > 0 || inlineContainers.length > 0 || staticContainers.length > 0 || userLinks.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkForElements, 1000);
                }
            };
            checkForElements();
        });
    }
    
    // Enhanced function to extract data based on the detailed HTML structure
    function extractReportData() {
        const data = {
            investigationStageOwner: '',
            investigationTargetDate: '',
            qaFollowupStageOwner: '',
            qaFollowupTargetDate: ''
        };
        
        try {
            // Method 1: Look for stage containers with data-stage-type="report"
            const stageContainers = document.querySelectorAll('li[data-stage-type="report"]');
            
            stageContainers.forEach(container => {
                const containerText = container.textContent || container.innerText;
                const lowerText = containerText.toLowerCase();
                
                // Look for Investigation stage
                if (lowerText.includes('investigation')) {
                    // Find user profile links within this stage
                    const userLinks = container.querySelectorAll('a[href*="/Account/UserProfile/Index/"]');
                    if (userLinks.length > 0) {
                        data.investigationStageOwner = userLinks[0].textContent.trim();
                    }
                    
                    // Look for target date - specifically after "Target Date" text
                    const targetDateMatch = containerText.match(/Target Date[^0-9]*(\d{1,2}\/\d{1,2}\/\d{4})/);
                    if (targetDateMatch) {
                        data.investigationTargetDate = targetDateMatch[1];
                    }
                }
                
                // Look for QA Follow up stage
                if (lowerText.includes('qa') && (lowerText.includes('follow') || lowerText.includes('followup'))) {
                    const userLinks = container.querySelectorAll('a[href*="/Account/UserProfile/Index/"]');
                    if (userLinks.length > 0) {
                        data.qaFollowupStageOwner = userLinks[0].textContent.trim();
                    }
                    
                    // Look for target date
                    const targetDateMatch = containerText.match(/Target Date[^0-9]*(\d{1,2}\/\d{1,2}\/\d{4})/);
                    if (targetDateMatch) {
                        data.qaFollowupTargetDate = targetDateMatch[1];
                    }
                }
            });
            
            // Method 2: Look for inline containers with specific IDs
            const inlineContainers = document.querySelectorAll('div[id*="inline-container"]');
            
            inlineContainers.forEach(container => {
                const staticTexts = container.querySelectorAll('.staticText');
                const userLinks = container.querySelectorAll('a[href*="UserProfile"]');
                
                // Get the context text to understand what data this container holds
                const containerText = container.textContent || container.innerText;
                const lowerText = containerText.toLowerCase();
                
                // Look for Investigation stage
                if (lowerText.includes('investigation') && lowerText.includes('stage')) {
                    if (userLinks.length > 0) {
                        data.investigationStageOwner = userLinks[0].textContent.trim();
                    }
                    
                    // Look for dates in this container
                    const dateMatch = containerText.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
                    if (dateMatch && lowerText.includes('target')) {
                        data.investigationTargetDate = dateMatch[0];
                    }
                }
                
                // Look for QA Follow up stage
                if (lowerText.includes('qa') && lowerText.includes('follow')) {
                    if (userLinks.length > 0) {
                        data.qaFollowupStageOwner = userLinks[0].textContent.trim();
                    }
                    
                    // Look for dates in this container
                    const dateMatch = containerText.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
                    if (dateMatch && lowerText.includes('target')) {
                        data.qaFollowupTargetDate = dateMatch[0];
                    }
                }
            });
            
            // Method 3: Direct search for user profile links with specific path patterns
            const allUserLinks = document.querySelectorAll('a[href*="/Account/UserProfile/Index/"], a[href*="/Account/UserProfile/UserProfileCardPartial/"]');
            
            allUserLinks.forEach(link => {
                const userName = link.textContent.trim();
                
                // Get the parent container to understand context
                let contextElement = link.closest('.staticTextContainer') || 
                                   link.closest('div[id*="inline-container"]') ||
                                   link.parentElement;
                
                if (contextElement) {
                    // Look for context in nearby elements or parent containers
                    let searchElement = contextElement;
                    let attempts = 0;
                    
                    while (searchElement && attempts < 5) {
                        const contextText = (searchElement.textContent || searchElement.innerText).toLowerCase();
                        
                        if (contextText.includes('investigation') && contextText.includes('stage')) {
                            data.investigationStageOwner = userName;
                            break;
                        } else if (contextText.includes('qa') && contextText.includes('follow')) {
                            data.qaFollowupStageOwner = userName;
                            break;
                        }
                        
                        searchElement = searchElement.parentElement;
                        attempts++;
                    }
                }
            });
            
            // Method 4: Look for target dates with better context awareness using details-label
            const detailsLabels = document.querySelectorAll('.details-label');
            
            detailsLabels.forEach(label => {
                const labelText = (label.textContent || label.innerText).toLowerCase();
                
                if (labelText.includes('target date')) {
                    // Look for the corresponding value in sibling or nearby elements
                    let valueElement = label.nextElementSibling;
                    
                    // Try different approaches to find the date value
                    if (!valueElement) {
                        valueElement = label.parentElement.querySelector('.staticText');
                    }
                    
                    if (valueElement) {
                        const dateMatch = valueElement.textContent.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
                        if (dateMatch) {
                            // Find the stage context by looking at parent containers
                            let stageContext = label.closest('li[data-stage-type="report"]');
                            if (!stageContext) {
                                stageContext = label.closest('div[id*="inline-container"]');
                            }
                            
                            if (stageContext) {
                                const contextText = (stageContext.textContent || stageContext.innerText).toLowerCase();
                                
                                if (contextText.includes('investigation')) {
                                    data.investigationTargetDate = dateMatch[0];
                                } else if (contextText.includes('qa') || contextText.includes('follow')) {
                                    data.qaFollowupTargetDate = dateMatch[0];
                                }
                            }
                        }
                    }
                }
            });
            
            // Method 5: Look for specific patterns in staticText elements
            const staticTexts = document.querySelectorAll('.staticText');
            
            staticTexts.forEach(textElement => {
                const text = textElement.textContent || textElement.innerText;
                const dateMatch = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
                
                if (dateMatch) {
                    // Find context by looking at parent containers
                    let parentContext = textElement.closest('li[data-stage-type="report"]');
                    if (!parentContext) {
                        parentContext = textElement.closest('div[id*="inline-container"]');
                    }
                    
                    if (parentContext) {
                        const contextText = (parentContext.textContent || parentContext.innerText).toLowerCase();
                        
                        // Look for "Target Date" specifically near this date
                        const nearbyText = textElement.parentElement.textContent.toLowerCase();
                        
                        if (nearbyText.includes('target date')) {
                            if (contextText.includes('investigation')) {
                                data.investigationTargetDate = dateMatch[0];
                            } else if (contextText.includes('qa') || contextText.includes('follow')) {
                                data.qaFollowupTargetDate = dateMatch[0];
                            }
                        }
                    }
                }
            });
            // Method 6: Enhanced pattern-based extraction for edge cases
            // Look for specific patterns like "Bryce Lee" which we saw in the image
            if (!data.qaFollowupStageOwner || !data.investigationStageOwner) {
                const stageElements = document.querySelectorAll('li[data-stage-type="report"]');
                
                stageElements.forEach(stageElement => {
                    const stageText = (stageElement.textContent || stageElement.innerText).toLowerCase();
                    const userLinks = stageElement.querySelectorAll('a[href*="UserProfile"]');
                    
                    if (userLinks.length > 0) {
                        const userName = userLinks[0].textContent.trim();
                        
                        if (stageText.includes('investigation') && !data.investigationStageOwner) {
                            data.investigationStageOwner = userName;
                        } else if ((stageText.includes('qa') || stageText.includes('follow')) && !data.qaFollowupStageOwner) {
                            data.qaFollowupStageOwner = userName;
                        }
                    }
                });
            }
            
        } catch (error) {
            console.error('Error extracting data:', error);
        }
        
        return data;
    }
    
    // Function to create a more detailed debug panel
    function createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'haesl-debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 9999;
            font-family: monospace;
            font-size: 11px;
            max-height: 300px;
            overflow-y: auto;
        `;
        
        const userLinks = document.querySelectorAll('a[href*="UserProfile"]');
        const stageContainers = document.querySelectorAll('li[data-stage-type="report"]');
        const inlineContainers = document.querySelectorAll('div[id*="inline-container"]');
        const staticContainers = document.querySelectorAll('.staticTextContainer');
        const detailsLabels = document.querySelectorAll('.details-label');
        const staticTexts = document.querySelectorAll('.staticText');
        
        // Get sample data for debugging
        let sampleStageInfo = '';
        if (stageContainers.length > 0) {
            const firstStage = stageContainers[0];
            const stageText = (firstStage.textContent || firstStage.innerText).substring(0, 100);
            sampleStageInfo = stageText + '...';
        }
        
        debugPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <h4 style="margin: 0;">Debug Info</h4>
                <button onclick="this.parentElement.parentElement.remove()" style="background: #dc3545; color: white; border: none; border-radius: 3px; padding: 2px 6px;">×</button>
            </div>
            <div style="margin-bottom: 8px;"><strong>Stage Containers:</strong> ${stageContainers.length}</div>
            <div style="margin-bottom: 8px;"><strong>User Links:</strong> ${userLinks.length}</div>
            <div style="margin-bottom: 8px;"><strong>Inline Containers:</strong> ${inlineContainers.length}</div>
            <div style="margin-bottom: 8px;"><strong>Static Containers:</strong> ${staticContainers.length}</div>
            <div style="margin-bottom: 8px;"><strong>Details Labels:</strong> ${detailsLabels.length}</div>
            <div style="margin-bottom: 8px;"><strong>Static Texts:</strong> ${staticTexts.length}</div>
            <div style="margin-bottom: 10px;"><strong>Sample Stage:</strong><br><small>${sampleStageInfo}</small></div>
            <button onclick="console.log('Stage containers:', document.querySelectorAll('li[data-stage-type=\"report\"]')); console.log('User links:', document.querySelectorAll('a[href*=\"UserProfile\"]'));" style="background: #007acc; color: white; border: none; border-radius: 3px; padding: 5px 8px; width: 100%;">Log Elements to Console</button>
        `;
        
        document.body.appendChild(debugPanel);
    }
    
    // Enhanced display function
    function displayData(data) {
        // Remove existing panel if present
        const existingPanel = document.getElementById('haesl-data-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        const panel = document.createElement('div');
        panel.id = 'haesl-data-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            background: #ffffff;
            border: 2px solid #007acc;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            max-height: 500px;
            overflow-y: auto;
        `;
        
        const hasData = data.investigationStageOwner || data.investigationTargetDate || 
                       data.qaFollowupStageOwner || data.qaFollowupTargetDate;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                <h3 style="margin: 0; color: #007acc; font-size: 16px;">HAESL Report Data</h3>
                <div>
                    <button id="refresh-data" style="background: #28a745; color: white; border: none; border-radius: 3px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 11px;">↻</button>
                    <button id="debug-panel" style="background: #ffc107; color: black; border: none; border-radius: 3px; padding: 4px 8px; cursor: pointer; margin-right: 5px; font-size: 11px;">?</button>
                    <button id="close-panel" style="background: #dc3545; color: white; border: none; border-radius: 3px; padding: 4px 8px; cursor: pointer; font-size: 11px;">×</button>
                </div>
            </div>
            
            ${!hasData ? '<div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 8px; margin-bottom: 10px; color: #856404;"><small>⚠️ No data found. Try refreshing or check if this is the correct report page.</small></div>' : ''}
            
            <div style="margin-bottom: 12px;">
                <strong style="color: #495057;">Investigation Stage Owner:</strong><br>
                <span style="color: ${data.investigationStageOwner ? '#28a745' : '#dc3545'}; font-weight: ${data.investigationStageOwner ? 'bold' : 'normal'};">
                    ${data.investigationStageOwner || '❌ Not found'}
                </span>
            </div>
            
            <div style="margin-bottom: 12px;">
                <strong style="color: #495057;">Investigation Target Date:</strong><br>
                <span style="color: ${data.investigationTargetDate ? '#28a745' : '#dc3545'}; font-weight: ${data.investigationTargetDate ? 'bold' : 'normal'};">
                    ${data.investigationTargetDate || '❌ Not found'}
                </span>
            </div>
            
            <div style="margin-bottom: 12px;">
                <strong style="color: #495057;">QA Follow up Stage Owner:</strong><br>
                <span style="color: ${data.qaFollowupStageOwner ? '#28a745' : '#dc3545'}; font-weight: ${data.qaFollowupStageOwner ? 'bold' : 'normal'};">
                    ${data.qaFollowupStageOwner || '❌ Not found'}
                </span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong style="color: #495057;">QA Follow up Target Date:</strong><br>
                <span style="color: ${data.qaFollowupTargetDate ? '#28a745' : '#dc3545'}; font-weight: ${data.qaFollowupTargetDate ? 'bold' : 'normal'};">
                    ${data.qaFollowupTargetDate || '❌ Not found'}
                </span>
            </div>
            
            <button id="copy-data" style="background: #007acc; color: white; border: none; border-radius: 4px; padding: 10px 15px; cursor: pointer; width: 100%; font-weight: bold;">
                📋 Copy to Clipboard
            </button>
        `;
        
        document.body.appendChild(panel);
        
        // Event listeners
        document.getElementById('close-panel').addEventListener('click', () => panel.remove());
        
        document.getElementById('refresh-data').addEventListener('click', () => {
            panel.remove();
            setTimeout(() => {
                const newData = extractReportData();
                console.log('Refreshed data:', newData);
                displayData(newData);
            }, 500);
        });
        
        document.getElementById('debug-panel').addEventListener('click', createDebugPanel);
        
        document.getElementById('copy-data').addEventListener('click', () => {
            const dataText = `HAESL Report Data:
Investigation Stage Owner: ${data.investigationStageOwner || 'Not found'}
Investigation Target Date: ${data.investigationTargetDate || 'Not found'}
QA Follow up Stage Owner: ${data.qaFollowupStageOwner || 'Not found'}
QA Follow up Target Date: ${data.qaFollowupTargetDate || 'Not found'}

Extracted on: ${new Date().toLocaleString()}`;
            
            navigator.clipboard.writeText(dataText).then(() => {
                const button = document.getElementById('copy-data');
                const originalText = button.innerHTML;
                button.innerHTML = '✓ Copied!';
                button.style.background = '#28a745';
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.style.background = '#007acc';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = dataText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Data copied to clipboard');
            });
        });
    }
    
    // Main execution function
    async function main() {
        console.log('HAESL Report Data Extractor (Enhanced) loaded');
        
        // Wait for page elements to load
        await waitForElements();
        
        // Additional delay for dynamic content
        setTimeout(() => {
            const extractedData = extractReportData();
            console.log('Extracted data:', extractedData);
            displayData(extractedData);
        }, 3000);
        
        // Also add a manual trigger button for testing
        const triggerButton = document.createElement('button');
        triggerButton.textContent = 'Extract Data';
        triggerButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 10001;
            background: #007acc;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
        `;
        
        triggerButton.addEventListener('click', () => {
            const data = extractReportData();
            console.log('Manual extraction:', data);
            displayData(data);
        });
        
        document.body.appendChild(triggerButton);
    }
    
    // Run the script when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
    
})();
