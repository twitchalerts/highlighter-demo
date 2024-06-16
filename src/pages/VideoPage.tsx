import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import WaveSurferComponent from "../components/WaveSurferPlayer";
import { useRoute } from 'react-router5';
import { AudioClassificationPlot } from "../components/AudioClassificationPlot";
import { VideoPageController } from "./VideoPageController";
import VideoCursor from "../components/VideoCursor";
import { useObjectWithActions } from "../utils/store";
import { TopHighlightCategories } from "../components/HighlightCategories";
import { BiRefresh, BiTrash } from "react-icons/bi";
import { swrApi } from "../api";
import Timeline from "../components/Timeline/Timeline";

const VideoControllerCtx = createContext<VideoPageController | null>(null);

export function useVideoController() {
  const controller = useContext(VideoControllerCtx);
  if (!controller) {
    throw new Error('useVideoController must be used within a VideoControllerCtx.Provider');
  }
  return controller;
}


export function VideoPage() {
  const videoId = useRoute().route.params.id;

  const controller = useObjectWithActions(() => {
    return new VideoPageController(videoId);
  }, [videoId]);

  return (
    <VideoControllerCtx.Provider value={controller}>
      <VideoPageView />
    </VideoControllerCtx.Provider>
  )
}



function VideoPageView() {
  const { store } = useVideoController();
  const isInfoLoaded = store.useState(s => s.isInfoLoaded);
  const error = store.useState(s => s.error);
  const name = store.useState(s => s.name);

  if (error) {
    return (
      <>
        <div role="alert" className="alert alert-error">
          <span>{error}</span>
        </div>
        <ActionsMenu />
      </>
    )
  }

  if (!isInfoLoaded) {
    return <div>Loading...</div>
  }

  return (
    <div className="relative">
      <h1 className="text-gray-400">{name}</h1>
      <MainVideoPlayer />
      <ActionsMenu />
      {/* <Timeline /> */}
      {/* <VideoCursor/> */}
      {/* <WaveSurferComponent videoSelector="#video" />
          <AudioClassificationPlot /> */}
      {/* <HighlightCandidates />  */}
      <TopHighlightCategories />
    </div>
  )
}


export function MainVideoPlayer() {
  const { setCursor, videoUrl, store } = useVideoController();
  const { sourcePlatform, sourceId } = store;
  const videoElId = 'video';
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // sync video time with cursor in store
    const video = videoRef.current = document.getElementById(videoElId) as HTMLVideoElement;
    if (video) {
      video.addEventListener('timeupdate', () => {
        setCursor(video.currentTime * 1000);
      });
    }
  }, []);

  // show twitch player for twitch videos
  if (sourcePlatform === 'twitch') {

    return (
      <iframe
        src={`https://player.twitch.tv/?video=${sourceId}&autoplay=false&parent=localhost&parent=videolab.streamlabs.dev`}
        width="100%"
        height={400}
      />
    )
  }

  // show default video player for other videos
  return (<video src={videoUrl} id={videoElId} className="w-full max-h-80" controls />);
}

export function ActionsMenu() {
  const { store } = useVideoController();
  const { trigger: triggerRemove } = swrApi.videoRemove.useSWRMutation();
  const videoId = store.id;

  const onClickHandler = useCallback((e) => {
    alert('TODO: not implemented yet');
  }, []);

  const onRemoveClickHandler = useCallback(async () => {
    await triggerRemove({ id: videoId });
    window.location.href = '/';  // redirect to home page
  }, []);


  return (
    <div className="w-full flex justify-center p-2">
      <ul className="menu bg-base-200 lg:menu-horizontal rounded-box">
        <li>
          <a onClick={onClickHandler}>
            <BiRefresh />
            Recompute
          </a>
        </li>
        <li>
          <a onClick={onRemoveClickHandler}>
            <BiTrash />
            Delete
          </a>
        </li>

      </ul>
    </div>

  )
}