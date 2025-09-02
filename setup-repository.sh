#!/bin/bash
# Complete Repository Setup Script for HAESL CAR Extractor Remote Access

echo "🔧 HAESL CAR Extractor - Repository Setup"
echo "========================================"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Initializing..."
    git init
    git branch -M main
fi

echo "📋 Current Repository Status:"
echo "============================="
git remote -v
echo ""
git status --short
echo ""

# Check if files exist
echo "📁 Checking Required Files:"
echo "============================"
files=(
    "access-control.json"
    "car-extractor-main.js" 
    "tampermonkey-remote-controlled.js"
    "REMOTE-ACCESS-SETUP.md"
    "manage-access.sh"
)

missing_files=()
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "⚠️ Missing files detected. Please ensure all required files are present."
    exit 1
fi

echo ""
echo "🔗 Testing GitHub URLs:"
echo "======================="

# Get GitHub info
GITHUB_USER=$(git config user.name || echo "Unknown")
REPO_URL=$(git config --get remote.origin.url || echo "Not set")
REPO_NAME=$(basename "$REPO_URL" .git 2>/dev/null || echo "Unknown")

echo "GitHub User: $GITHUB_USER"
echo "Repository: $REPO_NAME"
echo "Remote URL: $REPO_URL"

if [[ "$REPO_URL" == *"github.com"* ]]; then
    # Extract owner and repo from URL
    if [[ "$REPO_URL" == *"github.com/"* ]]; then
        OWNER_REPO=$(echo "$REPO_URL" | sed 's/.*github\.com[\/:]//; s/\.git$//')
        OWNER=$(echo "$OWNER_REPO" | cut -d'/' -f1)
        REPO=$(echo "$OWNER_REPO" | cut -d'/' -f2)
        
        echo ""
        echo "📡 GitHub Raw URLs:"
        echo "=================="
        echo "Access Control: https://raw.githubusercontent.com/$OWNER/$REPO/main/access-control.json"
        echo "Main Script: https://raw.githubusercontent.com/$OWNER/$REPO/main/car-extractor-main.js"
        echo "Distribution Script: https://raw.githubusercontent.com/$OWNER/$REPO/main/tampermonkey-remote-controlled.js"
        
        # Test URL accessibility (after deployment)
        echo ""
        echo "📊 Distribution Information:"
        echo "==========================="
        echo "Share this URL with colleagues for Tampermonkey installation:"
        echo "https://raw.githubusercontent.com/$OWNER/$REPO/main/tampermonkey-remote-controlled.js"
    fi
else
    echo "⚠️ Repository is not on GitHub or URL format not recognized"
fi

echo ""
echo "🚀 Next Steps:"
echo "=============="
echo "1. Ensure repository is PUBLIC on GitHub (for raw file access)"
echo "2. Add colleagues' User IDs to access-control.json"
echo "3. Run: ./manage-access.sh for ongoing management"
echo "4. Share the distribution URL with colleagues"
echo ""
echo "🔐 Repository Setup Complete!"
