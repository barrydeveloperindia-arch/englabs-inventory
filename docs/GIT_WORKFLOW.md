# Git Workflow for Multi-Environment Deployment

To separate your work properly, we use **Git Branches** corresponding to each environment.

## 1. The Branch Structure

| Environment | Branch Name | Purpose | Data Source |
| :--- | :--- | :--- | :--- |
| **Development** | `develop` | **Default.** Where you write code daily. Features are built here. | `englabs_dev` |
| **Staging** | `staging` | **Pre-Relase.** Stable features from `develop` are merged here for final testing. | `englabs_staging` |
| **Production** | `main` | **LIVE.** The "Holy Grail". NO direct edits. Only receives merges from `staging`. | `englabs1` |

## 2. Daily Workflow

### Step A: Start Work (Always in `develop`)
Every time you start a new task:
1.  Checkout the dev branch:
    ```bash
    git checkout develop
    ```
2.  Write code, test with `npm run dev`.
3.  Commit changes:
    ```bash
    git add .
    git commit -m "Added cool feature"
    ```

### Step B: Promote to Staging (Testing)
When a feature is "done" and you want to validte it fully:
1.  Switch to staging:
    ```bash
    git checkout staging
    ```
2.  Merge the new features from `develop`:
    ```bash
    git merge develop
    ```
3.  Test it with `npm run build:staging` and `npm run preview:staging`.

### Step C: Deploy to Production
Only if Staging works **perfectly**:
1.  Switch to main:
    ```bash
    git checkout main
    ```
2.  Merge the tested code from `staging`:
    ```bash
    git merge staging
    ```
3.  **Deploy!** (This updates your live users).

## 3. Recommended One-Time Setup (Run Now)

```bash
# 1. Create develop branch (from current code)
git checkout -b develop

# 2. Create staging branch (from current code)
git checkout -b staging

# 3. Go back to develop to start working
git checkout develop
```

## Summary
- **NEVER** commit directly to `main` for new features.
- All new code goes to `develop`.
- Code moves: `develop` -> `staging` -> `main`.
