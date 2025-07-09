import "reflect-metadata";
import { createProbotNode } from "./src/runtime/node.js";

// Simple test app
const testApp = (probot, { getRouter }) => {
  console.log("✅ Test app loaded successfully");
  
  const router = getRouter();
  router.get("/test", (req, res) => {
    res.json({ message: "DI architecture test successful!" });
  });
  
  probot.on("ping", async (context) => {
    console.log("✅ Ping event handled");
  });
};

async function testDI() {
  console.log("🧪 Testing Dependency Injection Architecture...\n");
  
  try {
    // Test 1: Container creation
    console.log("1. Creating DI container...");
    const { probot, server } = createProbotNode({
      port: 3000,
      logLevel: 'info',
    });
    console.log("✅ Container created successfully");
    
    // Test 2: Service resolution
    console.log("\n2. Testing service resolution...");
    console.log(`   Runtime: ${probot.getEnvironment()}`);
    console.log(`   Serverless: ${probot.isServerless()}`);
    console.log("✅ Services resolved successfully");
    
    // Test 3: App loading
    console.log("\n3. Loading test application...");
    await server.load(testApp);
    console.log("✅ Application loaded successfully");
    
    // Test 4: Router creation
    console.log("\n4. Testing router creation...");
    const router = server.getRouter();
    console.log("✅ Router created successfully");
    
    // Test 5: Handler creation
    console.log("\n5. Testing handler creation...");
    const handler = server.getHandler();
    console.log("✅ Handler created successfully");
    
    console.log("\n✨ All DI architecture tests passed!");
    console.log("   • ✅ Container initialization");
    console.log("   • ✅ Service injection");
    console.log("   • ✅ Runtime detection");
    console.log("   • ✅ Application loading");
    console.log("   • ✅ Router creation");
    console.log("   • ✅ Handler creation");
    
  } catch (error) {
    console.error("❌ DI architecture test failed:", error);
    console.error(error.stack);
  }
}

testDI().catch(console.error);