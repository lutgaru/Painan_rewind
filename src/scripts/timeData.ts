import { atom } from "nanostores";

const initialStartTime = new Date('2020-01-01T00:00:00Z').getTime();
const initialEndTime = new Date('2023-01-30T23:59:59Z').getTime();
const initialCurrentTime = new Date('2024-01-01T12:00:00Z').getTime();

export const timeDataStore = atom({ 
    date: initialCurrentTime, 
    range: [initialStartTime, initialEndTime] 
});

export { initialStartTime, initialEndTime};