import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });


export const generateScenePrompts = async (mainPrompt: string, numScenes: number): Promise<string[]> => {
  const prompt = `Based on the following theme, generate a list of ${numScenes} distinct, visually descriptive, and cinematic video scene prompts. Each prompt should be a short sentence focusing on a unique action, angle, or subject related to the main theme. Ensure variety.
  
  Theme: "${mainPrompt}"
  
  Return the result as a JSON object with a single key "scenes" containing an array of strings.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              description: 'A single, descriptive video scene prompt.'
            }
          }
        },
        required: ['scenes']
      }
    }
  });

  try {
    const jsonString = response.text;
    const parsed = JSON.parse(jsonString);
    if (parsed.scenes && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
      return parsed.scenes;
    }
    throw new Error("Invalid or empty format for scene prompts.");
  } catch (e) {
    console.error("Failed to parse scene prompts from Gemini:", e);
    throw new Error("Could not generate scene ideas. The AI returned an unexpected format.");
  }
};

const HF_SPACE_URL = "https://cerspense-zeroscope-v2-576w.hf.space/";
const PREDICT_URL = `${HF_SPACE_URL}run/predict`;
const STATUS_URL = `${HF_SPACE_URL}queue/status`;
const FN_INDEX = 0; // Corresponds to the text-to-video function in the ZeroScope HF Space

const pollForVideo = async (sessionHash: string, onProgress: (message: string) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (HF_API_KEY) {
          headers["Authorization"] = `Bearer ${HF_API_KEY}`;
        }

        const statusResponse = await fetch(STATUS_URL, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ hash: sessionHash }),
        });

        if (!statusResponse.ok) {
            if(statusResponse.status === 503) {
                 onProgress("The AI is waking up... Please wait.");
                 return; // continue polling
            }
          clearInterval(interval);
          reject(new Error(`Failed to get status: ${statusResponse.statusText}`));
          return;
        }

        const statusData = await statusResponse.json();
        
        if (statusData.status === "COMPLETE") {
          clearInterval(interval);
          const videoData = statusData.data.data[0];
          const videoUrl = `${HF_SPACE_URL}file=${videoData.name}`;
          onProgress("Video ready!");
          resolve(videoUrl);
        } else if (statusData.status === "QUEUED") {
          onProgress(`In queue... (position ${statusData.rank}, ~${Math.round(statusData.rank_eta)}s)`);
        } else if (statusData.status === "PENDING" || statusData.status === "GENERATING") {
           let progressMessage = "Generating video...";
            if (statusData.progress_data && statusData.progress_data[0] && typeof statusData.progress_data[0].progress === 'number') {
                progressMessage = `Generating... (${Math.round(statusData.progress_data[0].progress * 100)}%)`;
            }
            onProgress(progressMessage);
        } else if (statusData.status === "FAILED") {
           clearInterval(interval);
           reject(new Error('Generation failed. The AI service may be busy or unable to process this prompt. Please try again later.'));
        }

      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 2000);
  });
};

export const generateVideoClip = async (
  prompt: string,
  onProgress: (message: string) => void
): Promise<string> => {
  onProgress("Sending request to AI generator...");

  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (HF_API_KEY) {
      headers["Authorization"] = `Bearer ${HF_API_KEY}`;
    }

    const predictResponse = await fetch(PREDICT_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        fn_index: FN_INDEX,
        data: [
          prompt,
          "", // negative_prompt
          7.5, // guidance_scale
          50, // num_inference_steps
          576, // width
          320, // height
          -1, // seed (random)
        ],
      }),
    });

    if (!predictResponse.ok) {
        if(predictResponse.status === 503) {
             throw new Error("Service is waking up. Please try again in a moment.");
        }
      throw new Error(`Failed to start generation: ${predictResponse.statusText}`);
    }

    const predictData = await predictResponse.json();
    const sessionHash = predictData.hash;
    
    onProgress("Request accepted, in queue...");
    return await pollForVideo(sessionHash, onProgress);

  } catch (error) {
    console.error("Error in generateVideoClip:", error);
    if(error instanceof Error) {
        throw new Error(`Video generation failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during video generation.");
  }
};