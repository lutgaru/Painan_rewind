import React from 'react';
import * as decoder from './decoder'
import moment from 'moment';
import painaniframes from '../data/painanidata.json';

interface framesatnogs {
    [key: string]: any  
    frame:string,
    timestamp:string
}

function decodeFrames(frames:Array<framesatnogs>){

    var shorts:{[key: string]: any;}={}
    var larges:{[key: string]: any;}={}

    for(let x of frames){
       if(x.frame.length===60){
           //console.log(x)
           shorts[x.timestamp]=decoder.decoder_short_beacon(x.frame)
       }
       if(x.frame.length===144){
           //console.log(x.frame)
           larges[x.timestamp]=decoder.decoder_large_beacon(x.frame)
        }
    }

    //console.log(larges)
    //console.log(shorts)

    return {
        'shorts': shorts,
        'large':larges,
    }
}

async function getListsofValues(){
    var frames = painaniframes as Array<framesatnogs>;
    // if (localStorage.getItem('frames')==null){
    //     await getPainanidataRange(0);
    //     console.log("no hay")
    //     frames = JSON.parse(localStorage.getItem('frames')!);
    //     //console.log(frames)
    // }
    // else{
    //     frames = JSON.parse(localStorage.getItem('frames')!);
    //     await updatetimes(frames)
    //     //console.log(frames)
    // }
    return decodeFrames(frames);


}

async function getdatagraphs() {
            let listofvals = await getListsofValues()
            let tempshorts = []
            let voltshors = []
            let currentshors = []
            let gyrolarge = []
            let chargecapacity = []
            let batvolts = []

            //console.log(listofvals.shorts)

            for (const e in listofvals.shorts) {
                //smpt[e]=listofvals.shorts[e].SMPST
                tempshorts.push({ 'name': moment(e).valueOf(), 'smpt': listofvals.shorts[e].SMPST, 'pat': listofvals.shorts[e].PAT })
                voltshors.push({ 'name': moment(e).valueOf(), 'v3v3': listofvals.shorts[e].V3V3, 'v5v': listofvals.shorts[e].V5V })
                currentshors.push({ 'name': moment(e).valueOf(), 'c3v3': listofvals.shorts[e].C3V3, 'c5v': listofvals.shorts[e].C5V })


            }
            //console.log(listofvals)
            for (const e in listofvals.large) {
                //smpt[e]=listofvals.shorts[e].SMPST
                gyrolarge.push({ 'name': moment(e).valueOf(), 'gyrox': listofvals.large[e].GyroX, 'gyroy': listofvals.large[e].GyroY, 'gyroz': listofvals.large[e].GyroZ })
                chargecapacity.push({ 'name': moment(e).valueOf(), 'BankChar1': listofvals.large[e].BankChar1, 'BankChar2': listofvals.large[e].BankChar2 })
                batvolts.push({ 'name': moment(e).valueOf(), 'BankVolt1': listofvals.large[e].BankVolt1, 'BankVolt2': listofvals.large[e].BankVolt2 })
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
                }),
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

export {getListsofValues,getdatagraphs};