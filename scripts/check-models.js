const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI("AIzaSyBDeJwUz8ae6C_LoOwSCIocMg6oE-hzD_Q");
  try {
    // Note: listModels is not directly on genAI instance in some versions, 
    // but usually accessible via direct API call or specific manager. 
    // The SDK simplifies this. Let's use the raw API if SDK doesn't support list easily.
    // Actually, let's just use fetch for simplicity as seen in curl.
    
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBDeJwUz8ae6C_LoOwSCIocMg6oE-hzD_Q");
    const data = await response.json();
    
    if (data.models) {
        console.log("Available models:");
        data.models.forEach(m => console.log(m.name));
    } else {
        console.log("No models found or error:", data);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();

