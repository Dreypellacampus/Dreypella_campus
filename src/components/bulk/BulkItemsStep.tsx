import { Plus, Trash2 } from 'lucide-react';
import FormField from '@/components/order/FormField';
import Button from '@/components/ui/Button';
import { BULK_ITEM_FIELDS } from '@/data/bulkFields';
import { MAX_BULK_ITEMS, type BulkItemDraft } from '@/lib/bulkOrder';
import type { FieldErrors } from '@/lib/validation';

type EditableItemField = 'name' | 'quantity' | 'specs';

interface BulkItemsStepProps {
  items: BulkItemDraft[];
  errors: FieldErrors;
  onAdd: () => void;
  onRemove: (key: string) => void;
  onChange: (key: string, name: EditableItemField, value: string) => void;
}

export default function BulkItemsStep({ items, errors, onAdd, onRemove, onChange }: BulkItemsStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-2xl bg-mist p-4 text-sm leading-relaxed text-navy-800">
        List every item or task you need. For printing, add the paper size, colour, sides and binding in the
        specifications. Prices appear only where we have confirmed them.
      </p>

      {errors.items && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {errors.items}
        </p>
      )}

      <ol className="flex flex-col gap-4">
        {items.map((item, index) => {
          const values: Record<EditableItemField, string> = {
            name: item.name,
            quantity: item.quantity,
            specs: item.specs,
          };
          return (
            <li key={item.key} className="flex flex-col gap-5 rounded-2xl border border-navy-100 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-extrabold text-navy-900">Item {index + 1}</p>
                <button
                  type="button"
                  onClick={() => onRemove(item.key)}
                  disabled={items.length === 1}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-navy-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove
                </button>
              </div>
              {BULK_ITEM_FIELDS.map((field) => {
                const name = field.name as EditableItemField;
                return (
                  <FormField
                    key={field.name}
                    field={field}
                    value={values[name]}
                    error={errors[`${item.key}.${field.name}`]}
                    onChange={(fieldName, value) => onChange(item.key, fieldName as EditableItemField, value)}
                  />
                );
              })}
            </li>
          );
        })}
      </ol>

      <Button
        variant="outline"
        onClick={onAdd}
        disabled={items.length >= MAX_BULK_ITEMS}
        className="w-full sm:w-auto"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add another item
      </Button>
    </div>
  );
}
