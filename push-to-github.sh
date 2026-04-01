#!/bin/bash
# ── Push Jazz Ting World Cup site to GitHub Pages ──────────────
# Run this once after creating your GitHub repo

echo "Enter your GitHub username:"
read GITHUB_USER

REPO="jazz-ting-worldcup"

echo ""
echo "Creating remote and pushing to github.com/$GITHUB_USER/$REPO..."
echo ""

git remote add origin "git@github.com:$GITHUB_USER/$REPO.git"
git branch -M main
git push -u origin main

echo ""
echo "✅ Pushed! Now go to:"
echo "   https://github.com/$GITHUB_USER/$REPO/settings/pages"
echo "   → Source: Deploy from branch → main → / (root) → Save"
echo ""
echo "Your site will be live at:"
echo "   https://$GITHUB_USER.github.io/$REPO"
