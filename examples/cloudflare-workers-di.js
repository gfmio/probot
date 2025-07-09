import "reflect-metadata";
import { createCloudflareWorkersHandler } from "../src/runtime/cloudflare-workers.js";

// Example GitHub App function
const myApp = (probot, { getRouter }) => {
  // Add a custom route
  const router = getRouter();
  router.get("/health", (req, res) => {
    res.json({ status: "healthy", runtime: "cloudflare-workers", framework: "hono" });
  });

  // Handle GitHub webhook events
  probot.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue! (from Cloudflare Workers with DI)",
    });
    await context.octokit.issues.createComment(issueComment);
  });

  probot.on("ping", async (context) => {
    console.log("✅ Ping received:", context.payload.zen);
  });
};

// Export the handler for Cloudflare Workers
export default createCloudflareWorkersHandler({
  app: myApp,
  // Configuration will come from environment variables in Cloudflare Workers
  secret: 'your-webhook-secret',
  appId: 'your-app-id',
  privateKey: 'your-private-key',
});