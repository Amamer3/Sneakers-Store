import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AlertThreshold } from '@/types/system-extended';

interface ThresholdConfigProps {
  thresholds: AlertThreshold[];
  onThresholdChange: (threshold: AlertThreshold) => void;
  onThresholdDelete: (id: string) => void;
  onThresholdAdd: (threshold: Omit<AlertThreshold, 'id'>) => void;
}

const ThresholdConfig: React.FC<ThresholdConfigProps> = ({
  thresholds,
  onThresholdChange,
  onThresholdDelete,
  onThresholdAdd,
}) => {
  const metricOptions = [
    'cpu.usage',
    'memory.usagePercent',
    'requests.activeConnections',
    'database.queryLatency',
    'cache.hitRate',
    'errors.rate'
  ];

  const conditions = [
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'eq', label: '=' },
    { value: 'gte', label: '>=' },
    { value: 'lte', label: '<=' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Thresholds</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {thresholds.map((threshold) => (
            <div
              key={threshold.id}
              className="grid grid-cols-6 gap-4 items-center p-4 border rounded-lg"
            >
              <Input
                className="col-span-2"
                value={threshold.name}
                onChange={(e) =>
                  onThresholdChange({ ...threshold, name: e.target.value })
                }
                placeholder="Alert name"
              />
              <select
                className="col-span-1"
                value={threshold.metric}
                onChange={(e) =>
                  onThresholdChange({ ...threshold, metric: e.target.value })
                }
              >
                {metricOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="col-span-1"
                value={threshold.condition}
                onChange={(e) =>
                  onThresholdChange({
                    ...threshold,
                    condition: e.target.value as AlertThreshold['condition'],
                  })
                }
              >
                {conditions.map((condition) => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                className="col-span-1"
                value={threshold.value}
                onChange={(e) =>
                  onThresholdChange({
                    ...threshold,
                    value: parseFloat(e.target.value),
                  })
                }
              />
              <div className="flex items-center space-x-4">
                <Switch
                  checked={threshold.enabled}
                  onCheckedChange={(checked) =>
                    onThresholdChange({ ...threshold, enabled: checked })
                  }
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onThresholdDelete(threshold.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          <Button
            onClick={() =>
              onThresholdAdd({
                name: '',
                metric: metricOptions[0],
                condition: 'gt',
                value: 0,
                severity: 'medium',
                enabled: true,
                notifyChannels: ['email'],
              })
            }
          >
            Add Threshold
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThresholdConfig;
