import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock } from "lucide-react"

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  placeholder?: string
  className?: string
}

export function TimePicker({ value, onChange, placeholder = "選擇時間", className }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedHour, setSelectedHour] = React.useState(value ? value.split(':')[0] : '09')
  const [selectedMinute, setSelectedMinute] = React.useState(value ? value.split(':')[1] : '00')

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':')
      setSelectedHour(hour)
      setSelectedMinute(minute)
    }
  }, [value])

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 4 }, (_, i) => (i * 15).toString().padStart(2, '0'))

  const handleTimeChange = (hour: string, minute: string) => {
    const time = `${hour}:${minute}`
    onChange(time)
  }

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour)
    handleTimeChange(hour, selectedMinute)
  }

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute)
    handleTimeChange(selectedHour, minute)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {value || placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <div className="flex flex-col sm:flex-row gap-2 p-4 min-w-[280px] sm:min-w-[320px]">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-center block">時</label>
            <Select value={selectedHour} onValueChange={handleHourChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-center block">分</label>
            <Select value={selectedMinute} onValueChange={handleMinuteChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {minutes.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 pt-0 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsOpen(false)}
          >
            取消
          </Button>
          <Button 
            size="sm" 
            onClick={() => {
              handleTimeChange(selectedHour, selectedMinute)
              setIsOpen(false)
            }}
          >
            確認
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}