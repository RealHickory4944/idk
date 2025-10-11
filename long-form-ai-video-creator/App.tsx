import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Scene, SceneStatus, ErrorType } from './types';
import { generateVideoClip, generateScenePrompts } from './services/veoService';
import SceneEditor from './components/SceneEditor';
import VideoPlayer from './components/VideoPlayer';

const App: React.FC = () => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const geminiApiKeyMissing = useMemo(() => !process.env.GEMINI_API_KEY, []);

  const isGenerating = useMemo(() => scenes.some(s => s.status === SceneStatus.Generating), [scenes]);

  const handleGenerationError = (error: unknown, sceneId: string) => {
    console.error(error);
    let errorMessage = 'An unknown error occurred.';
    let errorType = ErrorType.Internal; // Make all errors retryable

    if (error instanceof Error) {
        errorMessage = error.message;
    }

    setScenes(prev => prev.map(s => s.id === sceneId 
        ? { ...s, status: SceneStatus.Error, progressMessage: errorMessage, errorType } 
        : s
    ));
  };
  
  const processScene = useCallback(async (sceneId: string) => {
    const sceneToProcess = scenes.find(s => s.id === sceneId);
    if (!sceneToProcess) return;

    setScenes(prev => prev.map(s => s.id === sceneId 
        ? { ...s, status: SceneStatus.Generating, progressMessage: 'Starting...' } 
        : s
    ));

    const onProgress = (message: string) => {
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, progressMessage: message } : s));
    };

    try {
        const videoUrl = await generateVideoClip(sceneToProcess.prompt, onProgress);
        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: SceneStatus.Success, videoUrl, progressMessage: 'Completed' } : s));
    } catch (error) {
        handleGenerationError(error, sceneId);
    }
  }, [scenes]);

  useEffect(() => {
    if (isGenerating) {
        return;
    }
    const nextScene = scenes.find(s => s.status === SceneStatus.Queued);
    if (nextScene) {
        processScene(nextScene.id);
    }
  }, [scenes, isGenerating, processScene]);


  const handleGenerateVideo = useCallback(async (prompt: string, duration: number) => {
    if (!prompt || duration <= 0 || isGenerating) return;

    const numScenes = Math.max(1, Math.ceil(duration / 4));
    
    const brainstormScene: Scene = { 
        id: crypto.randomUUID(), 
        prompt: 'Generating creative scene ideas...',
        status: SceneStatus.Generating, 
        progressMessage: 'Please wait...',
        errorType: ErrorType.None,
    };
    setScenes([brainstormScene]);

    try {
        const scenePrompts = await generateScenePrompts(prompt, numScenes);
        const newScenes: Scene[] = scenePrompts.map(p => ({
            id: crypto.randomUUID(),
            prompt: p,
            status: SceneStatus.Queued,
            errorType: ErrorType.None,
        }));
        setScenes(newScenes);
    } catch (error) {
        handleGenerationError(error, brainstormScene.id);
    }
  }, [isGenerating]);


  const handleRetryScene = useCallback(async (sceneId: string) => {
    const sceneToRetry = scenes.find(s => s.id === sceneId);
    if (!sceneToRetry || isGenerating) return;
    
    // The useEffect will handle continuing the queue after success.
    processScene(sceneId);

  }, [scenes, isGenerating, processScene]);

  const finalVideoUrls = useMemo(() => {
    return scenes
        .filter(s => s.status === SceneStatus.Success && s.videoUrl)
        .map(s => s.videoUrl!);
  }, [scenes]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
          AI Video Weaver
        </h1>
        <p className="mt-2 text-lg text-gray-400">Scene ideas by Gemini</p>
      </header>
      
      {geminiApiKeyMissing && (
        <div className="max-w-4xl mx-auto bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center mb-8" role="alert">
          <strong className="font-bold">Gemini API Key Missing!</strong>
          <span className="block sm:inline ml-2">Please ensure the GEMINI_API_KEY environment variable is set to use this application.</span>
        </div>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <div className="lg:col-span-1 h-[80vh]">
          <SceneEditor
            scenes={scenes}
            onGenerateVideo={handleGenerateVideo}
            onRetryScene={handleRetryScene}
            isGenerating={isGenerating}
          />
        </div>
        <div className="lg:col-span-2 flex items-center justify-center">
          <VideoPlayer videoUrls={finalVideoUrls} />
        </div>
      </main>
    </div>
  );
};

export default App;