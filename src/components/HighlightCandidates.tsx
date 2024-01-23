import { useEffect, useRef, useState } from "react";
import { useVideoController } from "../pages/VideoPage";
import { getAudioHighlightInfo } from "../pages/VideoPageController";

export function HighlightCandidates() {
    const { store } = useVideoController();
    const segments = store.useState(s => s.audioHighlightsTier1);


    return (
        <div className="flex flex-wrap gap-4">
            {segments.map((_, ind) => <VideoSegmentPreview ind={ind} key={ind}/>)}
        </div>
    )
}


export function VideoSegmentPreview({ ind }: { ind: number }) {
    const { store, videoUrl } = useVideoController();
    const segment = store.useState(s => getAudioHighlightInfo(s, ind));


    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const togglePlay = () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.currentTime = segment.startTimeInSec;;
            videoRef.current.play();
        }

        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        videoRef.current.currentTime = segment.startTimeInSec;
        const handleTimeUpdate = () => {
            if (video.currentTime >= segment.startTimeInSec + segment.durationInSec) {
                video.pause();
                setIsPlaying(false);
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, [ind]);

    return (
        <div className="card card-side bg-base-100 shadow-xl" onClick={togglePlay}>
            <figure>
                <video className="w-[320px]" ref={videoRef} src={videoUrl} />
            </figure>
            <div className="card-body">
                <h2 className="card-title">Segment {ind}</h2>
                <div>
                    <div>Start: {segment.startTimeFormatted}</div>
                    <div>Duration: {segment.durationFormatted}</div>
                    <div>Peak Score: {segment.peakScore.toFixed(3)}</div>
                </div>
                <div className="card-actions justify-end">
                    <button className="btn btn-primary">Watch</button>
                </div>
            </div>
        </div>
    )
}