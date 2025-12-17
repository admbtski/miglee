import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import {
  getCapacityStatusConfig,
  type CapacityDetailResult,
} from '@/features/events';

type CapacityStatusCardProps = {
  capacityDetails: CapacityDetailResult;
};

/**
 * Reusable component to display capacity status with appropriate icon and styling
 */
export function CapacityStatusCard({
  capacityDetails,
}: CapacityStatusCardProps) {
  const statusConfig = getCapacityStatusConfig(capacityDetails.statusVariant);

  // Map icon names to actual icon components
  const iconMap = {
    AlertTriangle,
    CheckCircle,
    Info,
  };
  const StatusIcon = iconMap[statusConfig.icon];

  return (
    <div className={`rounded-xl border p-4 ${statusConfig.colorClasses}`}>
      <div className="flex items-start gap-3">
        <StatusIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          {capacityDetails.minThreshold && (
            <p className="text-sm font-semibold">
              Minimalny próg: {capacityDetails.minThreshold}
            </p>
          )}
          <p className="text-sm">{capacityDetails.status}</p>
        </div>
      </div>
    </div>
  );
}
