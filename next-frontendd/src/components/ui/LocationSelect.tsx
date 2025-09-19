import { useId } from "react"
import { cn } from "@/lib/utils" 

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LocationSelectProps {
  onSelect?: (value: string) => void
  className?: string
  label?: string
  placeholder?: string
}

export default function LocationSelect({
  onSelect,
  className,
  label,
  placeholder,
}: LocationSelectProps) {
  const id = useId()

  return (
    <div className={cn("space-y-1 w-full", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select
        onValueChange={(value) => {
          if (onSelect) {
            onSelect(value)
          }
        }}
      >
        <SelectTrigger
          id={id}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm 
                     focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
                     disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background">
          <SelectItem value="bengaluru">Bengaluru</SelectItem>
          <SelectItem value="hyderabad">Hyderabad</SelectItem>
          <SelectItem value="pune">Pune</SelectItem>
          <SelectItem value="delhi">Delhi</SelectItem>
          <SelectItem value="mumbai">Mumbai</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
