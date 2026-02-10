"use client";

import { useState } from "react";
import { Calendar, Edit, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

function DealCard({
  deal,
  onEdit,
  onDelete,
  onView,
  isDragging,
}: {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
  onView: (deal: Deal) => void;
  isDragging?: boolean;
}) {
  return (
    <div
      className={`bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/50 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all hover:border-neutral-300 dark:hover:border-neutral-600 ${
        isDragging ? "shadow-2xl ring-2 ring-blue-500/50 opacity-90 rotate-2 scale-105" : "shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <GripVertical className="w-4 h-4 text-neutral-400 shrink-0" />
          <h4
            className="font-medium text-neutral-900 dark:text-white text-sm line-clamp-2 cursor-pointer hover:text-blue-600"
            onClick={(e) => { e.stopPropagation(); onView(deal); }}
          >
            {deal.title}
          </h4>
        </div>
        <Dropdown
          items={[
            { label: "Edit", icon: <Edit className="w-4 h-4" />, onClick: () => onEdit(deal) },
            { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => onDelete(deal.id), danger: true },
          ]}
        />
      </div>
      {deal.customer && (
        <p className="text-xs text-neutral-500 mb-3 ml-6">{deal.customer.name}</p>
      )}
      <div className="flex items-center justify-between ml-6">
        <span className="text-sm font-semibold text-emerald-500 dark:text-emerald-400">
          {formatCurrency(deal.value)}
        </span>
        <span className="text-xs text-neutral-500">{deal.probability}%</span>
      </div>
      {deal.expectedCloseDate && (
        <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500 ml-6">
          <Calendar className="w-3 h-3" />
          {formatDate(deal.expectedCloseDate)}
        </div>
      )}
    </div>
  );
}

function SortableDealCard({
  deal,
  onEdit,
  onDelete,
  onView,
}: {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
  onView: (deal: Deal) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { deal, type: "deal" } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} onEdit={onEdit} onDelete={onDelete} onView={onView} />
    </div>
  );
}

function StageColumn({
  stage,
  deals,
  onEdit,
  onDelete,
  onView,
  isOver,
}: {
  stage: { value: string; label: string; color: string };
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
  onView: (deal: Deal) => void;
  isOver: boolean;
}) {
  const stageValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="min-w-[280px] flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
            {stage.label}
          </span>
          <Badge variant="neutral" size="sm">{deals.length}</Badge>
        </div>
        <span className="text-xs font-medium text-neutral-500">
          {formatCurrency(stageValue)}
        </span>
      </div>
      <div
        className={`flex-1 space-y-3 p-2 rounded-xl min-h-[200px] transition-colors duration-200 ${
          isOver
            ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400"
            : "bg-neutral-50 dark:bg-neutral-900/30 border-2 border-transparent"
        }`}
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <SortableDealCard
              key={deal.id}
              deal={deal}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </SortableContext>
        {deals.length === 0 && !isOver && (
          <div className="text-center py-12 text-neutral-400 text-sm">
            Drop deals here
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanView({
  deals,
  onEdit,
  onDelete,
  onView,
  onStageChange,
}: {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (id: string) => void;
  onView: (deal: Deal) => void;
  onStageChange?: (dealId: string, newStage: string) => void;
}) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getDealsForStage = (stage: string) =>
    deals.filter((d) => d.stage === stage);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    if (deal) setActiveDeal(deal);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverStage(null);
      return;
    }
    // Determine which stage column we're over
    const overData = over.data?.current;
    if (overData?.deal) {
      setOverStage(overData.deal.stage);
    } else {
      // Over a droppable column
      const stageValue = stages.find((s) => s.value === over.id)?.value;
      if (stageValue) setOverStage(stageValue);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    setOverStage(null);

    if (!over) return;

    const draggedDeal = deals.find((d) => d.id === active.id);
    if (!draggedDeal) return;

    // Determine target stage
    let targetStage: string | null = null;
    const overData = over.data?.current;
    if (overData?.deal) {
      targetStage = overData.deal.stage;
    } else {
      const stageValue = stages.find((s) => s.value === over.id)?.value;
      if (stageValue) targetStage = stageValue;
    }

    if (targetStage && targetStage !== draggedDeal.stage) {
      onStageChange?.(draggedDeal.id, targetStage);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <StageColumn
            key={stage.value}
            stage={stage}
            deals={getDealsForStage(stage.value)}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            isOver={overStage === stage.value}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && (
          <DealCard
            deal={activeDeal}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
