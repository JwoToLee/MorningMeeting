#!/bin/bash
# HAESL CAR Extractor - Protected Installation Script
# Run this script to create a protected version for distribution

echo "🔒 HAESL CAR Extractor Protection Tool"
echo "======================================"

# Check if original script exists
if [ ! -f "tampermonkey-batch-extractor-fixed.js" ]; then
    echo "❌ Original script not found!"
    echo "Make sure tampermonkey-batch-extractor-fixed.js is in the current directory"
    exit 1
fi

echo "📁 Creating protected version..."

# Create protected directory
mkdir -p protected-distribution

# Copy original for backup
cp tampermonkey-batch-extractor-fixed.js protected-distribution/original-backup.js

echo "✅ Files prepared for protection"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Go to https://obfuscator.io/"
echo "2. Upload: tampermonkey-batch-extractor-fixed.js" 
echo "3. Use these settings:"
echo "   - Self Defending: ON"
echo "   - Debug Protection: ON"
echo "   - Disable Console Output: ON"
echo "   - Control Flow Flattening: ON"
echo "   - String Array Encoding: base64"
echo "   - Dead Code Injection: ON"
echo ""
echo "4. Download obfuscated file as 'car-extractor-protected.js'"
echo "5. Share ONLY the protected version with colleagues"
echo ""
echo "🛡️ SECURITY FEATURES ADDED:"
echo "- Anti-debugging protection"
echo "- Console output disabled"  
echo "- Developer tools detection"
echo "- Self-defending code"
echo ""
echo "📨 DISTRIBUTION:"
echo "- Colleagues install the protected version"
echo "- They cannot view or edit the source code"
echo "- Functionality remains 100% intact"
echo "- You maintain the original for updates"

# Create installation instructions
cat > protected-distribution/INSTALLATION-INSTRUCTIONS.txt << EOF
HAESL CAR Batch Extractor - Installation Instructions
====================================================

FOR COLLEAGUES RECEIVING THE PROTECTED SCRIPT:

1. Install Tampermonkey browser extension if not already installed
2. Open Tampermonkey Dashboard (click the extension icon)
3. Click "Create a new script"
4. Delete all default content
5. Copy and paste the entire content of car-extractor-protected.js
6. Save the script (Ctrl+S)
7. Enable the script (toggle should be ON)
8. Navigate to HAESL reporting page to use

USAGE:
- The script will appear as a dark ribbon on the left side
- Use the buttons to extract CAR data
- Right-click individual entries to refresh
- Use the minimize button (-) to hide the ribbon

IMPORTANT:
- This script is protected and cannot be modified
- Do not attempt to edit or debug the code
- Contact the script author for updates or issues
- The script only works on HAESL domains

TROUBLESHOOTING:
- If script doesn't load, disable and re-enable it
- Clear browser cache if issues persist  
- Make sure you're on the correct HAESL page
- Check that Tampermonkey has permissions for the site
EOF

echo ""
echo "📄 Installation instructions created in: protected-distribution/INSTALLATION-INSTRUCTIONS.txt"
echo "✅ Protection setup complete!"
