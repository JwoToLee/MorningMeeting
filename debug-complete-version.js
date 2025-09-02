// ==UserScript==
// @name         HAESL CAR Extractor - COMPLETE DEBUG VERSION
// @namespace    http://tampermonkey.net/
// @version      1.0.debug-complete
// @description  Complete debug version with access control AND full functionality
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
    
    console.log('🔍 HAESL CAR Extractor - COMPLETE DEBUG MODE');
    
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
    console.log('👤 Your User Fingerprint:', USER_ID);
    
    // Test GitHub URL access and load main script
    const ACCESS_URL = 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/access-control.json';
    
    async function checkAccessAndLoadScript() {
        try {
            console.log('🔗 Testing GitHub URL:', ACCESS_URL);
            
            const response = await fetch(ACCESS_URL + '?t=' + Date.now());
            console.log('📡 Response Status:', response.status);
            
            if (!response.ok) {
                throw new Error(`GitHub access failed: ${response.status}`);
            }
            
            const config = await response.json();
            console.log('📋 Access Config Loaded - Version:', config.version);
            console.log('   Global Enabled:', config.enabled);
            console.log('   Authorized Users:', config.authorizedUsers?.length);
            
            // Check if system is enabled
            if (!config.enabled) {
                showMessage('🚫 System Disabled', 'The CAR extractor system is currently disabled.', 'error');
                return false;
            }
            
            // Check maintenance mode
            if (config.globalSettings?.maintenanceMode) {
                showMessage('🔧 Maintenance Mode', 'System under maintenance', 'warning');
                return false;
            }
            
            // Check user authorization
            const authorizedUser = config.authorizedUsers?.find(user => 
                user.id === USER_ID || user.id === 'all_users'
            );
            
            if (!authorizedUser) {
                showMessage('🚫 Access Denied', `User ID ${USER_ID} not authorized`, 'error');
                console.log('❌ Your ID:', USER_ID);
                console.log('❌ Authorized IDs:', config.authorizedUsers?.map(u => u.id));
                return false;
            }
            
            if (!authorizedUser.enabled) {
                showMessage('🚫 Access Disabled', 'Your access has been disabled', 'error');
                return false;
            }
            
            console.log('✅ Access granted for:', authorizedUser.name);
            showMessage('✅ Access Granted', `Welcome ${authorizedUser.name}! Loading CAR extractor...`, 'success');
            
            // Load and execute the main CAR extractor functionality
            loadMainScript();
            
            return true;
            
        } catch (error) {
            console.error('❌ Access check failed:', error);
            showMessage('🔌 Connection Error', 'Cannot verify access. Loading local version...', 'warning');
            
            // Load local version as fallback
            loadMainScript();
            return false;
        }
    }
    
    // Message display system
    function showMessage(title, message, type = 'info') {
        const existing = document.getElementById('haesl-debug-message');
        if (existing) existing.remove();
        
        const colors = {
            success: { bg: '#28a745', border: '#1e7e34' },
            error: { bg: '#dc3545', border: '#c82333' },
            warning: { bg: '#ffc107', border: '#e0a800', text: '#212529' },
            info: { bg: '#17a2b8', border: '#138496' }
        };
        
        const color = colors[type] || colors.info;
        
        const messageDiv = document.createElement('div');
        messageDiv.id = 'haesl-debug-message';
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
            <div style="font-size: 11px; margin-top: 5px; opacity: 0.8;">User ID: ${USER_ID}</div>
        `;
        
        document.body.appendChild(messageDiv);
        
        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) messageDiv.remove();
            }, 3000);
        }
    }
    
    // Load the main CAR extractor script functionality
    function loadMainScript() {
        console.log('🚀 Loading main CAR extractor functionality...');
        
        // TEMPORARILY LOAD LOCAL VERSION - Replace this with GitHub version later
        // For now, let's load the core functionality directly
        
        // Add the main script's CSS and functionality here
        // This is a simplified version for immediate testing
        
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
            
            body {
                margin-left: 320px !important;
                transition: margin-left 0.3s ease !important;
            }
            
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
        `);
        
        // Create simple ribbon for testing
        const ribbon = document.createElement('div');
        ribbon.id = 'car-extractor-ribbon';
        ribbon.innerHTML = `
            <div class="ribbon-header">
                <span>🔍 CAR EXTRACTOR - DEBUG MODE</span>
            </div>
            <div style="margin-bottom: 10px; padding: 10px; background: rgba(22, 27, 34, 0.6); border-radius: 4px;">
                <div style="color: #58a6ff; font-weight: bold; margin-bottom: 5px;">🆔 Debug Info:</div>
                <div style="font-size: 11px; color: #8b949e;">User ID: ${USER_ID}</div>
                <div style="font-size: 11px; color: #8b949e;">Access: Testing</div>
                <div style="font-size: 11px; color: #8b949e;">Mode: Local Debug</div>
            </div>
            <button style="width: 100%; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 10px;" onclick="alert('Debug version - basic functionality loaded!\\n\\nYour User ID: ${USER_ID}\\n\\nNext step: Add this ID to access-control.json')">Test Button</button>
            <div style="font-size: 11px; color: #656d76; font-style: italic;">
                Debug mode active. Check console for detailed logs.
            </div>
        `;
        
        document.body.appendChild(ribbon);
        
        console.log('✅ Debug ribbon loaded successfully');
        console.log('🔧 To get full functionality:');
        console.log('   1. Add your User ID to access-control.json:', USER_ID);
        console.log('   2. Push changes to GitHub');
        console.log('   3. Use the remote-controlled version');
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAccessAndLoadScript);
    } else {
        checkAccessAndLoadScript();
    }
    
})();
