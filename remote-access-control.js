// Remote Access Control System for HAESL CAR Extractor
// This script checks GitHub for access permissions before allowing script execution

(function() {
    'use strict';
    
    // Configuration
    const GITHUB_CONFIG = {
        // Replace with your actual GitHub raw file URL
        accessControlUrl: 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/access-control.json',
        fallbackUrl: 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/access-control.json',
        checkInterval: 300000, // Check every 5 minutes (300000ms)
        timeout: 10000 // 10 second timeout
    };
    
    // User identification (you can customize this)
    const USER_CONFIG = {
        // This could be based on email, computer name, or manual ID
        userId: getUserId(),
        computerName: getComputerName(),
        userAgent: navigator.userAgent
    };
    
    let accessGranted = false;
    let accessConfig = null;
    let scriptEnabled = false;
    
    // Function to get user ID (customize as needed)
    function getUserId() {
        // Option 1: Prompt user for ID (simple)
        // return prompt('Enter your authorized user ID:');
        
        // Option 2: Use computer/browser fingerprint
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('User fingerprint', 2, 2);
        const fingerprint = canvas.toDataURL();
        return btoa(fingerprint.slice(-50)).slice(0, 10);
        
        // Option 3: Use domain-based identification
        // return window.location.hostname + '_' + new Date().getTime().toString().slice(-6);
    }
    
    function getComputerName() {
        return navigator.platform + '_' + navigator.language;
    }
    
    // Function to check access with GitHub
    async function checkRemoteAccess() {
        console.log('🔐 Checking remote access permissions...');
        
        try {
            const response = await fetch(GITHUB_CONFIG.accessControlUrl, {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const config = await response.json();
            accessConfig = config;
            
            console.log('📡 Remote config loaded:', config.version);
            
            // Check global settings
            if (!config.enabled) {
                showAccessDenied('System is globally disabled');
                return false;
            }
            
            if (config.globalSettings.maintenanceMode) {
                showAccessDenied(config.messages.maintenance);
                return false;
            }
            
            // Check user authorization
            const user = config.authorizedUsers.find(u => 
                u.id === USER_CONFIG.userId || 
                u.email === USER_CONFIG.userEmail
            );
            
            if (!user) {
                showAccessDenied('User not found in authorized list');
                return false;
            }
            
            if (!user.enabled) {
                showAccessDenied('User access is disabled');
                return false;
            }
            
            // Check expiration
            if (user.expires && new Date(user.expires) < new Date()) {
                showAccessDenied(config.messages.expired);
                return false;
            }
            
            console.log(`✅ Access granted for user: ${user.name}`);
            accessGranted = true;
            
            // Apply remote settings
            applyRemoteSettings(config);
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to check remote access:', error);
            
            // Fallback behavior - you can customize this
            showAccessDenied('Unable to verify access. Please check your connection.');
            return false;
        }
    }
    
    function applyRemoteSettings(config) {
        // Apply global settings to the script
        if (config.globalSettings.debugMode) {
            console.log('🐛 Debug mode enabled by remote config');
        }
        
        // You can add more remote configuration here
        window.REMOTE_CONFIG = config;
    }
    
    function showAccessDenied(message) {
        console.log('🚫 Access Denied:', message);
        
        // Create access denied overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            color: #ff4444;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 999999;
            font-family: 'Consolas', monospace;
            font-size: 18px;
            text-align: center;
        `;
        
        overlay.innerHTML = `
            <div style="border: 2px solid #ff4444; padding: 30px; border-radius: 10px; background: #1a1a1a;">
                <h2 style="color: #ff4444; margin-bottom: 20px;">🚫 ACCESS DENIED</h2>
                <p style="margin-bottom: 20px;">${message}</p>
                <p style="font-size: 14px; color: #888;">Contact the administrator for access.</p>
                <p style="font-size: 12px; color: #666; margin-top: 20px;">User ID: ${USER_CONFIG.userId}</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Prevent script execution
        accessGranted = false;
        scriptEnabled = false;
    }
    
    function showAccessGranted(config) {
        console.log('✅ Access Granted - Script Enabled');
        
        // Show brief success message
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 999999;
            font-family: 'Consolas', monospace;
            font-size: 12px;
        `;
        
        notification.textContent = '✅ Access Verified - HAESL CAR Extractor Enabled';
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
        accessGranted = true;
        scriptEnabled = true;
        
        // Initialize the main script
        initializeMainScript();
    }
    
    // Function to initialize the main CAR extractor script
    function initializeMainScript() {
        if (!accessGranted || !scriptEnabled) {
            console.log('🚫 Script initialization blocked - access not granted');
            return;
        }
        
        console.log('🚀 Initializing HAESL CAR Extractor...');
        
        // Here you would put your original script code
        // Or load it dynamically from another GitHub file
        loadMainScriptFromGitHub();
    }
    
    // Function to load the main script from GitHub
    async function loadMainScriptFromGitHub() {
        try {
            console.log('📥 Loading main script from GitHub...');
            
            const scriptUrl = 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/car-extractor-main.js';
            const response = await fetch(scriptUrl);
            
            if (!response.ok) {
                throw new Error(`Failed to load main script: ${response.status}`);
            }
            
            const scriptCode = await response.text();
            
            // Execute the main script
            const scriptElement = document.createElement('script');
            scriptElement.textContent = scriptCode;
            document.head.appendChild(scriptElement);
            
            console.log('✅ Main script loaded and executed');
            
        } catch (error) {
            console.error('❌ Failed to load main script:', error);
            showAccessDenied('Failed to load main script components');
        }
    }
    
    // Periodic access check
    function startPeriodicAccessCheck() {
        setInterval(async () => {
            console.log('🔄 Performing periodic access check...');
            const hasAccess = await checkRemoteAccess();
            
            if (!hasAccess && scriptEnabled) {
                // Access was revoked
                console.log('⚠️ Access revoked - disabling script');
                scriptEnabled = false;
                location.reload(); // Reload page to disable script
            }
        }, GITHUB_CONFIG.checkInterval);
    }
    
    // Initialize access control system
    async function initializeAccessControl() {
        console.log('🔐 Initializing Remote Access Control System...');
        console.log('👤 User ID:', USER_CONFIG.userId);
        console.log('💻 Computer:', USER_CONFIG.computerName);
        
        const hasAccess = await checkRemoteAccess();
        
        if (hasAccess) {
            showAccessGranted(accessConfig);
            startPeriodicAccessCheck();
        }
    }
    
    // Start the access control system
    initializeAccessControl();
    
})();
