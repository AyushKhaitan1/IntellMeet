import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

const MODEL = "openai/gpt-oss-20b";

export async function generateMeetingSummary(transcript) {
  if (!transcript || !transcript.trim()) {
    throw new Error("Transcript is required");
  }

  const response = await hf.chatCompletion({
  model: MODEL,
  provider: "groq",
  messages: [
      {
        role: "system",
        content: `
You are an AI meeting assistant.

Analyze meeting transcripts and extract:
1. Meeting overview
2. Key points
3. Decisions
4. Action items

Do not invent information that is not present in the transcript.
Return ONLY valid JSON.
        `,
      },
      {
        role: "user",
        content: `
Analyze this meeting transcript:

${transcript}

Return exactly this JSON structure:

{
  "overview": "Brief meeting overview",
  "keyPoints": [],
  "decisions": [],
  "actionItems": [
    {
      "task": "",
      "assignee": "Unassigned",
      "deadline": "Not specified"
    }
  ]
}
        `,
      },
    ],
    max_tokens: 1000,
    temperature: 0.2,
  });

  let result = response.choices?.[0]?.message?.content;

  if (!result) {
    throw new Error("No AI response received");
  }

  // Strip possible markdown code blocks for reliable JSON parsing
  result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  return result;
}