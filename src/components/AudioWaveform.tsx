import React, { useState, useRef, useEffect } from 'react';
import { getAudioWaveformData } from '../helpers/video-helpers';

const AudioWaveform = ({ videoUrl }) => {
  const [audioData, setAudioData] = useState(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(new (window.AudioContext || window.webkitAudioContext)());

  useEffect(() => {

    getAudioWaveformData(videoUrl).then((dataArray) => {
        setAudioData(dataArray);
    });

  }, [videoUrl]);

  useEffect(() => {
    // Draw the waveform when the audio data is set
    const drawWaveform = (dataArray) => {
      const canvas = canvasRef.current;
      if (canvas && dataArray) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const step = Math.ceil(dataArray.length / width);
        const amp = height / 2;

        ctx.fillStyle = 'white';
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;

        for (let i = 0; i < width; i++) {
          let min = 1.0;
          let max = -1.0;
          for (let j = 0; j < step; j++) {
            const datum = dataArray[(i * step) + j] / 128 - 1;
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          ctx.lineTo(i, (1 + min) * amp);
          ctx.lineTo(i, (1 + max) * amp);
        }

        ctx.stroke();
      }
    };

    drawWaveform(audioData);
  }, [audioData]);

  return (
    <div>
      <canvas ref={canvasRef} width="600" height="200" />
    </div>
  );
};

export default AudioWaveform;
