import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import { getdatagraphsLong } from '../scripts/downloaders.ts'
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

function LongPlots(props) {
  const $timeDataStore = useStore(timeDataStore);
  const { range: storeRange } = $timeDataStore;
  const [listofvals, setlistofvals] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getdatagraphsLong(storeRange[0], storeRange[1]);
        setlistofvals(data);
      } catch (error) { console.error('Error fetching data:', error); }
    };
    fetchData();
  }, [storeRange]);

  const fmt = (t) => moment(t).format('DD/MM/YY HH:mm');

  return (
    <div style={{ display: 'contents' }}>
      <ChartCard title="GIRÓSCOPOS · X / Y / Z" subtitle="°/s · baliza larga">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={listofvals.gyrolarge} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={44} domain={[-300, 300]} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 0 }} iconSize={8} />
            <Line type="monotone" dataKey="gyrox" stroke="#ff9f0a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="gyroy" stroke="var(--system-green)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="gyroz" stroke="var(--system-blue)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="BATERÍAS · CAPACIDAD" subtitle="mAh · bancos 1 / 2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={listofvals.chargecapacity} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={44} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 0 }} iconSize={8} />
            <Line type="monotone" dataKey="BankChar1" stroke="var(--system-blue)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="BankChar2" stroke="var(--system-green)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="BATERÍAS · VOLTAJE" subtitle="V · bancos 1 / 2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={listofvals.batvolts} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={44} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 0 }} iconSize={8} />
            <Line type="monotone" dataKey="BankVolt1" stroke="var(--system-blue)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="BankVolt2" stroke="var(--system-green)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export default LongPlots
