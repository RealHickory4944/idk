
import React, { useState, useEffect, useRef } from 'react';
import { FilmIcon } from './Icons';

interface VideoPlayerProps {
  videoUrls: string[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrls }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setCurrentVideoIndex(0);
  }, [videoUrls]);

  useEffect(() => {
    if (videoRef.current && videoUrls.length > 0) {
      videoRef.current.src = videoUrls[currentVideoIndex];
      videoRef.current.play().catch(error => {
        console.warn("Autoplay was prevented:", error);
      });
    }
  }, [currentVideoIndex, videoUrls]);

  const handleVideoEnded = () => {
    if (currentVideoIndex < videoUrls.length - 1) {
      setCurrentVideoIndex(prevIndex => prevIndex + 1);
    }
  };
  
  if (videoUrls.length === 0) {
    return (
        <div className="aspect-video w-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500">
            <FilmIcon className="w-16 h-16 mb-4"/>
            <h3 className="text-xl font-semibold">Your Final Video</h3>
            <p>Generate some clips and click "Create Full Video"</p>
        </div>
    );
  }

  return (
    <div className="w-full">
      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          onEnded={handleVideoEnded}
          controls
          className="w-full h-full"
          key={currentVideoIndex}
        />
      </div>
      <div className="mt-4 text-center text-gray-400">
        <p>Playing clip {currentVideoIndex + 1} of {videoUrls.length}</p>
      </div>
    </div>
  );
};

export default VideoPlayer;
