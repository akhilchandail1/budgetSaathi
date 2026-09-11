"use client";

import { Plus, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceActionsList } from "./FinanceActionsList";
import { GoalCard } from "./GoalCard";
import { GoalForm } from "./GoalForm";
import { formatINR } from "@/lib/format";
import { isActionOverdue, type FinanceAction } from "@/lib/financeActions";
import { goalRemaining, sortGoals, type FinancialGoal } from "@/lib/goals";

export function ActionsClient({ actions, goals }: { actions: FinanceAction[]; goals: FinancialGoal[] }) {
  const openActions = actions.filter((a) => !a.completed).length;
  const overdueActions = actions.filter(isActionOverdue).length;
  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const totalRemaining = activeGoals.reduce((sum, g) => sum + goalRemaining(g), 0);
  const sortedGoals = sortGoals(goals);

  const kpis = [
    { label: "Open Actions", value: String(openActions), tone: "neutral" as const },
    { label: "Overdue Actions", value: String(overdueActions), tone: "danger" as const },
    { label: "Active Goals", value: String(activeGoals.length), tone: "invest" as const },
    { label: "Remaining to Save", value: formatINR(totalRemaining), tone: "success" as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Finance Actions & Goals</h1>
        <p className="text-sm text-zinc-500">Track to-dos and savings goals in one place.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardTitle>{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p
                className={`text-xl font-semibold tabular-nums sm:text-2xl ${
                  kpi.tone === "danger"
                    ? "text-red-600"
                    : kpi.tone === "success"
                      ? "text-emerald-600"
                      : kpi.tone === "invest"
                        ? "text-indigo-600"
                        : "text-zinc-900"
                }`}
              >
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">To-Dos</TabsTrigger>
          <TabsTrigger value="goals" data-demo-allow>
            Goals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-4">
          <FinanceActionsList items={actions} />
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <GoalForm
                trigger={
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> New Goal
                  </Button>
                }
              />
            </div>
            {sortedGoals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                  <Target className="h-8 w-8 text-zinc-300" />
                  <p className="text-sm text-zinc-400">No financial goals yet. Create one to start saving toward it.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {sortedGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            )}
            {completedGoals.length > 0 && (
              <p className="text-center text-xs text-zinc-400">{completedGoals.length} goal(s) completed</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
