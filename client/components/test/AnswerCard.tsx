import { Card as UICard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AnswerCard({
  label,
  selected,
  correct,
  wrong,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  correct?: boolean;
  wrong?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <UICard
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "p-4 cursor-pointer transition-all border",
        selected && "border-blue-500 bg-blue-50 dark:bg-blue-900",
        correct && "border-green-500 bg-green-50 dark:bg-green-900",
        wrong && "border-red-500 bg-red-50 dark:bg-red-900",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {label}
    </UICard>
  );
}
