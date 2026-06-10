"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LegacyAuthReportsData } from "@/lib/actions/legacy-auth-reports";
import {
  BarChart3,
  CalendarDays,
  Database,
  LineChart as LineChartIcon,
  Search,
  UserCog,
  UsersRound,
} from "lucide-react";

type LegacyAuthReportsClientProps = {
  data: LegacyAuthReportsData;
  error?: string | null;
};

type SeriesKey = "newUsers" | LegacyAuthReportsData["providers"][number]["key"];

function groupTitle(data: LegacyAuthReportsData) {
  const group = data.groups.find((item) => item.key === data.selectedGroupKey);
  return group ? `${group.sourceDatabase} / ${group.label}` : "No legacy source";
}

export function LegacyAuthReportsClient({
  data,
  error,
}: LegacyAuthReportsClientProps) {
  const seriesChoices = useMemo(
    () => [
      { key: "newUsers" as const, label: "New users", color: "#0B9178" },
      ...data.providers.map((provider) => ({
        key: provider.key,
        label: `${provider.label} users`,
        color: provider.color,
      })),
    ],
    [data.providers],
  );
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(
    () => Object.fromEntries(seriesChoices.map((choice) => [choice.key, true])),
  );

  const topUserChartData = data.topUsers.map((user) => ({
    username: user.username,
    logins: user.loginCount,
  }));

  function isSeriesVisible(key: SeriesKey) {
    return visibleSeries[key] ?? true;
  }

  function toggleSeries(key: SeriesKey, checked: boolean) {
    setVisibleSeries((current) => ({ ...current, [key]: checked }));
  }

  return (
    <>
      <PageHeader
        title="Legacy Reports"
        description="Registered users, social sign-ins, and login frequency from the legacy PHP login admin"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Legacy Users", href: "/settings/legacy-users" },
          { label: "Reports" },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/settings/legacy-users">
              <UserCog className="size-4" />
              Users
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        {error ? (
          <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <form className="rounded-sm border border-border bg-background p-3">
          <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto] md:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="legacy-report-group">Source</Label>
              <div className="relative">
                <Database className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="legacy-report-group"
                  name="group"
                  defaultValue={data.selectedGroupKey ?? ""}
                  className="h-10 w-full rounded-sm border border-input bg-background pl-9 pr-3 text-sm"
                >
                  {data.groups.length === 0 ? (
                    <option value="">No migrated login sources</option>
                  ) : null}
                  {data.groups.map((group) => (
                    <option key={group.key} value={group.key}>
                      {group.sourceDatabase} / {group.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="legacy-report-start">From</Label>
              <Input
                id="legacy-report-start"
                name="startDate"
                type="date"
                defaultValue={data.startDate}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="legacy-report-end">To</Label>
              <Input
                id="legacy-report-end"
                name="endDate"
                type="date"
                defaultValue={data.endDate}
              />
            </div>

            <Button type="submit">
              <Search className="size-4" />
              Submit
            </Button>
          </div>
        </form>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <UsersRound className="size-4" />
              Total
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {data.totals.registered}
            </p>
            <p className="text-xs text-muted-foreground">Registered</p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <CalendarDays className="size-4" />
              Range
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {data.totals.rangeRegistered}
            </p>
            <p className="text-xs text-muted-foreground">Registered</p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <BarChart3 className="size-4" />
              Logins
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {data.totals.loginEvents}
            </p>
            <p className="text-xs text-muted-foreground">Timestamp rows</p>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <Database className="size-4" />
              Viewing
            </div>
            <p className="mt-2 truncate text-sm font-semibold">
              {groupTitle(data)}
            </p>
            <p className="text-xs text-muted-foreground">Legacy source</p>
          </div>
        </div>

        {data.providers.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.providers.map((provider) => (
              <div
                key={provider.key}
                className="rounded-sm border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: provider.color }}
                    />
                    {provider.label}
                  </div>
                  <Badge variant="outline">{provider.range} range</Badge>
                </div>
                <p className="mt-2 text-2xl font-semibold">{provider.total}</p>
                <p className="text-xs text-muted-foreground">Total users</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="rounded-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <LineChartIcon className="size-4" />
                Registered Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm border border-border bg-muted/30 px-3 py-2">
                {seriesChoices.map((choice) => (
                  <label
                    key={choice.key}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={isSeriesVisible(choice.key)}
                      onCheckedChange={(checked) =>
                        toggleSeries(choice.key, checked === true)
                      }
                      aria-label={`Toggle ${choice.label}`}
                    />
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: choice.color }}
                    />
                    <span>{choice.label}</span>
                  </label>
                ))}
                <span className="ml-auto text-xs text-muted-foreground">
                  Tip: Hover over the points on the graph.
                </span>
              </div>

              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series}>
                    <CartesianGrid stroke="#E7E5E4" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#78716C" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#78716C" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #E7E5E4",
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    />
                    <Legend verticalAlign="top" height={32} />
                    {isSeriesVisible("newUsers") ? (
                      <Line
                        type="monotone"
                        dataKey="newUsers"
                        name="New users"
                        stroke="#0B9178"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    ) : null}
                    {data.providers
                      .filter((provider) => isSeriesVisible(provider.key))
                      .map((provider) => (
                        <Line
                          key={provider.key}
                          type="monotone"
                          dataKey={provider.key}
                          name={`${provider.label} users`}
                          stroke={provider.color}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="size-4" />
                  Most Frequent Users
                </CardTitle>
                <Badge variant="outline">Top 10</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topUserChartData}>
                    <CartesianGrid stroke="#E7E5E4" vertical={false} />
                    <XAxis
                      dataKey="username"
                      tick={{ fontSize: 11, fill: "#78716C" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#78716C" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #E7E5E4",
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    />
                    <Bar dataKey="logins" name="Logins" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-hidden rounded-sm border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead className="w-24 text-right">Logins</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No login timestamps found.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {data.topUsers.map((user) => (
                      <TableRow key={`${user.legacyUserId}:${user.username}`}>
                        <TableCell className="font-medium">
                          {user.username}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {user.loginCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
