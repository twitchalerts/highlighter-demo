import { useMemo } from "react";
import { swrApi } from "../api";
import { useRoute } from "react-router5";
import { BiLogoTwitch } from "react-icons/bi";

export function VideoList() {
    const { data, error, isLoading } = swrApi.videoList.useSWR();
    const { router } = useRoute();
    const activeVideoId = router.getState().params.id;
    const shouldShowAddBtn = !!activeVideoId;
    
    return (
        <>

        <ul className="menu rounded-box">

            {shouldShowAddBtn && (
                <li onClick={() => window.location.href="/"}>
                    <div className="border-2 border-dashed border-gray-300 text-gray-500 text-center w-full block mb-4">ADD VIDEO</div>
                </li>
            )}


            {data && data.map(video => (
                <li key={video.id}  onClick={() => router.navigate('video', {id: video.id}) }>
                    <div className={`flex items-start gap-4 cursor-pointer ${video.id === activeVideoId ? 'active' : ''}`}>
                        {video.sourcePlatform === 'twitch' && <><BiLogoTwitch className="w-24 h-16 text-purple-500 border-[1px] border-gray-400/25"  /></>}
                        {!video.sourcePlatform && (
                            <img className="w-24" src={`/uploads/${video.id}/thumbnail.png`} alt="thumbnail" />
                        )}
                      
                        
                        <div>
                            <div className="text-sm text-gray-500">{video.name || video.sourceId}</div>
                        </div>
                    </div>

                </li>
            ))}
        </ul>
        </>
    )
}