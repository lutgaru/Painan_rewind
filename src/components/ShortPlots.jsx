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
      style={{ padding: 16, marginBottom: 12, borderRadius: 'var(--radius-m)', background: 'var(--secondary-grouped-card)' }}
      aria-label={title}
    >
      <h4 className="sf-mono type-caption1" style={{ letterSpacing: '0.06em', color: 'var(--secondary-label)' }}>{title}</h4>
      {subtitle && <p className="type-footnote" style={{ color: 'var(--tertiary-label)', marginTop: 2 }}>{subtitle}</p>}
      <div style={{ marginTop: 8 }}>{children}</div>
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
    <div>
      <ChartCard title="TEMPERATURAS · PAT / SMPST" subtitle="°C · baliza corta">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={listofvals.tempshorts} margin={{ top: 5, right: 4, left: -12, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={48} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="pat" stroke="var(--system-blue)" fill="var(--system-blue)" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="smpt" stroke="var(--system-green)" fill="var(--system-green)" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="VOLTAJES · V5V / V3V3" subtitle="V · baliza corta">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={listofvals.voltshors} margin={{ top: 5, right: 4, left: -12, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={48} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="v5v" stroke="#ff9f0a" fill="#ff9f0a" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="v3v3" stroke="var(--system-green)" fill="var(--system-green)" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="CORRIENTES · C3V3 / C5V" subtitle="mA · baliza corta">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={listofvals.currentshors} margin={{ top: 5, right: 4, left: -12, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={48} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="c3v3" stroke="var(--system-green)" fill="var(--system-green)" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="c5v" stroke="var(--system-red)" fill="var(--system-red)" fillOpacity={0.18} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export default ShortPlots
