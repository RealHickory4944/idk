import React, { useState } from 'react';
import { Scene } from '../types';
import SceneCard from './SceneCard';
import { WandIcon } from './Icons';
import Loader from './Loader';

interface SceneEditorProps {
  scenes: Scene[];
  onGenerateVideo: (prompt: string, duration: number) => void;
  onRetryScene: (sceneId: string) => void;
  isGenerating: boolean;
}

const SceneEditor: React.FC<SceneEditorProps> = ({
  scenes,
  onGenerateVideo,
  onRetryScene,
  isGenerating,
}) => {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateVideo(prompt, duration);
  };
  
  const isBrainstorming = scenes.length === 1 && scenes[0].prompt === 'Generating creative scene ideas...';

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-gray-100">Storyboard</h2>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
              Your Video Idea
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A futuristic city at night, with flying cars and neon signs..."
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              rows={4}
              disabled={isGenerating}
              required
            />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">
              Target Length (seconds)
            </label>
            <input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(4, parseInt(e.target.value, 10) || 4))}
              min="4"
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={isGenerating}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors text-lg"
          >
            <WandIcon className="w-5 h-5" />
            <span>Generate Video</span>
          </button>
          {!isGenerating && (
            <p className="text-xs text-gray-500 text-center">
                Video generation uses a free public model from Hugging Face and may be slow or unavailable.
            </p>
          )}
        </div>
      </form>
      
      <div className="mt-4 pt-4 border-t border-gray-700 flex-grow overflow-y-auto pr-2 -mr-2 space-y-3">
        {scenes.length === 0 && (
          <div className="text-center text-gray-500 pt-10">
            <p>Your video scenes will appear here.</p>
          </div>
        )}
        {isBrainstorming && (
             <div className="flex flex-col items-center justify-center text-center text-gray-400 p-4">
                <Loader className="w-8 h-8 text-indigo-400 mb-3" />
                <p className="font-semibold">Brainstorming Scene Ideas...</p>
                <p className="text-sm">The AI is getting creative!</p>
            </div>
        )}
        {!isBrainstorming && scenes.map((scene, index) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            index={index}
            onRetry={onRetryScene}
          />
        ))}
      </div>
    </div>
  );
};

export default SceneEditor;