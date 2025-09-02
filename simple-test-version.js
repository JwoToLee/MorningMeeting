// ==UserScript==
// @name         CAR Batch Extraction - Simple Test
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Simplified version for testing access issues
// @author       You
// @match        https://haesl.gaelenlighten.com/*
// @match        https://apps-exl.haesl.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @connect      github.com
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('🔐 CAR Extractor - Simple Test Version');
    console.log('📍 Current URL:', window.location.href);
    
    // User identification (same as main script)
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
    console.log(`👤 User Fingerprint: ${USER_ID}`);
    
    // Show status message
    function showStatus(message, type = 'info') {
        const existing = document.getElementById('car-status-message');
        if (existing) existing.remove();
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };
        
        const statusDiv = document.createElement('div');
        statusDiv.id = 'car-status-message';
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 999999;
            font-family: 'Consolas', monospace;
            font-size: 13px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        statusDiv.textContent = message;
        document.body.appendChild(statusDiv);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }
    
    // Simple access check
    function checkAccess() {
        showStatus('Checking access...', 'info');
        
        const accessUrl = 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/access-control.json?t=' + Date.now();
        
        GM_xmlhttpRequest({
            method: 'GET',
            url: accessUrl,
            onload: function(response) {
                console.log('📡 Access Response:', response.status, response.statusText);
                
                if (response.status === 200) {
                    try {
                        const config = JSON.parse(response.responseText);
                        console.log('📋 Access Config:', config);
                        
                        if (!config.enabled) {
                            showStatus('System is disabled', 'error');
                            return;
                        }
                        
                        const user = config.authorizedUsers?.find(u => u.id === USER_ID);
                        
                        if (!user) {
                            showStatus(`Access denied for user ${USER_ID}`, 'error');
                            console.log('Available users:', config.authorizedUsers?.map(u => `${u.id} (${u.name})`));
                            return;
                        }
                        
                        if (!user.enabled) {
                            showStatus('User access disabled', 'error');
                            return;
                        }
                        
                        const now = new Date();
                        const expiry = new Date(user.expires);
                        if (now >= expiry) {
                            showStatus('User access expired', 'error');
                            return;
                        }
                        
                        showStatus(`Access granted for ${user.name}! Loading script...`, 'success');
                        loadMainScript();
                        
                    } catch (e) {
                        showStatus('Error parsing access control: ' + e.message, 'error');
                        console.error('JSON parse error:', e);
                    }
                } else {
                    showStatus(`GitHub access failed: ${response.status}`, 'error');
                }
            },
            onerror: function(error) {
                showStatus('Network error: Cannot reach GitHub', 'error');
                console.error('Network error:', error);
            }
        });
    }
    
    // Load main script
    function loadMainScript() {
        const scriptUrl = 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/car-extractor-clean.js?t=' + Date.now();
        console.log('📥 Loading script from:', scriptUrl);
        
        const script = document.createElement('script');
        script.src = scriptUrl;
        
        script.onload = function() {
            console.log('✅ Main script loaded successfully');
            showStatus('Script loaded successfully!', 'success');
        };
        
        script.onerror = function() {
            console.error('❌ Script loading failed');
            showStatus('Script loading failed', 'error');
        };
        
        document.head.appendChild(script);
    }
    
    // Initialize
    function initialize() {
        console.log('🚀 Initializing Simple Test Version');
        
        // Check if we're on a relevant page
        const url = window.location.href;
        if (url.includes('haesl.gaelenlighten.com') || url.includes('apps-exl.haesl.com')) {
            // Wait a bit for page to load
            setTimeout(checkAccess, 2000);
        } else {
            console.log('⚠️ Not on HAESL page');
        }
    }
    
    // Start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();
