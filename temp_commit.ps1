# Add this script to gitignore so it doesn't get committed itself
echo "temp_commit.ps1" >> .gitignore
git add .gitignore
git commit -m "chore: ignore temp scripts"

# Commit 1: Layout and Width Fixes
git add src/App.tsx src/components/layout/AppShell.tsx src/pages/FeedPage.tsx
git commit -m "fix: resolve layout width bugs and padding issues across app shell and feed page"

# Commit 2: Brand Icons for Gamer Tags
git add src/components/ui/BrandIcons.tsx
git commit -m "feat: add brand icons for gamer tags integration"

# Commit 3: Profile Page and Top Movies Feature
git add src/pages/ProfilePage.tsx src/components/profile/
git commit -m "feat: implement visitable read-only profiles and top movies selector"

# Commit 4: Share Post Feature
git add src/components/feed/SharePostModal.tsx
git commit -m "feat: add share post modal functionality"

# Commit 5: Type Definitions
git add src/types/index.ts
git commit -m "chore: update type definitions for new profile and user features"

# Commit 6: User Search and Handle Backfill
git add src/hooks/useOnlineUsers.ts src/components/layout/ProtectedRoute.tsx
git commit -m "feat: expose user handles in presence hook and implement handle backfill"

# Commit 7: Global Search Integration
git add src/components/layout/Header.tsx
git commit -m "feat: integrate user search into global header dropdown"

# Navigation Bug Fixes
git add src/components/layout/Sidebar.tsx
git commit -m "fix: resolve profile link bug in sidebar for users without handles"

git add src/components/feed/PostCard.tsx src/components/feed/CommentSection.tsx
git commit -m "fix: resolve profile link bugs in feed for users without handles"

# Catch-all for any remaining files
git add .
git commit -m "chore: minor fixes and cleanup"

echo "All commits have been created successfully! You can now run 'git push' to push them to GitHub."
