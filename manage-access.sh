#!/bin/bash
# HAESL CAR Extractor - Remote Access Management Tool
# Use this script to manage user access via GitHub

echo "🔐 HAESL CAR Extractor - Access Management"
echo "======================================="

# Function to show current access status
show_status() {
    echo "📊 Current Access Status:"
    echo "========================"
    if [ -f "access-control.json" ]; then
        echo "Global Status: $(cat access-control.json | grep '"enabled"' | head -1 | cut -d':' -f2 | tr -d ' ,')"
        echo "Maintenance Mode: $(cat access-control.json | grep '"maintenanceMode"' | cut -d':' -f2 | tr -d ' ,')"
        echo "Version: $(cat access-control.json | grep '"version"' | cut -d':' -f2 | tr -d ' ",')"
        echo ""
        echo "Authorized Users:"
        cat access-control.json | grep -A2 '"name"' | grep '"name"' | cut -d':' -f2 | tr -d ' ",'
    else
        echo "❌ access-control.json not found!"
    fi
    echo ""
}

# Function to enable/disable system globally
toggle_system() {
    if [ "$1" = "enable" ]; then
        sed -i 's/"enabled": false/"enabled": true/' access-control.json
        echo "✅ System ENABLED globally"
    elif [ "$1" = "disable" ]; then
        sed -i 's/"enabled": true/"enabled": false/' access-control.json
        echo "🚫 System DISABLED globally"
    fi
}

# Function to toggle maintenance mode
toggle_maintenance() {
    if [ "$1" = "on" ]; then
        sed -i 's/"maintenanceMode": false/"maintenanceMode": true/' access-control.json
        echo "🔧 Maintenance mode ON"
    elif [ "$1" = "off" ]; then
        sed -i 's/"maintenanceMode": true/"maintenanceMode": false/' access-control.json
        echo "✅ Maintenance mode OFF"
    fi
}

# Function to add user
add_user() {
    echo "👤 Add New User"
    echo "==============="
    read -p "User ID (8 characters): " user_id
    read -p "User Name: " user_name
    read -p "User Email: " user_email
    read -p "Expiry Date (YYYY-MM-DD) or press Enter for no expiry: " expiry_date
    
    if [ -z "$expiry_date" ]; then
        expiry_date="2099-12-31"
    fi
    
    # Create new user JSON (simplified - you might want to use jq for complex editing)
    echo "User will be added with ID: $user_id"
    echo "⚠️  Manual editing required in access-control.json"
    echo "Add this user block to the authorizedUsers array:"
    echo "{"
    echo "  \"id\": \"$user_id\","
    echo "  \"name\": \"$user_name\","
    echo "  \"email\": \"$user_email\","
    echo "  \"enabled\": true,"
    echo "  \"expires\": \"${expiry_date}T23:59:59Z\","
    echo "  \"permissions\": [\"extract\", \"export\", \"refresh\"]"
    echo "},"
}

# Function to disable user
disable_user() {
    echo "🚫 Disable User"
    echo "==============="
    read -p "Enter User ID to disable: " user_id
    
    if grep -q "\"id\": \"$user_id\"" access-control.json; then
        # This is a simplified approach - for production use jq
        echo "⚠️  Manual editing required in access-control.json"
        echo "Find user with ID: $user_id"
        echo "Change their \"enabled\" value to false"
    else
        echo "❌ User ID not found: $user_id"
    fi
}

# Function to deploy to GitHub
deploy_to_github() {
    echo "🚀 Deploy to GitHub"
    echo "==================="
    
    if ! command -v git &> /dev/null; then
        echo "❌ Git not installed"
        return 1
    fi
    
    if [ ! -d ".git" ]; then
        echo "❌ Not a git repository"
        return 1
    fi
    
    echo "📤 Committing access control changes..."
    git add access-control.json car-extractor-main.js tampermonkey-remote-controlled.js
    git commit -m "Update CAR extractor access control - $(date)"
    
    echo "📡 Pushing to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully deployed to GitHub!"
        echo "🔄 Changes will take effect within 5 minutes for active users"
    else
        echo "❌ Failed to push to GitHub"
    fi
}

# Function to show GitHub URLs
show_urls() {
    echo "🔗 GitHub URLs for Distribution"
    echo "==============================="
    echo "Main script URL:"
    echo "https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/tampermonkey-remote-controlled.js"
    echo ""
    echo "Access control URL:"
    echo "https://raw.githubusercontent.com/JwoToLee/MorningMeeting/main/access-control.json"
    echo ""
    echo "📋 Give colleagues the main script URL to install in Tampermonkey"
}

# Function to generate user ID
generate_user_id() {
    echo "🆔 Generate User ID"
    echo "==================="
    echo "User IDs are automatically generated based on browser fingerprint."
    echo "To get a user's ID:"
    echo "1. Have them install and run the script"
    echo "2. They should open browser console (F12)"
    echo "3. Look for: 👤 User Fingerprint: XXXXXXXX"
    echo "4. Use that 8-character ID in access control"
}

# Main menu
while true; do
    echo ""
    echo "🎛️  Select an option:"
    echo "1. Show current status"
    echo "2. Enable system globally"
    echo "3. Disable system globally"
    echo "4. Turn maintenance mode ON"
    echo "5. Turn maintenance mode OFF"
    echo "6. Add new user (manual)"
    echo "7. Disable user (manual)"
    echo "8. Deploy changes to GitHub"
    echo "9. Show GitHub URLs"
    echo "10. Generate User ID help"
    echo "11. Exit"
    echo ""
    read -p "Enter choice (1-11): " choice
    
    case $choice in
        1) show_status ;;
        2) toggle_system enable ;;
        3) toggle_system disable ;;
        4) toggle_maintenance on ;;
        5) toggle_maintenance off ;;
        6) add_user ;;
        7) disable_user ;;
        8) deploy_to_github ;;
        9) show_urls ;;
        10) generate_user_id ;;
        11) echo "👋 Goodbye!"; exit 0 ;;
        *) echo "❌ Invalid option" ;;
    esac
done
