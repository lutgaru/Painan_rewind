import { atom, computed } from "nanostores";

const initialStartTime = new Date('2020-01-01T00:00:00Z').getTime();
const initialEndTime = new Date('2023-01-30T23:59:59Z').getTime();
const initialCurrentTime = new Date('2021-09-07T12:00:00Z').getTime();

export const timeDataStore = atom({ 
    date: initialCurrentTime, 
    range: [initialStartTime, initialEndTime] 
});

// Derived store that only changes when `range` changes. The charts subscribe to
// this instead of the whole store, so the 250 ms mission clock (which only moves
// `date`) no longer re-renders the entire Recharts tree several times a second.
// `atom.set` short-circuits on identical values, so the stable `range` ref means
// no notification is emitted on date ticks.
export const timeRangeStore = computed(timeDataStore, (s) => s.range);

export { initialStartTime, initialEndTime, initialCurrentTime };