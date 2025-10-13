import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ChapterRole {
  id: string;
  roleTitle: string;
  personName: string;
  email?: string;
  phone?: string;
}

interface ClubChapter {
  id: string;
  clubId: string;
  clubName: string;
  clubType?: string[];
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  roles: ChapterRole[];
}

interface ChapterModalProps {
  chapter: ClubChapter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChapterModal({
  chapter,
  open,
  onOpenChange,
}: ChapterModalProps) {
  if (!chapter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{chapter.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{chapter.clubName}</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Club Types */}
          {chapter.clubType && chapter.clubType.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Club Types</h3>
              <div className="flex flex-wrap gap-2">
                {chapter.clubType.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location Information */}
          {(chapter.address || chapter.city || chapter.state) && (
            <div>
              <h3 className="font-semibold mb-2">Location</h3>
              <div className="text-sm text-muted-foreground">
                {chapter.address && <p>{chapter.address}</p>}
                {(chapter.city || chapter.state) && (
                  <p>
                    {chapter.city}
                    {chapter.city && chapter.state && ', '}
                    {chapter.state}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {chapter.description && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground">
                {chapter.description}
              </p>
            </div>
          )}

          {/* Chapter Roster */}
          {chapter.roles.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Chapter Roster</h3>
              <div className="space-y-3">
                {chapter.roles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 border border-border rounded-lg bg-card"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{role.roleTitle}</h4>
                        <p className="text-sm text-muted-foreground">
                          {role.personName}
                        </p>
                      </div>
                    </div>
                    {(role.email || role.phone) && (
                      <div className="mt-2 space-y-1 text-sm">
                        {role.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Email:</span>
                            <a
                              href={`mailto:${role.email}`}
                              className="text-primary hover:underline"
                            >
                              {role.email}
                            </a>
                          </div>
                        )}
                        {role.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Phone:</span>
                            <a
                              href={`tel:${role.phone}`}
                              className="text-primary hover:underline"
                            >
                              {role.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
