import  { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,} from 'recharts';
import moment from 'moment';
import {getdatagraphsLong} from '../scripts/downloaders.ts'
import { useStore } from '@nanostores/react';
import { timeDataStore } from '../scripts/timeData.ts';

function LongPlots(props) {

    const $timeDataStore = useStore(timeDataStore);
    const {range: storeRange} = $timeDataStore;
    const [listofvals, setlistofvals]=useState({})
    //console.log(decoder.decoder_short_beacon('8A82A4A89040E0A6A082868A406103F0000003E6080850E903510006050C'))

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getdatagraphsLong(storeRange[0], storeRange[1]);
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
        <footer style={{display:'flex'}}>
        <ResponsiveContainer width='33%' minHeight={200} >
            <LineChart
            data={listofvals.gyrolarge}
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
            type='number' />
            <YAxis stroke="#fff" domain={[-300,300]}/>
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="gyrox" stroke="#d68165" strokeWidth={2}/>
            <Line type="monotone" dataKey="gyroy" stroke="#65D681" strokeWidth={2}/>
            <Line type="monotone" dataKey="gyroz" stroke="#8165D6" strokeWidth={2}/>
            </LineChart>
        </ResponsiveContainer>
        <ResponsiveContainer width='33%' minHeight={200} >
            <LineChart
            data={listofvals.chargecapacity}
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
            <Line type="monotone" dataKey="BankChar1" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="BankChar2" stroke="#82ca9d" strokeWidth={2}/>
            </LineChart>
        </ResponsiveContainer>
        <ResponsiveContainer width='33%' minHeight={200} >
            <LineChart
            data={listofvals.batvolts}
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
            <Line type="monotone" dataKey="BankVolt1" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="BankVolt2" stroke="#82ca9d" strokeWidth={2}/>
            </LineChart>
        </ResponsiveContainer>
        </footer>
        </div>
        
        
    );
  }

export default LongPlots