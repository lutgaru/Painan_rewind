import React from 'react';
import * as decoder from './decoder'
import painaniframes from '../data/painani.json';

interface framesatnogs {
    [key: string]: any  
    frame:string,
    timestamp:string
}


async function getPainanidata(numberpage: number):Promise<Array<framesatnogs>> {

    let numberstr=numberpage===0?'':'&page='+numberpage
    try {
        //eslint-disable-next-line
        let response = await fetch('/lastdata/uc?export=view&id=1RpglC6UyQ8UBi_VmRgJG3wsoQH4Omvps')
        .then((response) => {
            return response.text();
         })
         .then((responseStr) => {
            console.log(responseStr);
         })
        //console.log(response)  
        //let responseJson = await response.json();
        
        
        //console.log(responseJson)
        return []//responseJson;
       } catch(error) {
        console.error(error);
      }
      return []
}

async function getPainanidataRange(numberpages: number){
    var allbeacons: object=[]
    for (let i=0;i<numberpages;i++){
        let data=await getPainanidata(i)
        if(Symbol.iterator in Object(data))
            Array.prototype.push.apply(allbeacons,data);
    }
    console.log(allbeacons)
    localStorage.setItem('frames', JSON.stringify(allbeacons));
}

async function updatetimes(frames:Array<framesatnogs>) {
    let data=await getPainanidata(0)
        //Array.prototype.push.apply(frames,data);

    for(let x of data){
        if(!frames.includes(x)){
            frames.push(x)
        }
    }
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

export {getPainanidata,getListsofValues}