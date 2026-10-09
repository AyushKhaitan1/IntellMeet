import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Local Whisper.cpp executable
const WHISPER_CLI_PATH =
  process.env.WHISPER_CLI_PATH ||
  "C:\\Users\\HP\\Downloads\\whisper-bin-x64\\Release\\whisper-cli.exe";

// Local Whisper model
const WHISPER_MODEL_PATH =
  process.env.WHISPER_MODEL_PATH ||
  "C:\\Users\\HP\\Downloads\\whisper-bin-x64\\models\\ggml-base.en.bin";

/**
 * Convert audio into text using local Whisper.cpp
 *
 * @param {Blob|ArrayBuffer|Buffer} audioData
 * @returns {Promise<string>}
 */
export const transcribeAudio = async (audioData) => {
  let tempAudioPath;
  let outputBasePath;

  try {
    if (!fs.existsSync(WHISPER_CLI_PATH)) {
      throw new Error(`Whisper CLI not found: ${WHISPER_CLI_PATH}`);
    }

    if (!fs.existsSync(WHISPER_MODEL_PATH)) {
      throw new Error(`Whisper model not found: ${WHISPER_MODEL_PATH}`);
    }

    // Convert incoming audio to Buffer
    let audioBuffer;

    if (Buffer.isBuffer(audioData)) {
      audioBuffer = audioData;
    } else if (audioData instanceof Blob) {
      audioBuffer = Buffer.from(await audioData.arrayBuffer());
    } else if (audioData instanceof ArrayBuffer) {
      audioBuffer = Buffer.from(audioData);
    } else {
      throw new Error("Unsupported audio data format");
    }

    // Temporary files
    const id = crypto.randomUUID();

    tempAudioPath = path.join(os.tmpdir(), `intellmeet-${id}.wav`);
    outputBasePath = path.join(os.tmpdir(), `intellmeet-${id}`);

    fs.writeFileSync(tempAudioPath, audioBuffer);

    console.log("🎤 Starting local Whisper transcription...");
    console.log("📁 Audio:", tempAudioPath);
    console.log("🤖 Model:", WHISPER_MODEL_PATH);

    // Run whisper-cli
    await execFileAsync(
      WHISPER_CLI_PATH,
      [
        "-m",
        WHISPER_MODEL_PATH,
        "-f",
        tempAudioPath,
        "-otxt",
        "-of",
        outputBasePath,
      ],
      {
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const outputFile = `${outputBasePath}.txt`;

    if (!fs.existsSync(outputFile)) {
      throw new Error("Whisper did not generate a transcript file");
    }

    const transcript = fs.readFileSync(outputFile, "utf8").trim();

    console.log("✅ Local Whisper transcription successful");
    console.log("📝 Transcript:", transcript);

    return transcript;
  } catch (error) {
    console.error("❌ Local Whisper transcription error:");
    console.error(error);

    throw error;
  } finally {
    // Cleanup temporary files
    try {
      if (tempAudioPath && fs.existsSync(tempAudioPath)) {
        fs.unlinkSync(tempAudioPath);
      }

      if (outputBasePath) {
        const outputFile = `${outputBasePath}.txt`;

        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      }
    } catch (cleanupError) {
      console.error("⚠️ Temporary file cleanup failed:", cleanupError);
    }
  }
};