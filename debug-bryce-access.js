// ==UserScript==
// @name         HAESL CAR Extractor - Debug for Bryce
// @namespace    http://tampermonkey.net/
// @version      debug-bryce-1.0
// @description  Debug version to troubleshoot Bryce Lee's access
// @author       You
// @match        https://apps-exl.haesl.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    // Debug display
    function createDebugDisplay() {
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            background: #1a1a1a;
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            border: 2px solid #333;
            max-height: 300px;
            overflow-y: auto;
        `;
        debugDiv.id = 'bryceDebugDisplay';
        document.body.appendChild(debugDiv);
        return debugDiv;
    }

    function addDebugLine(message, type = 'info') {
        const debugDiv = document.getElementById('bryceDebugDisplay');
        if (!debugDiv) return;
        
        const line = document.createElement('div');
        line.style.cssText = `
            margin: 3px 0;
            padding: 2px 5px;
            border-radius: 3px;
            background: ${type === 'error' ? '#441' : type === 'success' ? '#141' : '#333'};
        `;
        line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        debugDiv.appendChild(line);
        debugDiv.scrollTop = debugDiv.scrollHeight;
    }

    // Generate user fingerprint (same as main script)
    function generateUserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Fingerprint test 🔒', 2, 2);
        const canvasFingerprint = canvas.toDataURL();

        const fingerprint = btoa(
            navigator.userAgent + 
            navigator.language + 
            screen.width + 'x' + screen.height + 
            new Date().getTimezoneOffset() +
            canvasFingerprint.slice(-50)
        ).slice(0, 8);

        return fingerprint;
    }

    // Check access control
    function checkAccess() {
        const userFingerprint = generateUserFingerprint();
        addDebugLine(`User Fingerprint: ${userFingerprint}`, 'info');
        addDebugLine(`Expected Bryce ID: TUFWTzVH`, 'info');
        addDebugLine(`Match: ${userFingerprint === 'TUFWTzVH' ? 'YES' : 'NO'}`, userFingerprint === 'TUFWTzVH' ? 'success' : 'error');

        const githubUrl = 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/access-control.json';
        addDebugLine(`Fetching access control from GitHub...`, 'info');

        GM_xmlhttpRequest({
            method: 'GET',
            url: githubUrl + '?t=' + Date.now(),
            onload: function(response) {
                addDebugLine(`GitHub Response Status: ${response.status}`, response.status === 200 ? 'success' : 'error');
                
                if (response.status === 200) {
                    try {
                        const accessControl = JSON.parse(response.responseText);
                        addDebugLine(`Access control loaded successfully`, 'success');
                        addDebugLine(`System enabled: ${accessControl.enabled}`, 'info');
                        addDebugLine(`Maintenance mode: ${accessControl.globalSettings.maintenanceMode}`, 'info');
                        
                        const user = accessControl.authorizedUsers.find(u => u.id === userFingerprint);
                        if (user) {
                            addDebugLine(`User found: ${user.name}`, 'success');
                            addDebugLine(`User enabled: ${user.enabled}`, 'info');
                            addDebugLine(`Expires: ${user.expires}`, 'info');
                            
                            const now = new Date();
                            const expiry = new Date(user.expires);
                            addDebugLine(`Current time: ${now.toISOString()}`, 'info');
                            addDebugLine(`Expiry time: ${expiry.toISOString()}`, 'info');
                            addDebugLine(`Not expired: ${now < expiry ? 'YES' : 'NO'}`, now < expiry ? 'success' : 'error');
                            
                            if (user.enabled && now < expiry && accessControl.enabled && !accessControl.globalSettings.maintenanceMode) {
                                addDebugLine(`ACCESS GRANTED - Loading main script...`, 'success');
                                loadMainScript();
                            } else {
                                addDebugLine(`ACCESS DENIED - Check conditions above`, 'error');
                            }
                        } else {
                            addDebugLine(`User not found in authorized list`, 'error');
                            addDebugLine(`Available user IDs:`, 'info');
                            accessControl.authorizedUsers.forEach(u => {
                                addDebugLine(`  - ${u.id} (${u.name})`, 'info');
                            });
                        }
                    } catch (e) {
                        addDebugLine(`Error parsing access control: ${e.message}`, 'error');
                    }
                } else {
                    addDebugLine(`Failed to fetch access control: ${response.status} ${response.statusText}`, 'error');
                }
            },
            onerror: function(error) {
                addDebugLine(`Network error: ${error}`, 'error');
            }
        });
    }

    // Load main script if access is granted
    function loadMainScript() {
        addDebugLine(`ACCESS GRANTED - Loading clean script version...`, 'success');
        
        // Load the clean version without anti-tampering
        const script = document.createElement('script');
        script.src = 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/car-extractor-clean.js?t=' + Date.now();
        script.onload = function() {
            addDebugLine(`Clean main script loaded successfully`, 'success');
        };
        script.onerror = function() {
            addDebugLine(`Error loading clean script, trying original...`, 'error');
            
            // Fallback to original
            const fallbackScript = document.createElement('script');
            fallbackScript.src = 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/car-extractor-main.js?t=' + Date.now();
            fallbackScript.onload = function() {
                addDebugLine(`Fallback script loaded`, 'success');
            };
            fallbackScript.onerror = function() {
                addDebugLine(`Both scripts failed to load`, 'error');
            };
            document.head.appendChild(fallbackScript);
        };
        
        document.head.appendChild(script);
    }

    // Initialize
    function init() {
        // Wait for page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        createDebugDisplay();
        addDebugLine(`Debug started for: ${window.location.href}`, 'info');
        addDebugLine(`Page title: ${document.title}`, 'info');
        
        // Check if we're on the right page
        if (window.location.href.includes('apps-exl.haesl.com')) {
            setTimeout(() => {
                checkAccess();
            }, 1000);
        } else {
            addDebugLine(`Not on HAESL page, waiting...`, 'info');
        }
    }

    init();
})();
