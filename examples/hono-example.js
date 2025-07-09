import { createProbot } from "../src/create-probot.js";
import { HonoAdapter } from "../src/adapters/hono.js";
import { Server } from "../src/server/server.js";
import { Probot } from "../src/probot.js";

// Example app function
const app = (probot) => {
  probot.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue with Hono!",
    });
    return context.octokit.issues.createComment(issueComment);
  });
};

// Create server with Hono adapter
const server = new Server({
  Probot: Probot,
  adapter: new HonoAdapter(),
});

// Load the app
await server.load(app);

// Start the server
await server.start();

console.log("Probot server with Hono adapter is running!");