import { useMemo } from "react";
import { swrApi } from "../api";
import { useRoute } from "react-router5";

export function VideoList() {
    const { data, error, isLoading } = swrApi.videoList.useSWR();
    const { router } = useRoute();
    const activeVideoId = router.getState().params.id;
    
    return (
        <>

        <ul className="menu rounded-box">
            <li onClick={() => window.location.href="/"}>
                <div className="border-2 border-dashed border-gray-300 text-gray-500 text-center w-full block mb-4">ADD VIDEO</div>
            </li>

            {data && data.map(video => (
                <li key={video.id}  onClick={() => router.navigate('video', {id: video.id}) }>
                    <div className={`flex items-start gap-4 ${video.id === activeVideoId ? 'active' : ''}`}>
                        <img className="w-24" src={`/uploads/${video.id}/thumbnail.png`} alt="thumbnail" />
                        <div>
                            <div className="text-sm text-gray-500">{video.name}</div>
                        </div>
                    </div>

                </li>
            ))}
        </ul>
        </>
    )
}