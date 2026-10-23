"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#23724c", "#dba934", "#1d5b3e", "#a66d1b", "#56ab7e", "#85511a"];

export function RegistrationsChart({
  data,
  label,
}: {
  data: Array<{ date: string; count: number }>;
  label: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcefe2" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, borderColor: "#b9dfc5", fontSize: 12 }}
            labelFormatter={(value) => `${label}: ${value}`}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#23724c"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBarChart({
  data,
  color = "#23724c",
  horizontal = false,
}: {
  data: Array<{ name: string; count: number }>;
  color?: string;
  horizontal?: boolean;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 12, left: horizontal ? 8 : -18, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#dcefe2" />
          {horizontal ? (
            <>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
            </>
          )}
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#b9dfc5", fontSize: 12 }} />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FunnelChart({
  data,
}: {
  data: Array<{ name: string; started: number; watched: number; completed: number }>;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcefe2" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#b9dfc5", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="started" fill="#dcefe2" radius={[3, 3, 0, 0]} />
          <Bar dataKey="watched" fill="#56ab7e" radius={[3, 3, 0, 0]} />
          <Bar dataKey="completed" fill="#1d5b3e" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SectionChart({ data }: { data: Array<{ name: string; count: number }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcefe2" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#b9dfc5", fontSize: 12 }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
