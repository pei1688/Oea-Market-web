"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Control, FieldValues, Path } from "react-hook-form";

interface FormInputProps<T extends FieldValues> {
  label?: string;
  name: Path<T>;
  placeholder?: string;
  control: Control<T>;
  inputClass?: string;
  type?: string;
  disabled?: boolean;
  Required?: boolean;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FormInput = <T extends FieldValues>({
  label,
  name,
  placeholder,
  control,
  inputClass,
  type,
  disabled,
  Required,
  onChange,
  defaultValue,
}: FormInputProps<T>) => {
  return (
    <FormField
      control={control}
      defaultValue={defaultValue as any}
      name={name}
      render={({ field }) => (
        <FormItem className={` ${inputClass}`}>
          {label && (
            <FormLabel>
              {Required && <span className="text-rose-500">*</span>}
              {label}
            </FormLabel>
          )}
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              name={field.name}
              value={field.value ?? ""}
              onChange={(e) => {
                field.onChange(e);
                onChange?.(e);
              }}
              onBlur={field.onBlur}
              ref={field.ref}
              disabled={disabled}
              className="rounded-md border border-zinc-400"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormInput;
