import React, { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import moment from 'moment';
import { getdatagraphsShort } from '../scripts/downloaders.ts'
import { useStore } from '@nanostores/react';
import { timeDataStore } from '../scripts/timeData.ts';

const tick = { fill: 'var(--tertiary-label)', fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
const tooltipStyle = {
  backgroundColor: 'var(--grouped-card)',
  border: '0.5px solid var(--separator)',
  borderRadius: 12,
  color: 'var(--label)',
  fontSize: 12,
  boxShadow: 'var(--shadow-2)',
};

function ChartCard({ title, subtitle, children }) {
  return (
    <section
      className="apple-card"
      style={{
        display: 'flex', flexDirection: 'column',
        minWidth: 0, minHeight: 0,
        padding: '10px 12px', borderRadius: 'var(--radius-m)',
        background: 'var(--secondary-grouped-card)',
      }}
      aria-label={title}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
        <h4 className="sf-mono type-caption1" style={{ letterSpacing: '0.05em', color: 'var(--secondary-label)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h4>
        {subtitle && <span className="type-caption2" style={{ color: 'var(--tertiary-label)', whiteSpace: 'nowrap' }}>{subtitle}</span>}
      </header>
      <div style={{ flex: '1 1 auto', minHeight: 150, minWidth: 0 }}>{children}</div>
    </section>
  );
}

function ShortPlots(props) {
  const $timeDataStore = useStore(timeDataStore);
  const { range: storeRange } = $timeDataStore;
  const [listofvals, setlistofvals] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getdatagraphsShort(storeRange[0], storeRange[1]);
        setlistofvals(data);
      } catch (error) { console.error('Error fetching data:', error); }
    };
    fetchData();
  }, [storeRange]);

  const fmt = (t) => moment(t).format('DD/MM/YY HH:mm');

  return (
    <div style={{ display: 'contents' }}>
      <ChartCard title="TEMPERATURAS · PAT / SMPST" subtitle="°C · baliza corta">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={listofvals.tempshorts} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={44} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 0 }} iconSize={8} />
            <Area type="monotone" dataKey="pat" stroke="var(--system-blue)" fill="var(--system-blue)" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="smpt" stroke="var(--system-green)" fill="var(--system-green)" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="VOLTAJES · V5V / V3V3" subtitle="V · baliza corta">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={listofvals.voltshors} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={44} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 0 }} iconSize={8} />
            <Area type="monotone" dataKey="v5v" stroke="#ff9f0a" fill="#ff9f0a" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="v3v3" stroke="var(--system-green)" fill="var(--system-green)" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="CORRIENTES · C3V3 / C5V" subtitle="mA · baliza corta">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={listofvals.currentshors} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={44} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 0 }} iconSize={8} />
            <Area type="monotone" dataKey="c3v3" stroke="var(--system-green)" fill="var(--system-green)" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="c5v" stroke="var(--system-red)" fill="var(--system-red)" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export default ShortPlots
