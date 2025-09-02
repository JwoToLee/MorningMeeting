// ==UserScript==
// @name         HAESL CAR Extractor - LOCAL ACCESS (Temporary)
// @namespace    http://tampermonkey.net/
// @version      1.0.local
// @description  Temporary local version with bypass - for immediate testing
// @author       You
// @match        https://haesl.gaelenlighten.com/Reporting/ReportingManagement*
// @match        https://haesl.gaelenlighten.com/Reporting/Report/Index/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('🚀 HAESL CAR Extractor - LOCAL VERSION (BYPASS MODE)');
    console.log('⚠️ This version bypasses remote access control for testing');
    
    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b00;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 999999;
        font-family: monospace;
        font-size: 12px;
    `;
    notification.textContent = '⚠️ LOCAL BYPASS MODE - Testing Only';
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
    
    // PASTE YOUR ORIGINAL CAR EXTRACTOR CODE HERE
    // (Everything from tampermonkey-batch-extractor-fixed.js)
    // This bypasses the remote access control for immediate testing
    
    console.log('✅ Local version loaded - script functionality available');
    console.log('🔧 Switch back to remote version once GitHub access is working');
    
})();
