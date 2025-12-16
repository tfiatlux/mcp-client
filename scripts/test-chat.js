const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testChat() {
  const genAI = new GoogleGenerativeAI("AIzaSyBDeJwUz8ae6C_LoOwSCIocMg6oE-hzD_Q");
  
  try {
    console.log("Testing gemini-2.5-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const chat = model.startChat({
      history: [],
    });

    console.log("Sending message...");
    const result = await chat.sendMessage("Hello, are you there?");
    console.log("Response:", result.response.text());
    
  } catch (error) {
    console.error("Error testing chat:");
    console.error(error);
  }
}

testChat();

