# GitHub Actions Workflows

## Auto Release to GitHub Packages

This workflow automatically publishes packages to GitHub Packages when changes are merged to the `main` branch.

### How It Works

1. **Trigger**: Activates on pushes to `main` branch that affect files in:
   - `packages/**`
   - `tooling/**`
   - `sdk/**`

2. **Package Detection**: Automatically detects which packages changed in the commit

3. **Version Bumping**: Bumps the patch version (e.g., `1.0.0` → `1.0.1`)

4. **Build**: Runs the package's build script (if it exists)

5. **Publish**: Publishes to GitHub Packages (npm registry)

6. **Tagging**: Creates a git tag and GitHub release

### Package Requirements

For a package to be automatically released, it must:

1. **Have a scoped name** in `package.json`:
   ```json
   {
     "name": "@osome/package-name"
   }
   ```

2. **Be in a workspace directory** (`packages/`, `tooling/`, or `sdk/`)

3. **Have a valid version** in `package.json`:
   ```json
   {
     "version": "1.0.0"
   }
   ```

### Version Bumping Strategy

Currently, the workflow bumps the **patch** version automatically. To customize:

- **Patch** (default): Bug fixes and minor changes (`1.0.0` → `1.0.1`)
- **Minor**: New features (`1.0.0` → `1.1.0`) - Add `[minor]` to commit message
- **Major**: Breaking changes (`1.0.0` → `2.0.0`) - Add `[major]` to commit message

### Installing Published Packages

#### 1. Authenticate with GitHub Packages

Create a Personal Access Token (PAT) with `read:packages` scope:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select `read:packages` scope
4. Copy the token

#### 2. Configure npm/pnpm

Add to your `.npmrc` (or use the root `.npmrc`):
```
@osome:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Or use environment variable:
```bash
export GITHUB_TOKEN=your_token_here
```

#### 3. Install the package

```bash
pnpm add @osome/package-name
# or
npm install @osome/package-name
```

### Workflow Outputs

- **Git Tag**: `@osome/package-name@1.0.1`
- **GitHub Release**: Created with installation instructions
- **Published Package**: Available at `https://github.com/orgs/YOUR_ORG/packages`

### Customization

#### Change Version Bump Type

Modify the workflow file (`.github/workflows/auto-release.yml`):

```yaml
- name: Bump version (patch)
  run: |
    # Change 'patch' to 'minor' or 'major'
    npm version patch -m "chore(release): %s [skip ci]" --no-git-tag-version
```

#### Add Pre-publish Checks

Add steps before the publish step:

```yaml
- name: Run tests
  working-directory: ${{ matrix.package }}
  run: pnpm test

- name: Run linting
  working-directory: ${{ matrix.package }}
  run: pnpm lint
```

#### Skip Release for Specific Commits

Add `[skip ci]` to your commit message:
```bash
git commit -m "docs: update README [skip ci]"
```

### Troubleshooting

#### Package not publishing

1. **Check package name**: Must be scoped (`@osome/...`)
2. **Check permissions**: Workflow needs `packages: write` permission
3. **Check registry**: Ensure `.npmrc` points to GitHub Packages

#### Version conflicts

If a version already exists, the workflow will fail. To fix:
1. Manually bump the version in `package.json`
2. Commit and push to main

#### Authentication issues

Ensure your Personal Access Token has:
- `read:packages` (for installing)
- `write:packages` (for publishing - handled by `GITHUB_TOKEN` in actions)

### Example Package.json

```json
{
  "name": "@osome/my-package",
  "version": "1.0.0",
  "description": "My awesome package",
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

### Security Notes

- The workflow uses `GITHUB_TOKEN` which is automatically provided by GitHub Actions
- Published packages are **private by default** (`access: restricted`)
- To make a package public, change `access: "public"` in the workflow

### Monitoring Releases

View releases at:
- **Actions**: `https://github.com/YOUR_ORG/YOUR_REPO/actions`
- **Packages**: `https://github.com/orgs/YOUR_ORG/packages`
- **Releases**: `https://github.com/YOUR_ORG/YOUR_REPO/releases`
