"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Controller, Control } from "react-hook-form";

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  name: string;
  control: Control<any>;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
  triggerClassName?: string;
  required?: boolean;
  disabled?: boolean;
}

export const FormSelect = ({
  name,
  control,
  label,
  placeholder,
  options,
  className = "",
  triggerClassName = "border w-full border-zinc-400",
  required = false,
  disabled = false,
}: FormSelectProps) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={`flex flex-col gap-2 ${className}`}>
          <Label
            htmlFor={name}
            className={
              required
                ? "after:ml-1 after:text-red-500 after:content-['*']"
                : ""
            }
          >
            {label}
          </Label>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={disabled}
          >
            <SelectTrigger className={triggerClassName} id={name}>
              <SelectValue placeholder={placeholder || label} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.error && (
            <span className="text-sm text-red-500">
              {fieldState.error.message}
            </span>
          )}
        </div>
      )}
    />
  );
};
