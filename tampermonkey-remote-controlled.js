// ==UserScript==
// @name         CAR Batch Extraction
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Remote controlled CAR data extractor with GitHub access management
// @author       You
// @match        https://haesl.gaelenlighten.com/Reporting/ReportingManagement*
// @match        https://haesl.gaelenlighten.com/Reporting/Report/Index/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @connect      github.com
// ==/UserScript==

(function() {
    'use strict';
    
    // GitHub Configuration - UPDATE THESE URLs TO YOUR REPOSITORY
    const GITHUB_CONFIG = {
        owner: 'JwoToLee',                    // Your GitHub username
        repo: 'MorningMeeting',               // Your repository name
        branch: 'main',                       // Branch name
        accessControlFile: 'access-control.json',
        mainScriptFile: 'car-extractor-main.js'
    };
    
    // Generate URLs
    const URLS = {
        accessControl: `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.accessControlFile}`,
        mainScript: `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.mainScriptFile}`
    };
    
    console.log('🔗 GitHub URLs configured:', URLS);
    
    // User identification system
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
    let accessGranted = false;
    let mainScriptLoaded = false;
    
    console.log(`👤 User Fingerprint: ${USER_ID}`);
    
    // Access control functions
    async function checkAccess() {
        try {
            console.log('🔍 Checking GitHub access control...');
            
            const response = await fetch(URLS.accessControl + '?t=' + Date.now(), {
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`GitHub access failed: ${response.status}`);
            }
            
            const config = await response.json();
            console.log('📋 Access config loaded, version:', config.version);
            
            // Check global enable status
            if (!config.enabled) {
                showMessage('🚫 System Disabled', 'The CAR extractor system is currently disabled.', 'error');
                return false;
            }
            
            // Check maintenance mode
            if (config.globalSettings?.maintenanceMode) {
                showMessage('🔧 Maintenance Mode', config.messages?.maintenance || 'System under maintenance', 'warning');
                return false;
            }
            
            // Check user authorization
            const authorizedUser = config.authorizedUsers?.find(user => 
                user.id === USER_ID || user.id === 'all_users'
            );
            
            if (!authorizedUser) {
                showMessage('🚫 Access Denied', `User ID ${USER_ID} not authorized. Contact administrator.`, 'error');
                return false;
            }
            
            if (!authorizedUser.enabled) {
                showMessage('🚫 Access Disabled', 'Your access has been disabled.', 'error');
                return false;
            }
            
            // Check expiration
            if (authorizedUser.expires && new Date(authorizedUser.expires) < new Date()) {
                showMessage('⏰ Access Expired', 'Your access has expired.', 'error');
                return false;
            }
            
            console.log(`✅ Access granted for: ${authorizedUser.name || 'User ' + USER_ID}`);
            showMessage('✅ Access Granted', `Welcome ${authorizedUser.name || 'User'}! Loading CAR extractor...`, 'success');
            
            return true;
            
        } catch (error) {
            console.error('❌ Access check failed:', error);
            showMessage('🔌 Connection Error', 'Cannot verify access. Check internet connection.', 'error');
            return false;
        }
    }
    
    // Load main script from GitHub
    async function loadMainScript() {
        try {
            console.log('📥 Loading main script from GitHub...');
            
            const response = await fetch(URLS.mainScript + '?t=' + Date.now(), {
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`Script load failed: ${response.status}`);
            }
            
            let scriptCode = await response.text();
            
            // Remove UserScript headers if present
            scriptCode = scriptCode.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\s*/, '');
            
            // Remove the outer function wrapper
            scriptCode = scriptCode.replace(/^\(function\(\)\s*{\s*['"]use strict['"];\s*/, '');
            scriptCode = scriptCode.replace(/\}\)\(\);?\s*$/, '');
            
            // Execute the script
            const scriptElement = document.createElement('script');
            scriptElement.textContent = `
                (function() {
                    'use strict';
                    console.log('🚀 Executing main CAR extractor script...');
                    ${scriptCode}
                })();
            `;
            
            document.head.appendChild(scriptElement);
            mainScriptLoaded = true;
            
            console.log('✅ Main script loaded successfully');
            
            // Update status message
            setTimeout(() => {
                hideMessage();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Failed to load main script:', error);
            showMessage('📥 Load Error', 'Failed to load main script components.', 'error');
        }
    }
    
    // Message display system
    function showMessage(title, message, type = 'info') {
        // Remove existing message
        const existing = document.getElementById('haesl-access-message');
        if (existing) existing.remove();
        
        const colors = {
            success: { bg: '#28a745', border: '#1e7e34' },
            error: { bg: '#dc3545', border: '#c82333' },
            warning: { bg: '#ffc107', border: '#e0a800', text: '#212529' },
            info: { bg: '#17a2b8', border: '#138496' }
        };
        
        const color = colors[type] || colors.info;
        
        const messageDiv = document.createElement('div');
        messageDiv.id = 'haesl-access-message';
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color.bg};
            color: ${color.text || 'white'};
            border: 2px solid ${color.border};
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 999999;
            font-family: 'Consolas', monospace;
            font-size: 13px;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        messageDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
            <div>${message}</div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(hideMessage, 3000);
        }
    }
    
    function hideMessage() {
        const message = document.getElementById('haesl-access-message');
        if (message) message.remove();
    }
    
    // Periodic access verification
    function startPeriodicCheck() {
        setInterval(async () => {
            console.log('🔄 Periodic access verification...');
            const hasAccess = await checkAccess();
            
            if (!hasAccess && mainScriptLoaded) {
                console.log('⚠️ Access revoked - reloading page');
                showMessage('🚫 Access Revoked', 'Your access has been revoked. Page will reload.', 'error');
                setTimeout(() => location.reload(), 3000);
            }
        }, 300000); // Check every 5 minutes
    }
    
    // Initialize the remote access system
    async function initialize() {
        console.log('🔐 HAESL CAR Extractor - Remote Access Control System');
        console.log(`👤 User ID: ${USER_ID}`);
        console.log('🔗 Checking GitHub repository for access...');
        
        const hasAccess = await checkAccess();
        
        if (hasAccess) {
            accessGranted = true;
            await loadMainScript();
            startPeriodicCheck();
        }
    }
    
    // Wait for page load then initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();
