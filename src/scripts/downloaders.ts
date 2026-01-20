import * as decoder from './decoder'
import moment from 'moment';
import frames_short from '../data/frames_short.json';
import frames_long from '../data/frames_long.json';

interface Frame {
    date: string;
    frame: string;
    observer: string;
}

enum FrameType {
    Short = 'short',
    Long = 'long',
}

function decodeFrames(frames: Array<Frame>, frame_type: FrameType) {

    var frame: { [key: string]: any; } = {}
    // console.log(frames[1].frame.length)
    for (let x of frames) {
        if (frame_type === FrameType.Short) {
            frame[x.date] = decoder.decoder_short_beacon(x.frame)
        }
        else if (frame_type === FrameType.Long) {
            frame[x.date] = decoder.decoder_large_beacon(x.frame)
        }
    }
    return frame;
}

async function getListsofValuesRange(starttime: number, endtime: number, decimationFactor: number = 1, frame_type: FrameType = FrameType.Short) {
    const frames = frame_type === FrameType.Long ? frames_long as Array<Frame> : frames_short as Array<Frame>;

    let filteredFrames = frames.filter(frame => {
        const frameTimestamp = moment(frame.date).valueOf();
        return frameTimestamp >= starttime && frameTimestamp <= endtime;
    });

    // Decimate the array if a factor greater than 1 is provided
    if (decimationFactor > 1) {
        console.log(`Original samples: ${filteredFrames.length}. Decimating by a factor of ${decimationFactor}.`);
        filteredFrames = filteredFrames.filter((_, index) => index % decimationFactor === 0);
        console.log(`New sample count: ${filteredFrames.length}.`);
    }

    const filteredListValues = decodeFrames(filteredFrames, frame_type);
    return filteredListValues;
}

async function getdatagraphsShort(starttime: number, endtime: number) {
    const desiredSamples = 100; // Target number of samples
    const initialFrames = frames_short.filter(f => { const ts = moment(f.date).valueOf(); return ts >= starttime && ts <= endtime; });
    const decimationFactor = initialFrames.length > desiredSamples ? Math.ceil(initialFrames.length / desiredSamples) : 1;
    let listofvals = await getListsofValuesRange(starttime, endtime, decimationFactor, FrameType.Short);
    console.log(listofvals)
    let tempshorts = []
    let voltshors = []
    let currentshors = []
    for (const e in listofvals) {
        //smpt[e]=listofvals.shorts[e].SMPST
        tempshorts.push({ 'name': moment(e).valueOf(), 'smpt': listofvals[e].SMPST, 'pat': listofvals[e].PAT })
        voltshors.push({ 'name': moment(e).valueOf(), 'v3v3': listofvals[e].V3V3, 'v5v': listofvals[e].V5V })
        currentshors.push({ 'name': moment(e).valueOf(), 'c3v3': listofvals[e].C3V3, 'c5v': listofvals[e].C5V })
    }
    return {
        'tempshorts': tempshorts.sort(function (a, b) {
            return a.name - b.name;
        }),
        'voltshors': voltshors.sort(function (a, b) {
            return a.name - b.name;
        }),
        'currentshors': currentshors.sort(function (a, b) {
            return a.name - b.name;
        })
    }
}

async function getdatagraphsLong(starttime: number, endtime: number) {
    const desiredSamples = 100; // Target number of samples
    const initialFrames = frames_long.filter(f => { const ts = moment(f.date).valueOf(); return ts >= starttime && ts <= endtime; });
    const decimationFactor = initialFrames.length > desiredSamples ? Math.ceil(initialFrames.length / desiredSamples) : 1;
    let listofvals = await getListsofValuesRange(starttime, endtime, decimationFactor, FrameType.Long);
    console.log(listofvals)
    let gyrolarge = []
    let chargecapacity = []
    let batvolts = []

    for (const e in listofvals) {
        gyrolarge.push({ 'name': moment(e).valueOf(), 'gyrox': listofvals[e].GyroX, 'gyroy': listofvals[e].GyroY, 'gyroz': listofvals[e].GyroZ })
        chargecapacity.push({ 'name': moment(e).valueOf(), 'BankChar1': listofvals[e].BankChar1, 'BankChar2': listofvals[e].BankChar2 })
        batvolts.push({ 'name': moment(e).valueOf(), 'BankVolt1': listofvals[e].BankVolt1, 'BankVolt2': listofvals[e].BankVolt2 })
    }

    return {
        'gyrolarge': gyrolarge.sort(function (a, b) {
            return a.name - b.name;
        }),
        'chargecapacity': chargecapacity.sort(function (a, b) {
            return a.name - b.name;
        }),
        'batvolts': batvolts.sort(function (a, b) {
            return a.name - b.name;
        }),
    }
}

export { getdatagraphsLong, getdatagraphsShort };