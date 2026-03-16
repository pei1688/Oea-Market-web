"use client";

import React from "react";
import { Textarea } from "../ui/textarea";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

interface FormTextareaProps {
  name: string;
  control: any;
  label?: string;
  placeholder?: string;
  description?: string;
  rows?: number;
}

const FormTextarea = ({
  name,
  control,
  label,
  placeholder,
  description,
  rows = 4,
}: FormTextareaProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Textarea
              {...field}
              placeholder={placeholder}
              rows={rows}
              className="h-[150px]"
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormTextarea;
