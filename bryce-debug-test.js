// ==UserScript==
// @name         HAESL Debug Test for Bryce
// @namespace    http://tampermonkey.net/
// @version      debug-1.0
// @description  Simple test to diagnose issues for Bryce Lee
// @author       You
// @match        https://haesl.gaelenlighten.com/*
// @match        https://apps-exl.haesl.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    console.log('🔧 HAESL Debug Test Started');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Page Title:', document.title);
    console.log('📍 User Agent:', navigator.userAgent);

    // Create a simple test ribbon
    function createTestRibbon() {
        // Remove any existing test ribbon
        const existingRibbon = document.getElementById('haesl-test-ribbon');
        if (existingRibbon) {
            existingRibbon.remove();
        }

        const ribbon = document.createElement('div');
        ribbon.id = 'haesl-test-ribbon';
        ribbon.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 350px;
            background: #2d3748;
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 2px solid #4a5568;
        `;

        const userFingerprint = generateTestFingerprint();
        
        ribbon.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; color: #68d391;">🔧 HAESL Debug Test</div>
            <div style="margin-bottom: 5px;"><strong>URL:</strong> ${window.location.href}</div>
            <div style="margin-bottom: 5px;"><strong>Your ID:</strong> ${userFingerprint}</div>
            <div style="margin-bottom: 5px;"><strong>Expected:</strong> TUFWTzVH (Bryce)</div>
            <div style="margin-bottom: 5px;"><strong>Match:</strong> ${userFingerprint === 'TUFWTzVH' ? '✅ YES' : '❌ NO'}</div>
            <div style="margin-bottom: 10px;"><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
            <button id="testGitHub" style="background: #4299e1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Test GitHub</button>
            <button id="testScript" style="background: #48bb78; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Load Script</button>
            <div id="testResults" style="margin-top: 10px; padding: 10px; background: #1a202c; border-radius: 4px; font-size: 11px;"></div>
        `;

        document.body.appendChild(ribbon);

        // Add event listeners
        document.getElementById('testGitHub').addEventListener('click', testGitHubAccess);
        document.getElementById('testScript').addEventListener('click', testScriptLoading);

        console.log('🎯 Test ribbon created with ID:', userFingerprint);
    }

    // Generate user fingerprint (same method as main script)
    function generateTestFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('HAESL_CAR_USER', 2, 2);
        const fingerprint = canvas.toDataURL();
        return btoa(fingerprint.slice(-30)).slice(0, 8);
    }

    // Test GitHub access
    function testGitHubAccess() {
        const resultsDiv = document.getElementById('testResults');
        resultsDiv.innerHTML = '<div style="color: #fbb6ce;">Testing GitHub access...</div>';

        const accessUrl = 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/access-control.json?t=' + Date.now();
        
        console.log('🔍 Testing GitHub URL:', accessUrl);

        GM_xmlhttpRequest({
            method: 'GET',
            url: accessUrl,
            onload: function(response) {
                console.log('📡 GitHub Response:', response.status, response.statusText);
                
                let resultHtml = `<div style="color: #68d391;">✅ GitHub Response: ${response.status}</div>`;
                
                if (response.status === 200) {
                    try {
                        const accessControl = JSON.parse(response.responseText);
                        const userFingerprint = generateTestFingerprint();
                        const user = accessControl.authorizedUsers?.find(u => u.id === userFingerprint);
                        
                        resultHtml += `<div>System enabled: ${accessControl.enabled}</div>`;
                        resultHtml += `<div>User found: ${user ? '✅' : '❌'}</div>`;
                        if (user) {
                            resultHtml += `<div>User: ${user.name}</div>`;
                            resultHtml += `<div>Enabled: ${user.enabled}</div>`;
                            resultHtml += `<div>Expires: ${user.expires}</div>`;
                        }
                        
                        console.log('📋 Access Control:', accessControl);
                        console.log('👤 User Record:', user);
                        
                    } catch (e) {
                        resultHtml += `<div style="color: #feb2b2;">❌ JSON Parse Error: ${e.message}</div>`;
                    }
                } else {
                    resultHtml += `<div style="color: #feb2b2;">❌ Failed: ${response.status} ${response.statusText}</div>`;
                }
                
                resultsDiv.innerHTML = resultHtml;
            },
            onerror: function(error) {
                console.error('❌ GitHub Error:', error);
                resultsDiv.innerHTML = `<div style="color: #feb2b2;">❌ Network Error: ${error}</div>`;
            }
        });
    }

    // Test script loading
    function testScriptLoading() {
        const resultsDiv = document.getElementById('testResults');
        resultsDiv.innerHTML = '<div style="color: #fbb6ce;">Testing script loading...</div>';

        const scriptUrl = 'https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/car-extractor-clean.js?t=' + Date.now();
        
        console.log('📥 Testing Script URL:', scriptUrl);

        const script = document.createElement('script');
        script.src = scriptUrl;
        
        script.onload = function() {
            console.log('✅ Script loaded successfully');
            resultsDiv.innerHTML = '<div style="color: #68d391;">✅ Script loaded successfully!</div>';
        };
        
        script.onerror = function() {
            console.error('❌ Script loading failed');
            resultsDiv.innerHTML = '<div style="color: #feb2b2;">❌ Script loading failed</div>';
        };
        
        document.head.appendChild(script);
    }

    // Initialize test
    function initializeTest() {
        console.log('🚀 Initializing HAESL Debug Test');
        
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(createTestRibbon, 1000);
            });
        } else {
            setTimeout(createTestRibbon, 1000);
        }
    }

    // Start the test
    initializeTest();

})();
