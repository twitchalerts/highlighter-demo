import { useCallback, useEffect, useMemo, useRef } from "react";
import VideoUploader from "../components/VideoUploader";

export function HomePage() {

    return (
        <>
            <VideoUploader />

            {/* <div className="card">

                <TwitchPlayer videoId="1952244075" timestamp={60} />
            </div>

            <div className="card">

                <TwitchPlayer videoId="1952244075" timestamp={160} />
            </div> */}

        </>
    )
}


function TwitchPlayer({ videoId, timestamp }: { videoId: string, timestamp: number }) {
    const playerRef = useRef<any>(null);
    const playerStateRef = useRef({ isStopped: true });
    const id = useMemo(() => 'twitch-player' + Math.random().toString(36).substr(2, 9), []);

    var options = {
        width: 640,
        height: 480,
        video: videoId,
        timestamp,
        autoplay: false,
        // // only needed if your site is also embedded on embed.example.com and othersite.example.com
        // parent: ["embed.example.com", "othersite.example.com"]
    };

    function restartPlayback() {
        const player = playerRef.current;
        player.seek(timestamp);
        player.play();
        playerStateRef.current.isStopped = false;
        setTimeout(() => {
            stopPlayback();
        }, 5000);
    }

    function stopPlayback() {
        const player = playerRef.current;
        player.pause();
        player.seek(timestamp);
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