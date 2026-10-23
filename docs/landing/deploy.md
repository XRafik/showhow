# Deploy the landing page

The landing page in `site/` is a static Astro build hosted on **Cloudflare Pages**.

- Project: `showhow` (classic Pages, not Workers), account `Mohamed@bedarstudios.com's Account`.
- Production URL: <https://showhow-agy.pages.dev/>
- Production branch: `main`.
- Custom domain: none yet. Add one in the Cloudflare dashboard under Pages → showhow → Custom domains.

The app release workflow (`build.yml`) is not involved. `.github/workflows/pages.yml` is the only landing workflow.

## Redeploy

Automatic: a push to `main` that changes `site/**` runs `pages.yml`. It needs two repository secrets, which the owner adds:

- `CLOUDFLARE_API_TOKEN`: an API token with the **Cloudflare Pages: Edit** permission.
- `CLOUDFLARE_ACCOUNT_ID`: the Account ID shown by `npx wrangler@4 whoami`.

Without them the workflow logs a warning and skips the deploy. You can also run it by hand from Actions → "Landing page" → Run workflow.

Manual, from a signed-in Mac (`npx wrangler@4 whoami`):

```sh
cd site
npm ci
npm run build
npx wrangler@4 pages deploy dist --project-name showhow --branch main
```

Do not pass `--force` to `pages deploy`, and do not run `wrangler pages project create` again: the project exists. Without `--force`, a new `project create` tries to convert the site to a Workers project and edits `site/package.json`.

## Roll back

1. List deployments: `npx wrangler@4 pages deployment list --project-name showhow`.
2. In the Cloudflare dashboard, open Pages → showhow → Deployments, choose the last good production deployment, and select **Rollback to this deployment**.
3. Or redeploy an older commit: check it out, then run the manual steps above.

Rolling back changes only what is served. It does not change `main`; revert the commit there too if the change was wrong.

## First deploy

Published on 23 October 2026 from `main` at `001b202a` with the manual steps above (deployment `09b3401d`).
