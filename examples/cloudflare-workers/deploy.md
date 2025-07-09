# Deploying Probot to Cloudflare Workers

## Prerequisites

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Authenticate with Cloudflare:
```bash
wrangler login
```

## Configuration

1. Update `wrangler.toml` with your settings:
   - Replace `your-app-id` with your GitHub App ID
   - Replace `your-webhook-secret` with your webhook secret
   - Replace `your-domain.com` with your actual domain

2. Set your private key as a secret:
```bash
wrangler secret put PRIVATE_KEY
```
Then paste your GitHub App private key when prompted.

## Deployment

1. Deploy to Cloudflare Workers:
```bash
wrangler deploy
```

2. Configure your GitHub App webhook URL to point to:
```
https://your-domain.com/api/github/webhooks
```

## Features

- ✅ Serverless architecture
- ✅ Global edge deployment
- ✅ Automatic scaling
- ✅ Dependency injection
- ✅ Framework-agnostic design
- ✅ TypeScript support

## Environment Variables

The following environment variables are supported:

- `APP_ID`: Your GitHub App ID
- `WEBHOOK_SECRET`: Your webhook secret
- `PRIVATE_KEY`: Your GitHub App private key (set as secret)

## Limitations

- No file system access
- Limited to 128 MB memory
- 10ms CPU time limit per request
- No persistent storage (use KV or D1 for data)

## Monitoring

You can monitor your worker using:

```bash
wrangler tail
```

## Local Development

Test locally with:

```bash
wrangler dev
```

This will start a local development server that mimics the Cloudflare Workers environment.