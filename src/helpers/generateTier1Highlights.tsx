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
    score: number,
    startInd: number,
    length: number,
}

export type SegmentSummaryWithScore = SegmentSummary & { score: number };
export type GetSegmentScoreFn = (classificatorData: ClassificatorData, startInd: number, segmentLength: number) => number;

function findSegmentWithMaxScore(classificatorData: ClassificatorData, usedIndexes: Record<number, boolean>, segmentLength: number,
     getSegmentScore: GetSegmentScoreFn)
{
    let maxScore = 0;
    let maxScoreSegment = { score: 0, startInd: 0, length: 0 };

    function canUseSegment(startInd: number, length: number) {
        for (let ind = startInd; ind < startInd + length; ind++) {
            if (usedIndexes[ind]) return false;
        }
        return true;
    }

    for (let startInd = 0; startInd < classificatorData.scores.length - segmentLength; startInd++) {
        if (!canUseSegment(startInd, segmentLength)) continue;
        const score = getSegmentScore(classificatorData, startInd, segmentLength);
        if (score > maxScore) {
            maxScore = score;
            maxScoreSegment = { score, startInd, length: segmentLength };
        }
    }
    return maxScoreSegment;
}


export function findTopSegments(
    classificatorData: ClassificatorData,
    segmentLength: number,
    maxSegments: number,
    getSegmentScore: GetSegmentScoreFn,
    treshold = 0,
    ) {
    const usedIndexes: Record<number, boolean> = {};
    const segments: {score: number, startInd: number, length: number}[] = [];


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


export function calculateSegmentScoreByAvgScores(classificatorData: ClassificatorData, startInd: number, length: number, classNames: string[]) {
    let totalScore = 0;
    for (let ind = startInd; ind < startInd + length; ind++) {
        let frameMaxScore = 0;
        for (let classInd = 0; classInd < classNames.length; classInd++) {
            const className = classNames[classInd];
            const classScore = getScoreForClass(classificatorData, ind, className);
            frameMaxScore = Math.max(classScore, frameMaxScore);
        }
        totalScore += frameMaxScore;
    }
    const avgScore = totalScore / length;
    return avgScore;
}

function getScoreForClass(classificatorData: ClassificatorData, frameInd: number, className: string) {
    const classInd = classificatorData.classNames.indexOf(className);
    return classificatorData.scores[frameInd][classInd];
}