import { ClassificatorData, ConfigPreset, AudioSegment } from "./video-helpers";


/**
 * Generates AuidoHighlights from the given classificator data
 */
export function findHighlightAudioSegments(
    classificatorData: ClassificatorData,
    maxFramesInSegment: number,
    maxSegments: number,
): AudioSegment[] {
    const foundSegments: AudioSegment[] = [];
    const usedFrames: Record<number, boolean> = {};

    // get the array with frame indexes sorted by max score
    const sortedMaxScores = getMaxScoresSortedIndexedArr(classificatorData);
    
    // iterate over the sorted array and find the segments
    // also ensure that the segments don't overlap
    for (let i = 0; i < sortedMaxScores.length; i++) {
        const peakFrameInd = sortedMaxScores[i].frameInd;
        if (usedFrames[peakFrameInd]) continue;

        // find the start frame
        let startFrameInd = Math.max(peakFrameInd - Math.round(maxFramesInSegment * 0.75), 0);
        while (usedFrames[startFrameInd]) {
            startFrameInd++;
        }

        // mark all segment frames as used
        let currentFrameInd = startFrameInd;
        do {
            usedFrames[currentFrameInd] = true;
            currentFrameInd++;
        } while (currentFrameInd - startFrameInd < maxFramesInSegment && !usedFrames[currentFrameInd]);

        // add the segment to the list
        foundSegments.push({ 
            startAudioFrameInd: startFrameInd,
            durationInAudioFrames: currentFrameInd - startFrameInd,
            peakAudioFrameInd: peakFrameInd,
            peakScore: sortedMaxScores[i].score,
        });    

        // stop if we have enough segments
        if (foundSegments.length >= maxSegments) break;
    }


    return foundSegments;
}

/**
 * Get the array with frame indexes sorted by max score
 */
function getMaxScoresSortedIndexedArr(classificatorData: ClassificatorData): { score: number, frameInd: number }[] {
    let maxScores: { score: number, frameInd: number }[] = [];
    const framesCnt = classificatorData.scores[0].length;
    for (let i = 0; i < framesCnt; i++) {
        const scoresForEachClassInFrame = classificatorData.scores.map(scores => scores[i]);
        const score = Math.max(...scoresForEachClassInFrame);
        maxScores.push({ score, frameInd: i });
    }
    maxScores.sort((a, b) => b.score - a.score);
    return maxScores;
}

export type SegmentSummary = {
    startInd: number,
    length: number,
    scoresForEachClass: Record<string, { total: number, avg: number, peak: number, peakInd: number}>,
}

export type SegmentSummaryWithScore = SegmentSummary & { score: number };

export function summarizeSegment(classificatorData: ClassificatorData, startInd: number, length: number) {
    const scoresForEachClass: SegmentSummary['scoresForEachClass'] = {} ;
    for (let ind = startInd; ind < startInd + length; ind++) {
        for (let classInd = 0; classInd < classificatorData.classNames.length; classInd++) {
            const className = classificatorData.classNames[classInd];
            const score = classificatorData.scores[classInd][ind];
            if (!scoresForEachClass[className]) {
                scoresForEachClass[className] = { total: 0, avg: 0, peak: 0, peakInd: 0 };
            }
            scoresForEachClass[className].total += score;
            if (score > scoresForEachClass[className].peak) {
                scoresForEachClass[className].peak = score;
                scoresForEachClass[className].peakInd = ind;
            }
        }
    }
    // calculate avg
    for (const className in scoresForEachClass) {
        scoresForEachClass[className].avg = scoresForEachClass[className].total / length;
    }
    return { startInd, length, scoresForEachClass };
}


function findSegmentWithMaxScore(classificatorData: ClassificatorData, usedIndexes: Record<number, boolean>, segmentLength: number, getSegmentScore: (segment: SegmentSummary) => number): SegmentSummary & { score: number } {
    let maxScore = 0;
    let maxScoreSegment: SegmentSummaryWithScore = null;

    function canUseSegment(startInd: number, length: number) {
        for (let ind = startInd; ind < startInd + length; ind++) {
            if (usedIndexes[ind]) return false;
        }
        return true;
    }

    for (let startInd = 0; startInd < classificatorData.scores[0].length - segmentLength; startInd++) {
        if (!canUseSegment(startInd, segmentLength)) continue;
        const segment = summarizeSegment(classificatorData, startInd, segmentLength);
        const score = getSegmentScore(segment);
        if (score > maxScore) {
            maxScore = score;
            maxScoreSegment = { ...segment, score };
        }
    }
    return maxScoreSegment;
}


export function findTopSegments(
    classificatorData: ClassificatorData,
    segmentLength: number,
    maxSegments: number,
    getSegmentScore: (segment: SegmentSummary) => number,
    treshold = 0,
    ): SegmentSummary[] {
    const usedIndexes: Record<number, boolean> = {};
    const segments: SegmentSummaryWithScore[] = [];


    for (let i = 0; i < maxSegments; i++) {
        const segment = findSegmentWithMaxScore(classificatorData, usedIndexes, segmentLength, getSegmentScore);
        if (!segment || segment.score <= treshold) break;
        segments.push(segment);
        for (let ind = segment.startInd; ind < segment.startInd + segment.length; ind++) {
            usedIndexes[ind] = true;
        }
    }
    return segments;
}