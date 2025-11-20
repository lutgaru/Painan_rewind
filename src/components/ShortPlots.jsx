import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,} from 'recharts';
import * as decoder from '../scripts/decoder.ts'
// import styles from '../styles/graphs.css'
import moment from 'moment';
import {getdatagraphsShort} from '../scripts/downloaders.ts'
import { useStore } from '@nanostores/react';
import { timeDataStore } from '../scripts/timeData.ts';

function ShortPlots(props) {

    const $timeDataStore = useStore(timeDataStore);
    const {range: storeRange} = $timeDataStore;
    
    const [listofvals, setlistofvals]=useState({})

    useEffect(() => {
        console.log('Store date changed:', storeRange);
        
        const fetchData = async () => {
            try {
                const data = await getdatagraphsShort(storeRange[0], storeRange[1]);
                setlistofvals(data);
                console.log('List of values:', data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        // Call the async function
        fetchData();

      },[storeRange]);
    
    
    return (
        <div>
        
        
        <main >

       
        <ResponsiveContainer width='20%' minHeight={200} >
            <AreaChart
            //className='Grafica'
            // width={100}
            // height={300}
            data={listofvals.tempshorts}
            margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
            }}
            >
            <CartesianGrid strokeDasharray="3 3" stroke="#fff" fill='#ffffff20'/>
            <XAxis dataKey="name" stroke="#fff"  
            tickFormatter = {(timestamp) => moment(timestamp).format('DD/MM/YY HH:mm')}
            domain={['auto', 'auto']}
            scale="time"
            type='number'
            />
            <YAxis stroke="#fff"/>
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="pat" stroke="#8884d8" />
            <Area type="monotone" dataKey="smpt" stroke="#82ca9d" />
            </AreaChart>
        </ResponsiveContainer>
        <ResponsiveContainer width='20%' minHeight={200} >
            <AreaChart
            //className='Grafica'
            // width={100}
            // height={300}
            data={listofvals.voltshors}
            margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
            }}
            >
            <CartesianGrid strokeDasharray="3 3" stroke="#fff" fill='#ffffff20'/>
            <XAxis dataKey="name" stroke="#fff"  
             tickFormatter = {(timestamp) => moment(timestamp).format('DD/MM/YY HH:mm')}
             domain={['auto', 'auto']}
             scale="time"
             type='number'/>
            <YAxis stroke="#fff"/>
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="v5v" stroke='#f78981' fill='#a54d4d' />
            <Area type="monotone" dataKey="v3v3" stroke="#70f170" fill='#4f9b38ff'  />
            
            </AreaChart>
        </ResponsiveContainer>
        <ResponsiveContainer width='20%' minHeight={200} >
            <AreaChart
            data={listofvals.currentshors}
            margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
            }}
            >
            <CartesianGrid strokeDasharray="3 3" stroke="#fff" fill='#ffffff20'/>
            <XAxis dataKey="name" stroke="#fff"  
             tickFormatter = {(timestamp) => moment(timestamp).format('DD/MM/YY HH:mm')}
             domain={['auto', 'auto']}
             scale="time"
             type='number'/>
            <YAxis stroke="#fff"/>
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="c3v3" stroke="#70f170" fill='#4f9b38ff' activeDot={{ r: 8 }} />
            <Area type="monotone" dataKey="c5v" stroke='#f78981' fill='#a54d4d' />
            
            </AreaChart>
        </ResponsiveContainer>
        </main>
        </div>
        
        
    );
  }

export default ShortPlots