"use client";

import { Calendar, Edit, Trash2 } from "lucide-react";
import { Badge, Dropdown } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/hooks";

interface Customer {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  stage: string;
  probability: number;
  customer: Customer;
  expectedCloseDate?: string;
  createdAt: string;
}

const stages = [
  { value: "lead", label: "Lead", color: "bg-neutral-500" },
  { value: "qualified", label: "Qualified", color: "bg-blue-500" },
  { value: "proposal", label: "Proposal", color: "bg-amber-500" },
  { value: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { value: "closed-won", label: "Closed Won", color: "bg-emerald-500" },
  { value: "closed-lost", label: "Closed Lost", color: "bg-red-500" },
];

export function KanbanView({
  deals,
  onEdit,
  onDelete,
  onView,
}: {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
  onView: (deal: Deal) => void;
}) {
  const getDealsForStage = (stage: string) => deals.filter((d) => d.stage === stage);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageDeals = getDealsForStage(stage.value);
        const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

        return (
          <div key={stage.value} className="min-w-[280px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                <span className="text-sm font-medium text-neutral-900 dark:text-white">{stage.label}</span>
                <Badge variant="neutral" size="sm">{stageDeals.length}</Badge>
              </div>
              <span className="text-xs text-neutral-500">{formatCurrency(stageValue)}</span>
            </div>
            <div className="space-y-3">
              {stageDeals.map((deal, index) => (
                <div
                  key={deal.id}
                  className="bg-neutral-100 dark:bg-neutral-800/50 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/50 rounded-xl p-4 cursor-pointer transition-all hover:border-neutral-300 dark:hover:border-neutral-600 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => onView(deal)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-neutral-900 dark:text-white text-sm line-clamp-2">{deal.title}</h4>
                    <Dropdown
                      items={[
                        { label: "Edit", icon: <Edit className="w-4 h-4" />, onClick: () => onEdit(deal) },
                        { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => onDelete(deal.id), danger: true },
                      ]}
                    />
                  </div>
                  {deal.customer && (
                    <p className="text-xs text-neutral-500 mb-3">{deal.customer.name}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-400">
                      {formatCurrency(deal.value)}
                    </span>
                    <span className="text-xs text-neutral-500">{deal.probability}%</span>
                  </div>
                  {deal.expectedCloseDate && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(deal.expectedCloseDate)}
                    </div>
                  )}
                </div>
              ))}
              {stageDeals.length === 0 && (
                <div className="text-center py-8 text-neutral-600 text-sm">
                  No deals
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
