import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVideoController } from "../pages/VideoPage";
import { TopCategory, VideoPageControllerState, getAudioHighlightInfo } from "../pages/VideoPageController";
import { formatSeconds } from "../helpers/time";
import { SegmentSummary } from "../helpers/findHighlights";


export function TopHighlightCategories() {
    const { store } = useVideoController();
    const categories = store.useState(s => s.topCategories);
    const isProcessing = store.useState(s => s.classificatorData === null);
    return (
        <>
            {isProcessing && <progress className="progress w-56"></progress>}
            {!isProcessing && categories.map(category => <TopSegments key={category.name} category={category} />)}
        </>
    )
}

export function TopSegments({ category }: { category: TopCategory } ) {
    const segments = category.segments;

    return (
        <>
            <h2>{category.description}</h2>
            <p className="text-secondary py-2">Trigger classes: {category.triggerAudioClasses.join(', ')} </p>
            <div className="flex flex-wrap gap-4">
                {segments.map((_, ind) => <TopVideoSegmentPreview key={ind} category={category} segmentInd={ind} />)}
            </div>

        </>
    )
}

function getTopSegmentInfo(state: VideoPageControllerState, segmentSummary: SegmentSummary) {
    const videoDuration = state.duration;
    const totalSegments = state.classificatorData?.scores.length || 0;
    const startTimeInSec = videoDuration / totalSegments  * segmentSummary.startInd;
    const durationInSec = videoDuration / totalSegments * segmentSummary.length;
    return {
        ...segmentSummary,
        startTimeInSec,
        durationInSec,
        startTimeFormatted: formatSeconds(startTimeInSec),
        durationFormatted: formatSeconds(durationInSec),
    }
}


function TopVideoSegmentPreview({ category, segmentInd }: { category: TopCategory, segmentInd: number }) {
    const { store, videoUrl } = useVideoController();
    const { sourcePlatform, sourceId } = store;
    const segment = store.useState(s => getTopSegmentInfo(s, category.segments[segmentInd]));
    const timeBefore = 4; // add 2 seconds before
    const timeAfter = 2; // add 2 seconds after
    const startTimeInSec = segment.startTimeInSec - timeBefore;
    const durationInSec = segment.durationInSec + timeAfter;


    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const togglePlay = () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.currentTime = startTimeInSec;
            videoRef.current.play();
        }

        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        videoRef.current.currentTime = startTimeInSec;
        const handleTimeUpdate = () => {
            if (video.currentTime >= startTimeInSec + durationInSec) {
                video.pause();
                setIsPlaying(false);
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, [segmentInd]);

    return (

        // <div className="float-left w-[240px]">
        //     frame {segment.startInd} - {segment.startInd + segment.length}
        // </div>
        <div className="card card-side bg-base-100 shadow-xl cursor-pointer" >
            <figure>
                {sourcePlatform === 'twitch' && <TwitchPlayer videoId={sourceId} startTimeInSec={startTimeInSec} durationInSec={durationInSec} />}
                {sourcePlatform !== 'twitch' && <video onClick={togglePlay} className="w-[640px]" ref={videoRef} src={videoUrl} />}
            </figure>
            <div className="card-body">
                <h2 className="card-title">Segment {segmentInd}</h2>
                <div>
                    <div>Start: {segment.startTimeFormatted}</div>
                    <div>Duration: {segment.durationFormatted}</div>
                    <div>Score: {segment.score.toFixed(3)}</div>
                </div>
                {/* <div className="card-actions justify-end">
                    <button className="btn btn-primary">Watch</button>
                </div> */}
            </div>
        </div>
    )
}


function TwitchPlayer({ videoId, startTimeInSec, durationInSec }: { videoId: string, startTimeInSec: number, durationInSec: number }) {
    const playerRef = useRef<any>(null);
    const playerStateRef = useRef({ isStopped: true, timeoutId: null as any});
    const id = useMemo(() => 'twitch-player' + Math.random().toString(36).substr(2, 9), []);

    var options = {
        width: 640,
        height: 480,
        video: videoId,
        timestamp: startTimeInSec,
        autoplay: false,
        // // only needed if your site is also embedded on embed.example.com and othersite.example.com
        // parent: ["embed.example.com", "othersite.example.com"]
    };

    function restartPlayback() {
        const player = playerRef.current;
        player.seek(startTimeInSec);
        player.play();
        playerStateRef.current.isStopped = false;
        clearTimeout(playerStateRef.current.timeoutId);
        playerStateRef.current.timeoutId = setTimeout(() => {
            stopPlayback();
        }, durationInSec * 1000);
    }

    function stopPlayback() {
        const player = playerRef.current;
        player.pause();
        player.seek(startTimeInSec);
        playerStateRef.current.isStopped = true;
    }

    useEffect(() => {
        const player = playerRef.current = new Twitch.Player(id, options);
        // return () => player.destroy();
    }, [videoId])

    const onClickHandler = useCallback(() => {
        if (playerStateRef.current.isStopped) {
            restartPlayback();
        } else {
            stopPlayback();
        }
    }, [videoId]);




    return (
        <div onClick={onClickHandler}>
            <div id={id} style={{ pointerEvents: 'none' }}></div>
        </div>
    )

}

