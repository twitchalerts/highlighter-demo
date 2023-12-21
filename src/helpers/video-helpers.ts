
export type ConfigPreset = {
  /**
   * Number of parts to split the video into
   * Highlights will be generated for each part, that ensures we have highlights from different parts of the video
   */
  partsCnt: number,
  /**
   * Number candidates for highlights for each part for the tier 1 highlights
   */
  tier1SegmentsCnt: number,
  /**
   * Number candidates for highlights for each part for the tier 2 highlights
   * Should be less than tier1SegmentsCnt
   */
  tier2SegmentsCnt: number,

  /**
   * Minimum length of a segment in milliseconds
   */
  minSegmentLength: number,
  /**
   * Class names from the classificator data to use for highlights generation
   * The higher the score for a class, the more likely it is to be used for highlights generation
   */
  targetClasses: string[];

}

export type AudioSegment = {
  startAudioFrameInd: number;
  durationInAudioFrames: number;
  peakAudioFrameInd: number;
  peakScore: number;
}

export type ClassificatorData = {
  /**
   * Class names from the classificator data
   */
  classNames: string[],
  /**
   * 2d array of scores for each class
   * Scores are in range [0, 1]
   */
  scores: number[][]
}

export const DEFAULT_PRESET: ConfigPreset = {
  partsCnt: 3,
  tier1SegmentsCnt: 9,
  tier2SegmentsCnt: 1,
  minSegmentLength: 5000,
  targetClasses: [
      'Shout',
      'Yell',
      'Screaming',
      // 'Gunshot, gunfire',
      // 'Cheering',
      //'Laughter',
      // 'Whoop',
  ]
}
