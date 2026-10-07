'use client';

import { FieldPalette } from './FieldPalette';
import { BuilderCanvas } from './BuilderCanvas';
import { FieldPropertiesPanel } from './FieldPropertiesPanel';

export function FormBuilder() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-3">
        <FieldPalette />
      </div>
      <div className="lg:col-span-6">
        <BuilderCanvas />
      </div>
      <div className="lg:col-span-3">
        <FieldPropertiesPanel />
      </div>
    </div>
  );
}
