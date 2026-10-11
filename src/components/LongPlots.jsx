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
      style={{ padding: 16, borderRadius: 'var(--radius-m)', background: 'var(--secondary-grouped-card)', minWidth: 0, flex: '1 1 280px' }}
      aria-label={title}
    >
      <h4 className="sf-mono type-caption1" style={{ letterSpacing: '0.06em', color: 'var(--secondary-label)' }}>{title}</h4>
      {subtitle && <p className="type-footnote" style={{ color: 'var(--tertiary-label)', marginTop: 2 }}>{subtitle}</p>}
      <div style={{ marginTop: 8 }}>{children}</div>
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
    <div className="flex flex-col lg:flex-row" style={{ gap: 12 }}>
      <ChartCard title="GIRÓSCOPOS · X / Y / Z" subtitle="°/s · baliza larga">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={listofvals.gyrolarge} margin={{ top: 5, right: 4, left: -12, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={48} domain={[-300, 300]} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="gyrox" stroke="#ff9f0a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="gyroy" stroke="var(--system-green)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="gyroz" stroke="var(--system-blue)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="BATERÍAS · CAPACIDAD" subtitle="mAh · bancos 1 / 2">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={listofvals.chargecapacity} margin={{ top: 5, right: 4, left: -12, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={48} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="BankChar1" stroke="var(--system-blue)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="BankChar2" stroke="var(--system-green)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="BATERÍAS · VOLTAJE" subtitle="V · bancos 1 / 2">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={listofvals.batvolts} margin={{ top: 5, right: 4, left: -12, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--separator)" tick={tick} tickFormatter={fmt} domain={['auto', 'auto']} scale="time" type="number" tickCount={4} />
            <YAxis stroke="var(--separator)" tick={tick} width={48} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={fmt} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="BankVolt1" stroke="var(--system-blue)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="BankVolt2" stroke="var(--system-green)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export default LongPlots
