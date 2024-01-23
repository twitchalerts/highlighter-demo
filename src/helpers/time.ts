import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

export function formatSeconds(seconds: number) {
    const dur = dayjs.duration(seconds, 'seconds');
    // Format the duration to include hours only if they exist
    const formatString = dur.hours() > 0 ? 'HH:mm:ss' : 'mm:ss';
    return dur.format(formatString);
}
