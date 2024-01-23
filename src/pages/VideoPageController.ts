/**
 * The logic for components in the VideoPage.
 */

import axios from "axios";
import { VideoInfo } from "../../server/db";
import { api } from "../api";
import { sleep } from "../utils/sleep";
import { initStore } from "../utils/store";
import { SegmentSummary, findHighlightAudioSegments, findTopSegments } from "../helpers/generateTier1Highlights";
import { AudioSegment, ClassificatorData, DEFAULT_PRESET } from "../helpers/video-helpers";
import { formatSeconds } from "../helpers/time";
import { cloneDeep } from "lodash";


export type TopCategory = {
    name: string;
    color: string;
    description: string;
    triggerAudioClasses: string[];
    segments: SegmentSummary[];
}

const topCategories: TopCategory[] = [
    { 
        name: 'Emotions',
        color: '#ff0000',
        description: '🫨 Top emotional moments',
        triggerAudioClasses: [
            'Shout',
            'Yell',
            'Screaming',
        ],
        segments: [],
    },
    {
        name: 'Gunshots',
        color: '#00ff00',
        description: '🔫The most gunshots',
        triggerAudioClasses: [
            'Gunshot, gunfire',
        ],
        segments: [],
    },
    {
        name: 'Funniest moments',
        color: '#0000ff',
        description: '😂 Top funniest moments',
        triggerAudioClasses: [
            'Cheering',
            'Laughter',
        ],
        segments: [],
    }
]


export class VideoPageController {

    store = initStore({
        id: '',
        name: '',
        files: [] as string[],
        size: 0,
        duration: 0,
        classificatorData: null as (null | ClassificatorData),
        filteredClassificatorData: null as (null | ClassificatorData),
        cursor: 0, // current playback position in ms
        presets: { default: DEFAULT_PRESET },
        audioHighlightsTier1: [] as AudioSegment[],
        topCategories: cloneDeep(topCategories) as TopCategory[],
    }) satisfies VideoInfo;

    constructor(id: string) {
        this.store.setState({ id });
        this.load();
    }

    get videoUrl() {
        return '/uploads/' + this.store.id + '/video.mp4';
    }

    async load() {
        const id = this.store.id;


        // POLL VIDEO INFO
        do {
            
            // load video info to store
            const videoInfo = await api.videoById.query(id);
            if (!videoInfo) {
                throw new Error(`Video with id ${id} not found`);
            }

            this.store.setState(s => { 
                Object.assign(s, videoInfo);
             });

            // load classificator data if not loaded yet
            const shouldLoadClassificatorData = !this.store.classificatorData && videoInfo.files.includes('scores_data.json');
            if (shouldLoadClassificatorData) {
                await this.loadClassificatorData();
            }
            await sleep(5000);
        } while (true) {

        }
    
    }

    public setCursor(ms: number) {
        this.store.setState(s => { s.cursor = ms });
    }

    private async loadClassificatorData() {
        const id = this.store.id;
        const classificatorData =  await api.videoClassificatorData.query(id);
        const config = this.store.presets.default;
        const filteredClassificatorData = { 
            classNames: [],
            scores: []
        } as ClassificatorData;

        for (let classInd = 0; classInd < classificatorData.classNames.length; classInd++) {
            const className = classificatorData.classNames[classInd];

            if (!config.targetClasses.includes(className)) continue;

            const scores = classificatorData.scores[classInd];
            filteredClassificatorData.classNames.push(className);
            filteredClassificatorData.scores.push(scores);
        }
        
        this.store.setState(s => { 
            s.classificatorData = classificatorData;
            s.filteredClassificatorData = filteredClassificatorData;
        });
        

        // foun highlight audio segments
        // const audioHighlights = findHighlightAudioSegments(filteredClassificatorData, 30, config.tier1SegmentsCnt);
        // this.store.setState(s => { 
        //     s.classificatorData = classificatorData;
        //     s.filteredClassificatorData = filteredClassificatorData;
        //     s.audioHighlightsTier1 = audioHighlights;
        // });

        // find top categories
        this.store.topCategories.forEach((category, categoryInd) => {
            const { triggerAudioClasses } = category;
            const segments = findTopSegments(classificatorData, 30, 5, sementSummary => {
                const avgs = triggerAudioClasses.map(className => sementSummary.scoresForEachClass[className].avg);
                return Math.max(...avgs);
            });
            this.store.setState(s => {
                s.topCategories[categoryInd].segments = segments;
            });
        });
    }

    
}

export type VideoPageControllerState = ReturnType<VideoPageController['store']['getState']>;

export function getAudioHighlightInfo(state: VideoPageControllerState, highlightInd: number) {
    const highlight = state.audioHighlightsTier1[highlightInd];
    const videoDuration = state.duration;
    const totalSegments = state.classificatorData?.scores[0].length || 0;
    const startTimeInSec = videoDuration / totalSegments  * highlight.startAudioFrameInd;
    const durationInSec = videoDuration / totalSegments * highlight.durationInAudioFrames;
    return {
        ...highlight,
        startTimeInSec,
        durationInSec,
        startTimeFormatted: formatSeconds(startTimeInSec),
        durationFormatted: formatSeconds(durationInSec),
    }
}