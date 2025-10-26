import Perplexity from '@perplexity-ai/perplexity_ai';

const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY
});

export async function getNextQuestion() {
  try {
    console.log('before pplx call')
    const completion = await client.chat.completions.create({
      model: "sonar-pro",
      messages: [
        {
          role: "user",
          content:
            "Give me one trivia question and its correct answer in strict JSON format: {text: 'Question?', correct: 'Answer'}"
        }
      ]
    });

    const response = completion?.choices?.[0]?.message?.content?.trim();
    console.log("response", response)
    // Try parsing JSON safely
    try {
      return JSON.parse(response);
    } catch {
      // Fallback: extract JSON from text if the model added extra content
      const match = response.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error("Invalid JSON response");
    }
  } catch (error) {
    console.error("Error fetching trivia question:", error);
    return { text: "Error generating question", correct: "N/A" };
  }
}
