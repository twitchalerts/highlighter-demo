import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { set } from 'zod';
import { sleep } from '../utils/sleep';

const WaveSurferComponent = ({ videoSelector }: {videoSelector: string }) => {
  const waveSurferRef = useRef<WaveSurfer>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  useEffect(() => {
    // Ensure WaveSurfer is not initialized more than once
    if (waveSurferRef.current) {
      return;
    }

    // Initialize WaveSurfer
    waveSurferRef.current = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'rgb(200, 0, 200)',
      progressColor: 'rgb(100, 0, 100)',
      media: document.querySelector(videoSelector),
    });

    waveSurferRef.current.on('ready', () => {
      setIsLoaded(true);
    });


    // Clean up on unmount
    return () => {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
      }
    };
  }, [videoSelector]); // Only re-run if videoSelector changes

  return (
    <div className='relative  pl-[45px]'>
      {/* Your component's JSX here. For example, a placeholder for the waveform */}
      <div id="waveform" ></div>
      
      {!isLoaded && <div className='h-[128px] w-full top-0 absolute flex items-center justify-center'>
        <progress className="progress w-56"></progress>
        </div>
      }
    </div>
  );
};

export default WaveSurferComponent;
