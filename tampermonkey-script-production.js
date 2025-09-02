// ==UserScript==
// @name         HAESL Report Data Extractor (Production)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Extract Investigation and QA Follow up data from HAESL reports - Based on working sample
// @author       You
// @match        https://haesl.gaelenlighten.com/Reporting/Report/Index/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Create inline panel to display extracted data
    var panel = document.createElement("div");
    panel.id = "haesl-data-panel";
    panel.innerHTML = `
        <div id="extracted-data">Loading report data...</div>
        <button id="refresh-data" style="margin-left: 20px; padding: 5px 10px; font-size: 12px; cursor: pointer;">🔄 Refresh</button>
        <button id="copy-data" style="margin-left: 10px; padding: 5px 10px; font-size: 12px; cursor: pointer;">📋 Copy</button>
        <button id="toggle-debug" style="margin-left: 10px; padding: 5px 10px; font-size: 12px; cursor: pointer;">🔍 Debug</button>
    `;
    document.body.prepend(panel); // Place the panel at the very top of the page

    // Add CSS for the inline panel
    GM_addStyle(`
        #haesl-data-panel {
            position: static;
            width: 100%;
            background: rgba(0, 120, 212, 0.95);
            color: white;
            padding: 15px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            text-align: left;
            z-index: 9999;
            box-shadow: 0px 3px 10px rgba(0, 0, 0, 0.3);
            border-bottom: 3px solid #005A9E;
        }
        #extracted-data {
            display: inline-block;
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }
        #haesl-data-panel button {
            background: #005A9E;
            color: white;
            border: none;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        #haesl-data-panel button:hover {
            background: #003d6b;
        }
        #debug-info {
            background: rgba(248, 249, 250, 0.95);
            color: #333;
            padding: 10px;
            margin-top: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 11px;
            display: none;
        }
    `);

    // Function to extract report data using patterns from the sample script
    function extractReportData() {
        const data = {
            investigationStageOwner: '',
            investigationTargetDate: '',
            investigationCompleted: false,
            investigationStatus: '',
            qaFollowupStageOwner: '',
            qaFollowupTargetDate: '',
            qaFollowupStatus: '',
            raisedDate: '',
            currentStage: '' // Will be either 'investigation' or 'qa-followup'
        };

        try {
            // Extract the CAR ID for context (similar to sample script)
            const headingElement = document.querySelector('.g-subheading__title h1');
            const gHeading = headingElement ? headingElement.textContent.trim() : '';
            const carID = gHeading.match(/CAR-\d+/)?.[0] || '';

            // Extract the Raised Date from the page (usually near the top)
            // Look for "Raised Date" label and its corresponding value
            const allLabels = document.querySelectorAll('div.details-label, .g-label, label');
            allLabels.forEach(label => {
                const labelText = (label.textContent || label.innerText).trim().toLowerCase();
                if (labelText.includes('raised date') || labelText === 'raised date:') {
                    // Look for the value in sibling or nearby elements
                    let valueElement = label.nextElementSibling;
                    if (!valueElement) {
                        valueElement = label.parentElement.querySelector('.staticText, .g-value');
                    }
                    if (!valueElement && label.parentElement) {
                        // Try looking in parent container
                        const parentText = label.parentElement.textContent;
                        const dateMatch = parentText.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
                        if (dateMatch) {
                            data.raisedDate = dateMatch[0];
                        }
                    } else if (valueElement) {
                        const dateMatch = valueElement.textContent.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
                        if (dateMatch) {
                            data.raisedDate = dateMatch[0];
                        }
                    }
                }
            });

            // Find all stage elements (using pattern from sample script)
            const stages = document.querySelectorAll("li.stage-li");
            console.log(`Found ${stages.length} stages`);

            stages.forEach((stage, index) => {
                // Helper function to find data by label (from sample script)
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

                // Get stage context to identify which stage this is
                const stageText = stage.textContent || stage.innerText;
                const lowerStageText = stageText.toLowerCase();

                // Extract owner and dates for Investigation stage
                if (lowerStageText.includes('investigation')) {
                    const owner = findSiblingData("Stage Owner:");
                    const targetDate = findStaticTextData("Target Date");
                    const completedDate = findSiblingData("Completed date");
                    const status = findSiblingData("Status:");

                    if (owner && owner !== "Unknown") {
                        data.investigationStageOwner = owner.replace(/Cancel|Save/g, '').trim();
                    }
                    
                    if (targetDate) {
                        data.investigationTargetDate = targetDate.replace(/Cancel|Save/g, '').trim();
                    } else if (completedDate) {
                        data.investigationTargetDate = completedDate.replace(/Cancel|Save/g, '').trim();
                    }

                    if (status) {
                        data.investigationStatus = status.replace(/Cancel|Save/g, '').trim();
                    }

                    // Check if Investigation stage is completed
                    if (completedDate || (status && status.toLowerCase().includes('complete'))) {
                        data.investigationCompleted = true;
                    }
                }

                // Extract owner and dates for QA Follow up stage
                if (lowerStageText.includes('qa') && lowerStageText.includes('follow')) {
                    const owner = findSiblingData("Stage Owner:");
                    const targetDate = findStaticTextData("Target Date");
                    const completedDate = findSiblingData("Completed date");
                    const status = findSiblingData("Status:");

                    if (owner && owner !== "Unknown") {
                        data.qaFollowupStageOwner = owner.replace(/Cancel|Save/g, '').trim();
                    }
                    
                    if (targetDate) {
                        data.qaFollowupTargetDate = targetDate.replace(/Cancel|Save/g, '').trim();
                    } else if (completedDate) {
                        data.qaFollowupTargetDate = completedDate.replace(/Cancel|Save/g, '').trim();
                    }

                    if (status) {
                        data.qaFollowupStatus = status.replace(/Cancel|Save/g, '').trim();
                    }
                }
            });

            // Fallback method: Look for user profile links in the context
            if (!data.investigationStageOwner || !data.qaFollowupStageOwner) {
                const userLinks = document.querySelectorAll('a[href*="UserProfile"]');
                userLinks.forEach(link => {
                    const userName = link.textContent.trim();
                    const parentStage = link.closest('li.stage-li');
                    
                    if (parentStage) {
                        const stageText = (parentStage.textContent || parentStage.innerText).toLowerCase();
                        
                        if (stageText.includes('investigation') && !data.investigationStageOwner) {
                            data.investigationStageOwner = userName;
                        } else if (stageText.includes('qa') && stageText.includes('follow') && !data.qaFollowupStageOwner) {
                            data.qaFollowupStageOwner = userName;
                        }
                    }
                });
            }

            // Determine which stage to show based on Investigation completion
            if (data.investigationCompleted && data.qaFollowupStageOwner) {
                data.currentStage = 'qa-followup';
            } else if (data.investigationStageOwner) {
                data.currentStage = 'investigation';
            }

            // Add CAR ID to the data for context
            data.carID = carID;

        } catch (error) {
            console.error('Error extracting data:', error);
        }

        return data;
    }

    // Function to display the extracted data
    function displayExtractedData() {
        const data = extractReportData();
        console.log('Extracted data:', data);

        const extractedDataDiv = document.getElementById("extracted-data");
        
        // Build the display string in the format: CAR no | Raised Date | Stage Owner | Target Date | Status
        let displayText = '';
        
        // CAR Number
        const carNo = data.carID || 'Unknown';
        
        // Raised Date
        const raisedDate = data.raisedDate || 'Unknown';
        
        // Determine which stage data to show based on Investigation completion status
        let stageOwner = '';
        let targetDate = '';
        let status = '';
        
        if (data.currentStage === 'qa-followup') {
            // Investigation is completed, show QA Follow-up
            stageOwner = data.qaFollowupStageOwner || 'Unknown';
            targetDate = data.qaFollowupTargetDate || 'Unknown';
            status = data.qaFollowupStatus || 'QA Follow-up';
        } else if (data.currentStage === 'investigation') {
            // Investigation is not completed, show Investigation
            stageOwner = data.investigationStageOwner || 'Unknown';
            targetDate = data.investigationTargetDate || 'Unknown';
            status = data.investigationStatus || 'Investigation';
        } else {
            stageOwner = 'Unknown';
            targetDate = 'Unknown';
            status = 'No active stage';
        }
        
        // Format: CAR no | Raised Date | Stage Owner | Target Date | Status
        displayText = `<strong>${carNo}</strong> | ${raisedDate} | ${stageOwner} | ${targetDate} | ${status}`;

        extractedDataDiv.innerHTML = displayText;
        
        // Store data for copying
        window.haesl_extracted_data = data;
        
        return data;
    }

    // Function to copy data to clipboard
    function copyDataToClipboard() {
        const data = window.haesl_extracted_data || extractReportData();
        
        // Format: CAR no | Raised Date | Stage Owner | Target Date | Status
        const carNo = data.carID || 'Unknown';
        const raisedDate = data.raisedDate || 'Unknown';
        
        let stageOwner = '';
        let targetDate = '';
        let status = '';
        
        if (data.currentStage === 'qa-followup') {
            stageOwner = data.qaFollowupStageOwner || 'Unknown';
            targetDate = data.qaFollowupTargetDate || 'Unknown';
            status = data.qaFollowupStatus || 'QA Follow-up';
        } else if (data.currentStage === 'investigation') {
            stageOwner = data.investigationStageOwner || 'Unknown';
            targetDate = data.investigationTargetDate || 'Unknown';
            status = data.investigationStatus || 'Investigation';
        } else {
            stageOwner = 'Unknown';
            targetDate = 'Unknown';
            status = 'No active stage';
        }
        
        const copyText = `${carNo} | ${raisedDate} | ${stageOwner} | ${targetDate} | ${status}`;

        navigator.clipboard.writeText(copyText).then(() => {
            const button = document.getElementById("copy-data");
            const originalText = button.textContent;
            button.textContent = '✅ Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            // Fallback method
            const textArea = document.createElement('textarea');
            textArea.value = copyText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Data copied to clipboard');
        });
    }

    // Function to toggle debug information
    function toggleDebugInfo() {
        let debugDiv = document.getElementById("debug-info");
        
        if (!debugDiv) {
            debugDiv = document.createElement("div");
            debugDiv.id = "debug-info";
            document.getElementById("haesl-data-panel").appendChild(debugDiv);
            
            const stages = document.querySelectorAll("li.stage-li");
            const userLinks = document.querySelectorAll('a[href*="UserProfile"]');
            const detailsLabels = document.querySelectorAll('div.details-label');
            
            debugDiv.innerHTML = `
                <strong>Debug Information:</strong><br>
                Stages found: ${stages.length}<br>
                User profile links: ${userLinks.length}<br>
                Details labels: ${detailsLabels.length}<br>
                Investigation completed: ${data.investigationCompleted || false}<br>
                Current stage: ${data.currentStage || 'none'}<br>
                Raised date: ${data.raisedDate || 'not found'}<br>
                <br>
                <strong>Extracted Data:</strong><br>
                CAR ID: ${data.carID || 'none'}<br>
                Raised Date: ${data.raisedDate || 'none'}<br>
                Inv Owner: ${data.investigationStageOwner || 'none'}<br>
                Inv Target: ${data.investigationTargetDate || 'none'}<br>
                Inv Status: ${data.investigationStatus || 'none'}<br>
                QA Owner: ${data.qaFollowupStageOwner || 'none'}<br>
                QA Target: ${data.qaFollowupTargetDate || 'none'}<br>
                QA Status: ${data.qaFollowupStatus || 'none'}<br>
            `;
        }
        
        debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
    }

    // Automatically display data after a delay (like in sample script)
    setTimeout(displayExtractedData, 3000); // Wait for 3 seconds before running the script

    // Add event listeners for buttons
    document.getElementById("refresh-data").addEventListener("click", () => {
        displayExtractedData(); // Manually refresh data
    });

    document.getElementById("copy-data").addEventListener("click", copyDataToClipboard);

    document.getElementById("toggle-debug").addEventListener("click", toggleDebugInfo);

})();
