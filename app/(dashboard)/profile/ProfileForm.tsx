'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateBusinessName } from './actions';

interface ProfileFormProps {
  businessName: string;
  email: string;
}

export function ProfileForm({ businessName, email }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(businessName);
  const [isSaving, startSave] = useTransition();

  const handleCancel = () => {
    setName(businessName);
    setIsEditing(false);
  };

  const handleSave = () => {
    startSave(async () => {
      const result = await updateBusinessName(name);
      if (result.success) {
        toast.success('פרטי העסק עודכנו');
        setIsEditing(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="business_name">שם העסק</Label>
        {isEditing ? (
          <Input
            id="business_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
            autoFocus
          />
        ) : (
          <p className="py-2 font-medium">{businessName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>אימייל</Label>
        <p className="py-2 text-muted-foreground text-right" dir="ltr">{email}</p>
      </div>

      {isEditing ? (
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'שומר...' : 'שמור'}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            ביטול
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setIsEditing(true)}>
          ערוך פרטי עסק
        </Button>
      )}
    </div>
  );
}
