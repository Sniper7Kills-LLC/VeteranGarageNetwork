import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Info } from 'lucide-react';
import ContentWithSidebar from '@/components/layouts/ContentWithSidebar';
import ProjectModal from '@/components/ProjectModal';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

// Static project data - will be replaced with Amplify data
const PROJECTS: Project[] = [
  {
    id: '1',
    veteranName: 'James "Jimmy" Rodriguez',
    branch: 'U.S. Marine Corps',
    yearsOfService: '2008-2016',
    veteranBio: 'Served two tours in Afghanistan as a combat engineer. Found peace and purpose in restoring classic motorcycles after returning home.',
    vehicleType: 'Motorcycle',
    make: 'Harley-Davidson',
    model: 'Shovelhead',
    year: '1978',
    status: 'In Progress',
    projectDescription: 'Complete frame-off restoration of a 1978 Shovelhead. Rebuilding the engine, custom paint job in Marine Corps colors, and upgrading the electrical system while maintaining the classic look.',
    startDate: 'March 2025',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop'
  },
  {
    id: '2',
    veteranName: 'Sarah Mitchell',
    branch: 'U.S. Army',
    yearsOfService: '2010-2018',
    veteranBio: 'Former Army mechanic who specialized in vehicle maintenance. Now channels that expertise into building custom hot rods and helping other veterans with their projects.',
    vehicleType: 'Car',
    make: 'Ford',
    model: 'Mustang',
    year: '1967',
    status: 'Completed',
    projectDescription: 'Fully restored 1967 Mustang fastback with a modern 5.0L Coyote engine swap. Custom suspension, Wilwood brakes, and a stunning Grabber Blue paint job. This car is a perfect blend of classic style and modern performance.',
    startDate: 'January 2024',
    image: 'https://images.unsplash.com/photo-1584345604476-8ec5f5e8e8b6?w=800&h=600&fit=crop'
  },
  {
    id: '3',
    veteranName: 'Marcus "Doc" Thompson',
    branch: 'U.S. Navy',
    yearsOfService: '2005-2015',
    veteranBio: 'Navy corpsman who served with Marine units. Building this bike as therapy and a tribute to fallen brothers. Every ride is a reminder of the journey.',
    vehicleType: 'Motorcycle',
    make: 'Indian',
    model: 'Scout',
    year: '2019',
    status: 'In Progress',
    projectDescription: 'Customizing a 2019 Indian Scout with performance upgrades including Stage 2 cams, exhaust system, and custom leather work. Adding memorial details to honor fallen comrades.',
    startDate: 'June 2025',
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&h=600&fit=crop'
  },
  {
    id: '4',
    veteranName: 'Robert "Bobby" Chen',
    branch: 'U.S. Air Force',
    yearsOfService: '2012-2020',
    veteranBio: 'Aircraft mechanic turned automotive enthusiast. Precision and attention to detail learned in the Air Force now applied to building dream machines.',
    vehicleType: 'Car',
    make: 'Chevrolet',
    model: 'Camaro',
    year: '1969',
    status: 'In Progress',
    projectDescription: 'Ground-up restoration of a 1969 Camaro SS. LS3 engine swap, modern transmission, complete interior restoration with custom seats, and Rally Sport front end conversion.',
    startDate: 'September 2024',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop'
  },
  {
    id: '5',
    veteranName: 'David "Dave" Patterson',
    branch: 'U.S. Army',
    yearsOfService: '2001-2009',
    veteranBio: 'Iraq War veteran who found solace in the simplicity and freedom of riding. Building bikes helps manage PTSD and connects with the veteran community.',
    vehicleType: 'Motorcycle',
    make: 'Triumph',
    model: 'Bonneville',
    year: '1972',
    status: 'Completed',
    projectDescription: 'Café racer conversion of a 1972 Triumph Bonneville. Complete engine rebuild, custom exhaust, clip-on handlebars, rear sets, and a beautiful British Racing Green paint scheme.',
    startDate: 'April 2024',
    image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop'
  },
  {
    id: '6',
    veteranName: 'Lisa Hernandez',
    branch: 'U.S. Marine Corps',
    yearsOfService: '2013-2021',
    veteranBio: 'Combat veteran and single mother building her dream truck. Proving that with determination and the support of fellow veterans, anything is possible.',
    vehicleType: 'Car',
    make: 'Chevrolet',
    model: 'C10',
    year: '1971',
    status: 'Planning',
    projectDescription: 'Planning a restomod build of a 1971 C10 pickup. Will feature a modern LS engine, air ride suspension, custom interior, and a two-tone paint job. Goal is to create a reliable daily driver with classic style.',
    startDate: 'November 2025',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop'
  },
  {
    id: '7',
    veteranName: 'Michael "Mike" O\'Brien',
    branch: 'U.S. Coast Guard',
    yearsOfService: '2007-2019',
    veteranBio: 'Former Coast Guard rescue swimmer who loves the adrenaline rush of a powerful motorcycle. Building bikes is his new mission.',
    vehicleType: 'Motorcycle',
    make: 'Kawasaki',
    model: 'Z1',
    year: '1973',
    status: 'In Progress',
    projectDescription: 'Restoring a rare 1973 Kawasaki Z1 to original specifications. Complete engine rebuild, new wiring harness, original paint colors, and period-correct details throughout.',
    startDate: 'February 2025',
    image: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&h=600&fit=crop'
  },
  {
    id: '8',
    veteranName: 'Anthony "Tony" Williams',
    branch: 'U.S. Army',
    yearsOfService: '2009-2017',
    veteranBio: 'Former tank mechanic who loves American muscle. Building this Charger is a tribute to the power and resilience learned in service.',
    vehicleType: 'Car',
    make: 'Dodge',
    model: 'Charger',
    year: '1970',
    status: 'Completed',
    projectDescription: 'Fully restored 1970 Dodge Charger R/T with numbers-matching 440 Magnum engine. Plum Crazy Purple paint, white interior, and all original chrome restored to perfection.',
    startDate: 'May 2023',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop'
  }
];

const FILTERS = ['All Projects', 'Motorcycles', 'Cars', 'Planning', 'In Progress', 'Completed'];

function ProjectsSidebar({ 
  selectedFilter, 
  onFilterChange 
}: { 
  selectedFilter: string; 
  onFilterChange: (filter: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="space-y-2">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                selectedFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 border border-border rounded-lg bg-card">
        <h3 className="font-semibold mb-2">About Projects</h3>
        <p className="text-sm text-muted-foreground">
          These are real projects from veterans in our community. Each build represents a journey of healing, creativity, and camaraderie.
        </p>
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const statusColors = {
    'Planning': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger modal if not clicking on the journal link
    if (!(e.target as HTMLElement).closest('a')) {
      onClick();
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Project Image */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={project.image} 
          alt={`${project.year} ${project.make} ${project.model}`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[project.status]}`}>
            {project.status}
          </span>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/70 text-white">
            {project.vehicleType}
          </span>
        </div>
      </div>

      {/* Project Content */}
      <div className="p-5 space-y-4">
        {/* Vehicle Info */}
        <div>
          <h3 className="text-xl font-bold mb-1">
            {project.year} {project.make} {project.model}
          </h3>
          <p className="text-sm text-muted-foreground">Started: {project.startDate}</p>
        </div>

        {/* Veteran Info */}
        <div className="border-t border-border pt-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary">
                {project.veteranName.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold">{project.veteranName}</h4>
              <p className="text-sm text-muted-foreground">{project.branch}</p>
              <p className="text-xs text-muted-foreground">{project.yearsOfService}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">
            "{project.veteranBio}"
          </p>
        </div>

        {/* Project Description */}
        <div className="border-t border-border pt-4">
          <h4 className="font-semibold mb-2 text-sm">Project Details</h4>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {project.projectDescription}
          </p>
        </div>

        {/* View Journal Button */}
        <div className="border-t border-border pt-4">
          <Link
            to={`/projects/${project.id}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            <BookOpen className="w-4 h-4" />
            View Build Journal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [selectedFilter, setSelectedFilter] = useState('All Projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const filteredProjects = PROJECTS.filter(project => {
    if (selectedFilter === 'All Projects') return true;
    if (selectedFilter === 'Motorcycles') return project.vehicleType === 'Motorcycle';
    if (selectedFilter === 'Cars') return project.vehicleType === 'Car';
    return project.status === selectedFilter;
  });

  return (
    <ContentWithSidebar sidebar={<ProjectsSidebar selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />}>
      <div className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This section is planned for the future and will be last in development.
          </AlertDescription>
        </Alert>

        <div>
          <h1 className="text-3xl font-bold mb-2">Current Projects</h1>
          <p className="text-muted-foreground">
            Explore the incredible builds from veterans in our community. From classic restorations to custom creations, 
            each project tells a unique story of passion, skill, and brotherhood.
          </p>
        </div>

        {/* Project Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold">{filteredProjects.length}</span>
          <span>
            {filteredProjects.length === 1 ? 'project' : 'projects'} 
            {selectedFilter !== 'All Projects' && ` in ${selectedFilter}`}
          </span>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={() => handleProjectClick(project)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      <ProjectModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </ContentWithSidebar>
  );
}
