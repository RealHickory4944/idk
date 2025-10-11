import React from 'react';
import { Scene, SceneStatus, ErrorType } from '../types';
import Loader from './Loader';
import { FilmIcon, RetryIcon } from './Icons';

interface SceneCardProps {
  scene: Scene;
  index: number;
  onRetry?: (sceneId: string) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, index, onRetry }) => {
  
  const getBorderColor = () => {
    switch (scene.status) {
      case SceneStatus.Generating:
        return 'border-indigo-500 animate-pulse';
      case SceneStatus.Success:
        return 'border-green-500';
      case SceneStatus.Error:
        return 'border-red-500';
      case SceneStatus.Queued:
        return 'border-gray-600';
      default:
        return 'border-gray-700';
    }
  }

  const thumbnail = scene.videoUrl ? (
    <video src={scene.videoUrl} className="w-full h-full object-cover" muted loop autoPlay />
  ) : (
    <div className="w-full h-full bg-gray-900/50 flex items-center justify-center">
      {scene.status === SceneStatus.Generating ? (
        <Loader className="w-6 h-6 text-indigo-400" />
      ) : (
        <FilmIcon className="w-8 h-8 text-gray-500" />
      )}
    </div>
  );

  return (
    <div
      className={`w-full flex items-center gap-4 p-3 rounded-lg bg-gray-800 border ${getBorderColor()} transition-colors`}
    >
      <div className="w-24 h-14 rounded-md overflow-hidden flex-shrink-0 bg-black">
        {thumbnail}
      </div>
      <div className="text-left overflow-hidden flex-grow">
        <h4 className="font-semibold text-white truncate">Scene {index + 1}</h4>
        <p className="text-sm text-gray-400 truncate" title={scene.prompt}>{scene.prompt}</p>
        
        {scene.status === SceneStatus.Queued && (
          <p className="text-xs text-gray-400 truncate">Waiting to generate...</p>
        )}
        {scene.status === SceneStatus.Generating && (
          <p className="text-xs text-indigo-300 truncate">{scene.progressMessage}</p>
        )}
        {scene.status === SceneStatus.Error && (
            <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-red-400 truncate flex-grow" title={scene.progressMessage}>
                    {scene.progressMessage}
                </p>
                {scene.errorType === ErrorType.Internal && onRetry && (
                    <button
                        onClick={() => onRetry(scene.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 -m-1"
                        title="Retry scene generation"
                        aria-label="Retry scene generation"
                    >
                        <RetryIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default SceneCard;
