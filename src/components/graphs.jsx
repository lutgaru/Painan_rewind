import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,} from 'recharts';
import * as decoder from '../scripts/decoder.ts'
// import styles from '../styles/graphs.css'
import moment from 'moment';
import {getdatagraphs} from '../scripts/downloaders.ts'

function Graphs(props) {
    
    const [listofvals, setlistofvals]=useState({})
    //console.log(decoder.decoder_short_beacon('8A82A4A89040E0A6A082868A406103F0000003E6080850E903510006050C'))

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getdatagraphs();
                setlistofvals(data);
                console.log('List of values:', data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        // Call the async function
        fetchData();

        return () => {
            // Cleanup code if needed
        };
        //console.log('Decoded data:', decoded);
      },[]);
    
    
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

export default Graphs