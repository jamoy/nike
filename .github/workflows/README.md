# GitHub Actions Workflows

## Release Workflow (Changesets)

This repository uses [Changesets](https://github.com/changesets/changesets) for managing package versions and publishing to GitHub Packages.

### How It Works

1. **Developer makes changes** to a package
2. **Developer creates a changeset** describing the change
3. **Changesets bot creates/updates a "Version Packages" PR** automatically
4. **When the PR is merged**, packages are built, versioned, and published to GitHub Packages

### Developer Workflow

#### 1. Make Your Changes

```bash
# Make changes to any package
cd packages/framework/framework
# ... edit files ...
```

#### 2. Create a Changeset

After making your changes, create a changeset:

```bash
pnpm changeset
```

This will prompt you for:
- **Which packages changed?** (select from list)
- **What type of change?** (major/minor/patch)
- **Summary of changes** (for changelog)

**Example:**
```bash
$ pnpm changeset

🦋  Which packages would you like to include?
✔ @osome/framework

🦋  Which packages should have a major bump?
   (Breaking changes)
◯ @osome/framework

🦋  Which packages should have a minor bump?
   (New features, backwards compatible)
◉ @osome/framework

🦋  Which packages should have a patch bump?
   (Bug fixes)
◯ @osome/framework

🦋  Please enter a summary for this change:
✔ Add new authentication middleware

🦋  Summary
│
│  @osome/framework: minor
│
│  Add new authentication middleware
│
└──────────────────────────────────

✔ Is this your desired changeset? (Y/n) · true
```

This creates a file in `.changeset/` with a random name.

#### 3. Commit the Changeset

```bash
git add .changeset/
git commit -m "feat: add authentication middleware"
git push
```

#### 4. Create Pull Request

Create a PR with your changes + the changeset file.

#### 5. Merge to Main

When your PR is merged to `main`:
1. The **Release workflow** runs
2. A **"Version Packages" PR** is created/updated automatically
3. This PR includes:
   - Updated `package.json` versions
   - Updated `CHANGELOG.md` files
   - All pending changesets consumed

#### 6. Release the Package

When the "Version Packages" PR is merged:
1. Packages are **built** (via `pnpm build`)
2. Versions are **tagged** in git
3. Packages are **published** to GitHub Packages
4. **GitHub Releases** are created

### Version Bump Types

Choose the appropriate version bump based on [Semantic Versioning](https://semver.org/):

| Type | When to Use | Example |
|------|-------------|---------|
| **Patch** | Bug fixes, internal refactoring | `1.0.0` → `1.0.1` |
| **Minor** | New features (backwards compatible) | `1.0.0` → `1.1.0` |
| **Major** | Breaking changes | `1.0.0` → `2.0.0` |

### Common Commands

```bash
# Create a changeset
pnpm changeset

# Create an empty changeset (for non-package changes)
pnpm changeset --empty

# Check what will be released
pnpm changeset status

# Preview what version updates will happen
pnpm changeset version --dry-run

# Build all packages (locally)
pnpm build
```

### Multiple Package Changes

If you change multiple packages in one PR, create changesets for each:

```bash
# Make changes to multiple packages
cd packages/framework/framework
# ... make changes ...

cd ../migrations
# ... make changes ...

# Create changesets for both
pnpm changeset  # Select @osome/framework
pnpm changeset  # Select @osome/framework-migrations

# Commit all changesets
git add .changeset/
git commit -m "feat: add migration support"
```

### Skip Release for Non-Package Changes

For documentation, config, or other changes that don't affect packages:

- **Don't create a changeset** - just commit and push normally
- The workflow won't create a release PR if there are no changesets

### Installing Published Packages

#### 1. Authenticate with GitHub Packages

Create a Personal Access Token (PAT) with `read:packages` scope:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select `read:packages` scope
4. Copy the token

#### 2. Configure npm/pnpm

The `.npmrc` file is already configured:
```
@osome:registry=https://npm.pkg.github.com
```

Add authentication via environment variable:
```bash
export GITHUB_TOKEN=your_token_here
```

Or add to `.npmrc` (don't commit this!):
```
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

#### 3. Install Packages

```bash
pnpm add @osome/framework@latest
# or specific version
pnpm add @osome/framework@1.2.3
```

### Workflow Configuration

The release workflow (`.github/workflows/release.yml`) does the following:

1. **Checks for changesets** on every push to `main`
2. **Creates/Updates "Version Packages" PR** if changesets exist
3. **Publishes packages** when the PR is merged
4. **Creates GitHub Releases** for each published package

### Package Requirements

For a package to be publishable:

1. **Scoped name** in `package.json`:
   ```json
   {
     "name": "@osome/package-name"
   }
   ```

2. **Valid version**:
   ```json
   {
     "version": "1.0.0"
   }
   ```

3. **Build script** (if needed):
   ```json
   {
     "scripts": {
       "build": "tsc"
     }
   }
   ```

4. **PublishConfig** (optional, auto-added by workflow):
   ```json
   {
     "publishConfig": {
       "registry": "https://npm.pkg.github.com/",
       "access": "restricted"
     }
   }
   ```

### Troubleshooting

#### No "Version Packages" PR Created

- **Check**: Did you create and commit a changeset?
- **Fix**: Run `pnpm changeset` and commit the file

#### PR exists but not updating

- **Check**: Did you push to `main`?
- **Fix**: Merge your PR with the changeset to `main`

#### Package not publishing

1. **Check package name**: Must be scoped (`@osome/...`)
2. **Check build script**: Must succeed
3. **Check permissions**: Workflow needs `packages: write` permission

#### Changesets showing wrong packages

- **Check**: Your workspace is configured correctly in `pnpm-workspace.yaml`
- **Fix**: Ensure all packages are listed in workspace config

### Advanced: Linked Packages

If packages should always be versioned together, add to `.changeset/config.json`:

```json
{
  "linked": [
    ["@osome/framework", "@osome/framework-migrations"]
  ]
}
```

### Advanced: Fixed Versioning

To keep packages at the same version (like Babel):

```json
{
  "fixed": [
    ["@osome/workspace-platform", "@osome/workspace-crm"]
  ]
}
```

### Example Package.json

```json
{
  "name": "@osome/framework",
  "version": "1.0.0",
  "description": "Framework package",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/",
    "access": "restricted"
  }
}
```

### Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [GitHub Packages Documentation](https://docs.github.com/en/packages)

---

## Quick Reference

```bash
# 1. Make changes to packages
# 2. Create changeset
pnpm changeset

# 3. Commit and push
git add .
git commit -m "feat: your change"
git push

# 4. Create PR and merge to main
# 5. Wait for "Version Packages" PR to be created
# 6. Merge "Version Packages" PR
# 7. Packages are automatically published! 🎉
```
