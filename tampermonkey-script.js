// ==UserScript==
// @name         HAESL Report Data Extractor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Extract Investigation and QA Follow up data from HAESL reports
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
                // Check if key elements are present
                const staticContainers = document.querySelectorAll('.staticTextContainer');
                if (staticContainers.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkForElements, 1000);
                }
            };
            checkForElements();
        });
    }
    
    // Function to extract data from the report
    function extractReportData() {
        const data = {
            investigationStageOwner: '',
            investigationTargetDate: '',
            qaFollowupStageOwner: '',
            qaFollowupTargetDate: ''
        };
        
        try {
            // Look for static text containers that might contain our data
            const staticContainers = document.querySelectorAll('.staticTextContainer');
            
            staticContainers.forEach(container => {
                const textContent = container.textContent || container.innerText;
                
                // Look for investigation stage owner
                if (textContent.includes('Investigation') && textContent.includes('Stage')) {
                    // Try to find user links or names within this container
                    const userLinks = container.querySelectorAll('a[href*="UserProfile"]');
                    if (userLinks.length > 0) {
                        data.investigationStageOwner = userLinks[0].textContent.trim();
                    }
                }
                
                // Look for QA Follow up stage owner
                if (textContent.includes('QA') && textContent.includes('Follow') && textContent.includes('up')) {
                    const userLinks = container.querySelectorAll('a[href*="UserProfile"]');
                    if (userLinks.length > 0) {
                        data.qaFollowupStageOwner = userLinks[0].textContent.trim();
                    }
                }
            });
            
            // Alternative approach: Look for specific patterns in the DOM
            // Based on the image, look for user profile links
            const userProfileLinks = document.querySelectorAll('a[href*="/Account/UserProfile/UserProfileCardPartial/"]');
            userProfileLinks.forEach(link => {
                const linkText = link.textContent.trim();
                const parentElement = link.closest('.staticTextContainer');
                
                if (parentElement) {
                    const context = parentElement.textContent || parentElement.innerText;
                    
                    // Determine context based on surrounding text
                    if (context.toLowerCase().includes('investigation') && context.toLowerCase().includes('stage')) {
                        data.investigationStageOwner = linkText;
                    } else if (context.toLowerCase().includes('qa') && context.toLowerCase().includes('follow')) {
                        data.qaFollowupStageOwner = linkText;
                    }
                }
            });
            
            // Look for target dates
            // Dates might be in format MM/dd/yyyy or similar
            const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
            const allText = document.body.textContent || document.body.innerText;
            const dateMatches = allText.match(datePattern);
            
            // You'll need to refine this based on the actual structure
            // For now, let's look for dates near "Target Date" text
            const targetDateElements = document.querySelectorAll('*');
            targetDateElements.forEach(element => {
                const text = element.textContent || element.innerText;
                if (text.includes('Target Date') && text.match(datePattern)) {
                    const dateMatch = text.match(datePattern);
                    if (dateMatch) {
                        const context = text.toLowerCase();
                        if (context.includes('investigation')) {
                            data.investigationTargetDate = dateMatch[0];
                        } else if (context.includes('qa') || context.includes('follow')) {
                            data.qaFollowupTargetDate = dateMatch[0];
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Error extracting data:', error);
        }
        
        return data;
    }
    
    // Function to display extracted data
    function displayData(data) {
        // Create a floating panel to show the extracted data
        const panel = document.createElement('div');
        panel.id = 'haesl-data-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: #fff;
            border: 2px solid #007acc;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 12px;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #007acc;">HAESL Report Data</h3>
                <button id="close-panel" style="background: #ff4444; color: white; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer;">×</button>
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Investigation Stage Owner:</strong><br>
                <span style="color: #333;">${data.investigationStageOwner || 'Not found'}</span>
            </div>
            <div style="margin-bottom: 8px;">
                <strong>Investigation Target Date:</strong><br>
                <span style="color: #333;">${data.investigationTargetDate || 'Not found'}</span>
            </div>
            <div style="margin-bottom: 8px;">
                <strong>QA Follow up Stage Owner:</strong><br>
                <span style="color: #333;">${data.qaFollowupStageOwner || 'Not found'}</span>
            </div>
            <div style="margin-bottom: 15px;">
                <strong>QA Follow up Target Date:</strong><br>
                <span style="color: #333;">${data.qaFollowupTargetDate || 'Not found'}</span>
            </div>
            <button id="copy-data" style="background: #007acc; color: white; border: none; border-radius: 3px; padding: 8px 12px; cursor: pointer; width: 100%;">
                Copy to Clipboard
            </button>
        `;
        
        document.body.appendChild(panel);
        
        // Add close functionality
        document.getElementById('close-panel').addEventListener('click', () => {
            panel.remove();
        });
        
        // Add copy functionality
        document.getElementById('copy-data').addEventListener('click', () => {
            const dataText = `Investigation Stage Owner: ${data.investigationStageOwner}
Investigation Target Date: ${data.investigationTargetDate}
QA Follow up Stage Owner: ${data.qaFollowupStageOwner}
QA Follow up Target Date: ${data.qaFollowupTargetDate}`;
            
            navigator.clipboard.writeText(dataText).then(() => {
                const button = document.getElementById('copy-data');
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.style.background = '#28a745';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '#007acc';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Failed to copy to clipboard');
            });
        });
    }
    
    // Main execution
    async function main() {
        console.log('HAESL Report Data Extractor loaded');
        
        // Wait for elements to load
        await waitForElements();
        
        // Small delay to ensure all dynamic content is loaded
        setTimeout(() => {
            const extractedData = extractReportData();
            console.log('Extracted data:', extractedData);
            displayData(extractedData);
        }, 2000);
    }
    
    // Run the script
    main();
    
})();
