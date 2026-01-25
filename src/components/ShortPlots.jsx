import React, { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, } from 'recharts';
import moment from 'moment';
import { getdatagraphsShort } from '../scripts/downloaders.ts'
import { useStore } from '@nanostores/react';
import { timeDataStore } from '../scripts/timeData.ts';

function ShortPlots(props) {

    const $timeDataStore = useStore(timeDataStore);
    const { range: storeRange } = $timeDataStore;

    const [listofvals, setlistofvals] = useState({})

    useEffect(() => {
        console.log('Store date changed:', storeRange);

        const fetchData = async () => {
            try {
                const data = await getdatagraphsShort(storeRange[0], storeRange[1]);
                setlistofvals(data);
                // console.log('List of values:', data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        // Call the async function
        fetchData();

    }, [storeRange]);

    return (
        <div>
            <main class=" p-4">
                <AreaChart
                    style={{ width: '100%', maxWidth: '500px', height: '100%', maxHeight: '20vh', aspectRatio: 1.618 }}
                    responsive
                    data={listofvals.tempshorts}
                    margin={{
                        top: 5,
                        right: 0,
                        left: 0,
                        bottom: 5,
                    }}
                >
                    {/* <CartesianGrid strokeDasharray="4 3" stroke="#fff" fill='#ffffff20' /> */}
                    <CartesianGrid strokeDasharray="1 0" stroke="#ffffff2f" fill='#7e7e7e20' vertical={true} horizontal={true} />
                    <XAxis dataKey="name" stroke="#fff"
                        tickFormatter={(timestamp) => moment(timestamp).format('DD/MM/YY HH:mm')}
                        domain={['auto', 'auto']}
                        scale="time"
                        type='number'
                    />
                    <YAxis stroke="#fff" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="pat" stroke="#8884d8" />
                    <Area type="monotone" dataKey="smpt" stroke="#82ca9d" />
                </AreaChart>
                <AreaChart
                    style={{ width: '100%', maxWidth: '500px', height: '100%', maxHeight: '20vh', aspectRatio: 1.618 }}
                    responsive
                    data={listofvals.voltshors}
                    margin={{
                        top: 5,
                        right: 0,
                        left: 0,
                        bottom: 5,
                    }}
                >
                    {/* <CartesianGrid strokeDasharray="3 3" stroke="#fff" fill='#ffffff20' /> */}
                    <CartesianGrid strokeDasharray="1 0" stroke="#ffffff2f" fill='#7e7e7e20' vertical={true} horizontal={true} />
                    <XAxis dataKey="name" stroke="#fff"
                        tickFormatter={(timestamp) => moment(timestamp).format('DD/MM/YY HH:mm')}
                        domain={['auto', 'auto']}
                        scale="time"
                        type='number' />
                    <YAxis stroke="#fff" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="v5v" stroke='#f78981' fill='#a54d4d' />
                    <Area type="monotone" dataKey="v3v3" stroke="#70f170" fill='#4f9b38ff' />

                </AreaChart>
                <AreaChart
                    style={{ width: '100%', maxWidth: '500px', height: '100%', maxHeight: '20vh', aspectRatio: 1.618 }}
                    responsive
                    data={listofvals.currentshors}
                    margin={{
                        top: 5,
                        right: 0,
                        left: 0,
                        bottom: 5,
                    }}
                >
                    {/* <CartesianGrid strokeDasharray="3 3" stroke="#fff" fill='#ffffff20' /> */}
                    <CartesianGrid strokeDasharray="1 0" stroke="#ffffff2f" fill='#7e7e7e20' vertical={true} horizontal={true} />
                    <XAxis dataKey="name" stroke="#fff"
                        tickFormatter={(timestamp) => moment(timestamp).format('DD/MM/YY HH:mm')}
                        domain={['auto', 'auto']}
                        scale="time"
                        type='number' />
                    <YAxis stroke="#fff" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="c3v3" stroke="#70f170" fill='#4f9b38ff' activeDot={{ r: 8 }} />
                    <Area type="monotone" dataKey="c5v" stroke='#f78981' fill='#a54d4d' />

                </AreaChart>
            </main>
        </div>


    );
}

export default ShortPlots