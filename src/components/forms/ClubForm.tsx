import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CLUB_TYPE_VALUES, CLUB_TYPE_DESCRIPTIONS, type ClubType } from '@/../amplify/config/enums';
import { Loader2 } from 'lucide-react';

export interface ClubFormData {
  id?: string;
  name: string;
  description?: string;
  website?: string;
  type?: ClubType;
  notes?: string; // Only for create mode
}

interface ClubFormProps {
  mode: 'create' | 'edit';
  initialData?: ClubFormData;
  onSubmit: (data: ClubFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ClubForm({ mode, initialData, onSubmit, onCancel }: ClubFormProps) {
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [type, setType] = useState<string>(initialData?.type || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to format club type labels
  const formatClubType = (clubType: string): string => {
    return clubType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!name.trim() || name.length < 3) {
      newErrors.name = 'Club name must be at least 3 characters';
    }

    // Website validation (if provided)
    if (website.trim()) {
      try {
        new URL(website.trim());
      } catch {
        newErrors.website = 'Please enter a valid URL';
      }
    }

    // Notes validation (only for create mode)
    if (mode === 'create' && !notes.trim()) {
      newErrors.notes = 'Please provide contact information for admin approval';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data
      const formData: ClubFormData = {
        id: initialData?.id,
        name: name.trim(),
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        type: type ? (type as ClubType) : undefined,
      };

      // Add notes only for create mode
      if (mode === 'create') {
        formData.notes = notes.trim();
      }

      // Call parent's onSubmit handler
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(`Failed to ${mode} club`, {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Club Name */}
      <div>
        <Label htmlFor="name">
          Club Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter club name"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      {/* Club Description */}
      <div>
        <Label htmlFor="description">Club Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your club"
          rows={4}
        />
        <p className="text-sm text-muted-foreground mt-1">
          {description.length} characters
        </p>
      </div>

      {/* Website URL */}
      <div>
        <Label htmlFor="website">Website URL</Label>
        <Input
          id="website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
          className={errors.website ? 'border-destructive' : ''}
        />
        {errors.website && (
          <p className="text-sm text-destructive mt-1">{errors.website}</p>
        )}
      </div>

      {/* Club Type */}
      <div>
        <Label htmlFor="type">Club Type</Label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full mt-1 p-2 border border-border rounded-md bg-background"
        >
          <option value="">-- Select a club type --</option>
          {CLUB_TYPE_VALUES.map((clubType) => (
            <option key={clubType} value={clubType}>
              {formatClubType(clubType)}
            </option>
          ))}
        </select>
        {type && CLUB_TYPE_DESCRIPTIONS[type] && (
          <p className="text-xs text-muted-foreground mt-1">
            {CLUB_TYPE_DESCRIPTIONS[type]}
          </p>
        )}
      </div>

      {/* Admin Notes (Create mode only) */}
      {mode === 'create' && (
        <div>
          <Label htmlFor="notes">
            Admin Approval Notes <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            This section is to provide contact information and additional context to reviewers. 
            The club will need to be approved before you can add chapters. Please provide a phone number/email to reach out to.
          </p>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter your contact information and any additional context for reviewers..."
            rows={4}
            className={errors.notes ? 'border-destructive' : ''}
          />
          {errors.notes && (
            <p className="text-sm text-destructive mt-1">{errors.notes}</p>
          )}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === 'create' ? 'Creating Club...' : 'Updating Club...'}
            </>
          ) : (
            mode === 'create' ? 'Create Club' : 'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
