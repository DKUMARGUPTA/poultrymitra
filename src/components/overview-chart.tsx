
"use client"

import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip, Legend } from "recharts"

interface OverviewChartProps {
  data: { name: string; revenue: number; cogs: number }[];
}

export function OverviewChart({ data }: OverviewChartProps) {
  const chartData = data.map(item => ({
    ...item,
    profit: item.revenue - item.cogs,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value / 1000}k`}
        />
        <Tooltip
          formatter={(value, name) => {
            const formattedValue = `₹${Number(value).toLocaleString()}`;
            if (name === 'revenue') return [formattedValue, 'Revenue'];
            if (name === 'cogs') return [formattedValue, 'Cost of Goods Sold'];
            if (name === 'profit') return [formattedValue, 'Profit'];
            return [formattedValue, name];
          }}
          cursor={{ fill: 'hsl(var(--muted))' }}
          contentStyle={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
        />
        <Legend />
        <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="profit" name="Profit" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
