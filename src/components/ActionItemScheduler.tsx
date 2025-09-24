import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Calendar, Clock } from 'lucide-react';
import { ActionItem } from '@/hooks/useAiActionGenerator';

interface ActionItemSchedulerProps {
  action: ActionItem;
  onSchedule: (actionId: string, schedule: {
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime?: string;
  }) => void;
  onCancel: () => void;
}

// 輔助函數：將日期和時間組合成 datetime-local 格式
const formatDateTime = (date?: string, time?: string): string => {
  if (!date) return '';
  const timeValue = time || '09:00';
  return `${date}T${timeValue}`;
};

// 輔助函數：從 datetime-local 格式提取日期和時間
const parseDateTime = (dateTime: string): { date: string; time: string } => {
  if (!dateTime) return { date: '', time: '' };
  const [date, time] = dateTime.split('T');
  return { date: date || '', time: time || '' };
};

export function ActionItemScheduler({ action, onSchedule, onCancel }: ActionItemSchedulerProps) {
  const [startDateTime, setStartDateTime] = useState(
    formatDateTime(action.startDate, action.startTime) || 
    formatDateTime(new Date().toISOString().split('T')[0], '09:00')
  );
  const [endDateTime, setEndDateTime] = useState(
    formatDateTime(action.endDate, action.endTime)
  );

  const handleSchedule = () => {
    const startParsed = parseDateTime(startDateTime);
    const endParsed = parseDateTime(endDateTime);
    
    onSchedule(action.id, {
      startDate: startParsed.date,
      endDate: endParsed.date || undefined,
      startTime: startParsed.time,
      endTime: endParsed.time || undefined
    });
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="font-medium">安排時程</span>
      </div>
      
      <div className="text-sm text-muted-foreground mb-3">
        {action.content}
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="startDateTime" className="text-xs">開始日期時間</Label>
          <DateTimePicker
            id="startDateTime"
            value={startDateTime}
            onValueChange={setStartDateTime}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="endDateTime" className="text-xs">結束日期時間 (可選)</Label>
          <DateTimePicker
            id="endDateTime"
            value={endDateTime}
            onValueChange={setEndDateTime}
            className="mt-1"
            placeholder="選擇結束時間..."
          />
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSchedule} className="flex-1" size="sm">
          <Clock className="w-3 h-3 mr-1" />
          確認安排
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1" size="sm">
          取消
        </Button>
      </div>
    </div>
  );
}