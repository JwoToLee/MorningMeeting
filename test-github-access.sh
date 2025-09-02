#!/bin/bash
# Test if GitHub URLs are working after making repository public

echo "🧪 Testing GitHub Raw File Access"
echo "=================================="

BASE_URL="https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main"

files=(
    "access-control.json"
    "car-extractor-main.js"
    "tampermonkey-remote-controlled.js"
)

echo "Testing URLs..."
for file in "${files[@]}"; do
    url="$BASE_URL/$file"
    echo -n "Testing $file: "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "200" ]; then
        echo "✅ SUCCESS (HTTP $response)"
    else
        echo "❌ FAILED (HTTP $response)"
    fi
done

echo ""
echo "🔗 Distribution URL for colleagues:"
echo "https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/tampermonkey-remote-controlled.js"
echo ""
echo "📝 Note: If tests fail, ensure repository is PUBLIC on GitHub"
