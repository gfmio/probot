import { createProbot } from "../src/create-probot.js";
import { ExpressAdapter } from "../src/adapters/express.js";
import { Server } from "../src/server/server.js";
import { Probot } from "../src/probot.js";

// Example app function
const app = (probot) => {
  probot.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
    return context.octokit.issues.createComment(issueComment);
  });
};

// Create server with Express adapter
const server = new Server({
  Probot: Probot,
  adapter: new ExpressAdapter(),
});

// Load the app
await server.load(app);

// Start the server
await server.start();

console.log("Probot server with Express adapter is running!");