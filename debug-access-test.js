// ==UserScript==
// @name         HAESL CAR Extractor - DEBUG VERSION
// @namespace    http://tampermonkey.net/
// @version      1.0.debug
// @description  Debug version to troubleshoot access issues
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
    
    console.log('🔍 HAESL CAR Extractor - DEBUG MODE STARTED');
    
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
    
    console.log('🆔 DEBUG INFO:');
    console.log('================');
    console.log('👤 Your User Fingerprint:', USER_ID);
    console.log('🌐 User Agent:', navigator.userAgent.slice(0, 50) + '...');
    console.log('🖥️ Platform:', navigator.platform);
    console.log('🌍 Language:', navigator.language);
    console.log('📱 Screen:', screen.width + 'x' + screen.height);
    
    // Test GitHub URL access
    const ACCESS_URL = 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/access-control.json';
    
    console.log('🔗 Testing GitHub URL:', ACCESS_URL);
    
    fetch(ACCESS_URL + '?t=' + Date.now())
        .then(response => {
            console.log('📡 Response Status:', response.status);
            console.log('📡 Response OK:', response.ok);
            return response.json();
        })
        .then(config => {
            console.log('📋 Access Config Loaded:');
            console.log('   Version:', config.version);
            console.log('   Global Enabled:', config.enabled);
            console.log('   Maintenance Mode:', config.globalSettings?.maintenanceMode);
            console.log('   Authorized Users:', config.authorizedUsers?.length);
            
            console.log('👥 User List:');
            config.authorizedUsers?.forEach((user, index) => {
                console.log(`   ${index + 1}. ID: ${user.id}, Name: ${user.name}, Enabled: ${user.enabled}`);
            });
            
            // Check if current user is authorized
            const authorizedUser = config.authorizedUsers?.find(user => 
                user.id === USER_ID || user.id === 'all_users'
            );
            
            if (authorizedUser) {
                console.log('✅ ACCESS GRANTED for user:', authorizedUser.name);
                console.log('   User ID Match:', authorizedUser.id);
                console.log('   Enabled:', authorizedUser.enabled);
                console.log('   Expires:', authorizedUser.expires);
                
                // Show success message
                alert(`✅ Access Granted!\nUser: ${authorizedUser.name}\nID: ${authorizedUser.id}\nYour ID: ${USER_ID}`);
            } else {
                console.log('❌ ACCESS DENIED');
                console.log('   Your ID:', USER_ID);
                console.log('   Authorized IDs:', config.authorizedUsers?.map(u => u.id));
                
                alert(`❌ Access Denied\nYour User ID: ${USER_ID}\nThis ID is not in the authorized list.\nContact administrator to add this ID.`);
            }
        })
        .catch(error => {
            console.error('❌ GitHub Access Error:', error);
            alert(`❌ Connection Error: ${error.message}\nCannot reach GitHub repository.`);
        });
    
    // Show debug info on page
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #000;
        color: #0f0;
        padding: 10px;
        border: 1px solid #0f0;
        font-family: monospace;
        font-size: 12px;
        z-index: 999999;
        max-width: 300px;
    `;
    
    debugDiv.innerHTML = `
        <div><strong>🔍 DEBUG MODE</strong></div>
        <div>User ID: ${USER_ID}</div>
        <div>Check console (F12) for details</div>
        <div>Testing GitHub access...</div>
    `;
    
    document.body.appendChild(debugDiv);
    
})();
