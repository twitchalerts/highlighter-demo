import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID
 */
export function uuid(prfix = '') {
    return `${prfix && prfix + '__'}${uuidv4()}`;
}