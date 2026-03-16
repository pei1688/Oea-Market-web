import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FilterSectionProps {
  title: string;
  items: string[];
  type: "categories" | "brands";
  selectedItems: string[];
  onFilterChange: (
    type: "categories" | "brands",
    value: string,
    checked: boolean,
  ) => void;
}

const FilterSection = ({
  title,
  items,
  type,
  selectedItems,
  onFilterChange,
}: FilterSectionProps) => (
  <div className="space-y-6">
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger className="ae-sub-section-title">
          {title}
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          {items.map((item) => (
            <Label
              key={item}
              className="flex cursor-pointer items-center space-x-2"
            >
              <Checkbox
                checked={selectedItems.includes(item)}
                onCheckedChange={(checked) =>
                  onFilterChange(type, item, !!checked)
                }
              />
              <p className="ae-body">{item}</p>
            </Label>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
);

export default FilterSection;
