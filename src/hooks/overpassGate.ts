import { Semaphore } from '../utils/semaphore';

export const overpassGate = new Semaphore(2);
