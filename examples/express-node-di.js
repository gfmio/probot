import "reflect-metadata";
import { createProbotNode } from "../src/runtime/node.js";

// Example GitHub App function
const myApp = (probot, { getRouter }) => {
  // Add a custom route
  const router = getRouter();
  router.get("/health", (req, res) => {
    res.json({ status: "healthy", runtime: "node", framework: "express" });
  });

  // Handle GitHub webhook events
  probot.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue! (from Express on Node.js with DI)",
    });
    await context.octokit.issues.createComment(issueComment);
  });

  probot.on("ping", async (context) => {
    console.log("✅ Ping received:", context.payload.zen);
  });
};

async function main() {
  // Create Probot instance with Node.js runtime and Express adapter
  const { probot, server } = createProbotNode({
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    secret: process.env.WEBHOOK_SECRET,
    port: process.env.PORT || 3000,
    logLevel: 'info',
  });

  // Load the app
  await server.load(myApp);

  // Start the server
  await server.start();
  
  console.log("🚀 Probot running on Express/Node.js with Dependency Injection!");
  console.log("   Runtime: Node.js");
  console.log("   Framework: Express");
  console.log("   Architecture: Dependency Injection");
  console.log("   Health check: http://localhost:3000/health");
}

main().catch(console.error);