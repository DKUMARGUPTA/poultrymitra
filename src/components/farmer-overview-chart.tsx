
"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useAuth } from "@/hooks/use-auth"
import { getBatchesByFarmer, Batch } from "@/services/batches.service"
import { getDailyEntriesForBatch, DailyEntry } from "@/services/daily-entries.service"
import { Skeleton } from "./ui/skeleton"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type ChartData = {
  name: string
  mortalityRate: number
  fcr: number
  avgWeight: number
}

const chartConfig = {
  mortalityRate: {
    label: "Mortality (%)",
    color: "hsl(var(--chart-1))",
  },
  fcr: {
    label: "FCR",
    color: "hsl(var(--chart-2))",
  },
  avgWeight: {
    label: "Avg. Weight (kg)",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function FarmerOverviewChart() {
  const { user } = useAuth()
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    setLoading(true)
    const unsubscribeBatches = getBatchesByFarmer(user.uid, async (batches) => {
      const dataPromises = batches.map(async (batch) => {
        return new Promise<ChartData>((resolve) => {
          const unsubscribeEntries = getDailyEntriesForBatch(batch.id, (entries) => {
            unsubscribeEntries() // We only need the final state of entries for this chart

            const totalMortality = entries.reduce((sum, entry) => sum + entry.mortality, 0)
            const totalFeedConsumed = entries.reduce((sum, entry) => sum + entry.feedConsumedInKg, 0)
            const finalBirdCount = batch.initialBirdCount - totalMortality
            const mortalityRate = (totalMortality / batch.initialBirdCount) * 100

            const lastEntry = entries[0] // Entries are sorted by date desc
            const finalAvgWeightInGrams = lastEntry ? lastEntry.averageWeightInGrams : 0
            const finalAvgWeightInKg = finalAvgWeightInGrams / 1000

            const totalWeightGain = finalBirdCount * finalAvgWeightInKg
            const fcr = totalWeightGain > 0 ? totalFeedConsumed / totalWeightGain : 0

            resolve({
              name: batch.name,
              mortalityRate: parseFloat(mortalityRate.toFixed(2)),
              fcr: parseFloat(fcr.toFixed(2)),
              avgWeight: parseFloat(finalAvgWeightInKg.toFixed(2)),
            })
          })
        })
      })

      const allChartData = await Promise.all(dataPromises)
      // Sort by batch start date if possible, otherwise by name as fallback
      setChartData(allChartData.reverse().slice(-5)) // Show last 5 batches
      setLoading(false)
    })

    return () => unsubscribeBatches()
  }, [user])

  if (loading) {
    return <Skeleton className="w-full h-[350px]" />
  }
  
  if (chartData.length === 0) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-muted-foreground">Not enough data to display chart.</p>
        <p className="text-sm text-muted-foreground">Complete a batch to see performance metrics.</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
        <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    className="text-xs"
                />
                <YAxis yAxisId="left" stroke="hsl(var(--chart-1))" orientation="left" />
                <YAxis yAxisId="right" stroke="hsl(var(--chart-2))" orientation="right" />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="mortalityRate" name="Mortality (%)" yAxisId="left" fill="hsl(var(--chart-1))" radius={4} />
                <Bar dataKey="fcr" name="FCR" yAxisId="right" fill="hsl(var(--chart-2))" radius={4} />
            </BarChart>
        </ResponsiveContainer>
    </ChartContainer>

  )
}
