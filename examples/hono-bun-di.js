import "reflect-metadata";
import { createProbotBun } from "../src/runtime/bun.js";

// Example GitHub App function
const myApp = (probot, { getRouter }) => {
  // Add a custom route
  const router = getRouter();
  router.get("/health", (req, res) => {
    res.json({ status: "healthy", runtime: "bun", framework: "hono" });
  });

  // Handle GitHub webhook events
  probot.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue! (from Hono on Bun with DI)",
    });
    await context.octokit.issues.createComment(issueComment);
  });

  probot.on("ping", async (context) => {
    console.log("✅ Ping received:", context.payload.zen);
  });
};

async function main() {
  // Create Probot instance with Bun runtime and Hono adapter
  const { probot, server } = createProbotBun({
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    secret: process.env.WEBHOOK_SECRET,
    port: process.env.PORT || 3002,
    logLevel: 'info',
  });

  // Load the app
  await server.load(myApp);

  // Start the server
  await server.start();
  
  console.log("🚀 Probot running on Hono/Bun with Dependency Injection!");
  console.log("   Runtime: Bun");
  console.log("   Framework: Hono");
  console.log("   Architecture: Dependency Injection");
  console.log("   Health check: http://localhost:3002/health");
}

main().catch(console.error);