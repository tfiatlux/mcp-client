const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testStream() {
  const genAI = new GoogleGenerativeAI("AIzaSyBDeJwUz8ae6C_LoOwSCIocMg6oE-hzD_Q");
  
  try {
    console.log("Testing stream with gemini-2.5-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const chat = model.startChat({
      history: [],
    });

    console.log("Sending message stream...");
    const result = await chat.sendMessageStream("Hello, tell me a short joke.");
    
    for await (const chunk of result.stream) {
        process.stdout.write(chunk.text());
    }
    console.log("\nDone.");
    
  } catch (error) {
    console.error("Error testing stream:");
    console.error(error);
  }
}

testStream();

