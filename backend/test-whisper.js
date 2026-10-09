import "dotenv/config";
import fs from "fs";
import { transcribeAudio } from "./src/services/whisper.service.js";

const audioPath = "./test-audio.wav";

try {
  console.log("🎤 Starting Whisper transcription...");

  const audioBuffer = fs.readFileSync(audioPath);

  const audioBlob = new Blob([audioBuffer], {
    type: "audio/wav",
  });

  const transcript = await transcribeAudio(audioBlob);

  console.log("✅ Whisper transcription successful!");
  console.log("📝 Transcript:");
  console.log(transcript);
} catch (error) {
  console.error("❌ Whisper test failed:");
  console.error(error);
}