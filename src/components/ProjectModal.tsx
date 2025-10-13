import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  veteranName: string;
  branch: string;
  yearsOfService: string;
  veteranBio: string;
  vehicleType: 'Motorcycle' | 'Car';
  make: string;
  model: string;
  year: string;
  status: 'Planning' | 'In Progress' | 'Completed';
  projectDescription: string;
  startDate: string;
  image: string;
}

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
  if (!project) return null;

  const statusVariant = {
    'Planning': 'default' as const,
    'In Progress': 'secondary' as const,
    'Completed': 'default' as const
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Project Image */}
        <div className="relative h-80 overflow-hidden">
          <img
            src={project.image}
            alt={`${project.year} ${project.make} ${project.model}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 mb-3">
              <Badge 
                variant={statusVariant[project.status]}
                className={
                  project.status === 'Planning' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900' :
                  project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900' :
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900'
                }
              >
                {project.status}
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm hover:bg-white/20">
                {project.vehicleType}
              </Badge>
            </div>
            <DialogHeader className="text-left space-y-1 p-0">
              <DialogTitle className="text-3xl font-bold text-white">
                {project.year} {project.make} {project.model}
              </DialogTitle>
              <p className="text-white/90 text-sm">Project started: {project.startDate}</p>
            </DialogHeader>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Veteran Section */}
          <div className="border border-border rounded-lg p-5 bg-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {project.veteranName.charAt(0)}
                </span>
              </div>
              About the Veteran
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-lg">{project.veteranName}</h4>
                <p className="text-muted-foreground">{project.branch}</p>
                <p className="text-sm text-muted-foreground">Service: {project.yearsOfService}</p>
              </div>
              <p className="text-muted-foreground italic leading-relaxed">
                "{project.veteranBio}"
              </p>
            </div>
          </div>

          {/* Vehicle Details Section */}
          <div className="border border-border rounded-lg p-5 bg-card">
            <h3 className="text-lg font-semibold mb-4">Vehicle Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Make</p>
                <p className="font-semibold">{project.make}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Model</p>
                <p className="font-semibold">{project.model}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Year</p>
                <p className="font-semibold">{project.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Type</p>
                <p className="font-semibold">{project.vehicleType}</p>
              </div>
            </div>
          </div>

          {/* Project Description Section */}
          <div className="border border-border rounded-lg p-5 bg-card">
            <h3 className="text-lg font-semibold mb-4">Project Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {project.projectDescription}
            </p>
          </div>

          {/* Project Status Section */}
          <div className="border border-border rounded-lg p-5 bg-card">
            <h3 className="text-lg font-semibold mb-4">Current Status</h3>
            <div className="flex items-center gap-3 mb-4">
              <Link
                to={`/projects/${project.id}`}
                className="inline-block"
              >
                <Badge 
                  variant={statusVariant[project.status]}
                  className={`cursor-pointer ${
                    project.status === 'Planning' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100/80 dark:hover:bg-blue-900/80' :
                    project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100/80 dark:hover:bg-yellow-900/80' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100/80 dark:hover:bg-green-900/80'
                  }`}
                >
                  {project.status}
                </Badge>
              </Link>
              <p className="text-muted-foreground">
                {project.status === 'Planning' && 'This project is in the planning phase. The veteran is gathering parts and preparing for the build.'}
                {project.status === 'In Progress' && 'This project is actively being worked on. Check back for updates on the progress!'}
                {project.status === 'Completed' && 'This project has been completed! The veteran has successfully finished their build.'}
              </p>
            </div>
            <Link
              to={`/projects/${project.id}`}
              className="text-primary hover:underline text-sm font-medium"
            >
              View full build journal →
            </Link>
          </div>

          {/* Call to Action */}
          <div className="border border-border rounded-lg p-5 bg-primary/5">
            <h3 className="text-lg font-semibold mb-2">Want to Support This Project?</h3>
            <p className="text-muted-foreground mb-4">
              Connect with fellow veterans, share your expertise, or learn from their experience. 
              Every project is a story of resilience and community.
            </p>
            <Button className="font-semibold">
              Contact Veteran
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
