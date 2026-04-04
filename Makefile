# Makefile for ENGLABS Inventory Management

.PHONY: all install build android deploy info

# Default target
all: install build

# Install dependencies
install:
	npm install

# Build the web application
build:
	npm run build

# Sync and open Android project
android: build
	npx cap sync
	npx cap open android

# Deploy (Placeholder - currently set to Vercel in docs, but user prompt implied Firebase)
deploy:
	@echo "Deploying to hosting..."
	# commands to deploy would go here, e.g., 'firebase deploy' or 'vercel --prod'

# Print onboarding information
info:
	@echo ""
	@echo "---------------------------------------------------"
	@echo "Hello,"
	@echo "Install your work app:"
	@echo "https://englabs-inventory.web.app"
	@echo ""
	@echo "Login:"
	@echo "Username: (Create a user in Firebase Auth)"
	@echo "Password: (Create a user in Firebase Auth)"
	@echo "---------------------------------------------------"
	@echo ""
