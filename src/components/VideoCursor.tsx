import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';

export default function VideoCursor() {
  const videoElId = 'video';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

//   useEffect(() => {
//     const video = videoRef.current = document.getElementById(videoElId) as HTMLVideoElement;
//     if (video) {
//       video.addEventListener('timeupdate', () => {
//         setCurrentTime(video.currentTime);
//       });
//       video.addEventListener('loadedmetadata', () => {
//         setDuration(video.duration);
//       });
//     }
//   }, []);

//   const onDragStop = (e, d) => {
//     const newTime = (d.x / videoRef.current.clientWidth) * duration;
//     videoRef.current.currentTime = newTime;
//   };

//   const cursorPosition = {
//     x: (currentTime / duration) * 100, // Assuming 100% width is the full duration
//     y: 0
//   };

  return (
    <Rnd
    default={{
        x: 0,
        y: 0,
        width: 320,
        height: 200,
      }}
    // position={cursorPosition}
    className=''
    bounds="parent"
    // onDragStop={onDragStop}
    enableResizing={false}
  >
    <div className="h-96 w-1 bordered bg-red-500"></div>
  </Rnd>
  );
};