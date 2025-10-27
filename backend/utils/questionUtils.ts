import Perplexity from '@perplexity-ai/perplexity_ai';

const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY
});

// Track previously asked questions
let previousQuestions: string[] = [];

const categories = ["history", "science", "movies", "sports", "geography", "literature"];

export async function getNextQuestion() {
  try {
    const category = categories[Math.floor(Math.random() * categories.length)];

    console.log('before pplx call');

    const completion = await client.chat.completions.create({
      model: "sonar-pro",
      messages: [
        {
          role: "user",
          content: `Generate a single trivia question about ${category}. 
          
          Respond with ONLY valid JSON in this exact format with no additional text:
          {"text": "Question here?", "correct": "Answer here"}
          
          ${previousQuestions.length > 0 ? `Do not repeat these questions: ${JSON.stringify(previousQuestions)}` : ''}
          
          Remember: Return ONLY the JSON object, nothing else.`
        }
      ]
    });

    const response = completion?.choices?.[0]?.message?.content?.trim();
    console.log("Raw response:", response);

    if (!response) {
      throw new Error("Empty response from Perplexity");
    }

    // Try multiple parsing strategies
    let question;
    
    // Strategy 1: Direct parse
    try {
      question = JSON.parse(response);
    } catch (e1) {
      console.log("Direct parse failed, trying extraction...");
      
      // Strategy 2: Extract JSON from markdown code blocks
      const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        question = JSON.parse(codeBlockMatch[1]);
      } else {
        // Strategy 3: Find any JSON object in the response
        const jsonMatch = response.match(/\{[\s\S]*?"text"[\s\S]*?"correct"[\s\S]*?\}/);
        if (jsonMatch) {
          question = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not extract valid JSON from response");
        }
      }
    }

    // Validate the structure
    if (!question.text || !question.correct) {
      throw new Error("Invalid question structure");
    }

    // Add to previous questions and keep only the last 10
    previousQuestions.push(question.text);
    if (previousQuestions.length > 10) {
      previousQuestions.shift(); // Remove oldest
    }

    console.log("Parsed question:", question);
    return question;

  } catch (error) {
    console.error("Error fetching trivia question:", error);
    // Return a fallback question
    return { 
      text: "What is the capital of France?", 
      correct: "Paris" 
    };
  }
}