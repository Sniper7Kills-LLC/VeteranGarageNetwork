import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Wrench } from 'lucide-react';
import ContentOnly from '@/components/layouts/ContentOnly';
import JournalEntry, { type JournalEntry as JournalEntryType } from '@/components/JournalEntry';

interface Project {
  id: string;
  veteranName: string;
  branch: string;
  yearsOfService: string;
  vehicleType: 'Motorcycle' | 'Car';
  make: string;
  model: string;
  year: string;
  status: 'Planning' | 'In Progress' | 'Completed';
  startDate: string;
  image: string;
}

// Static project data - matches Projects.tsx
const PROJECTS: Project[] = [
  {
    id: '1',
    veteranName: 'James "Jimmy" Rodriguez',
    branch: 'U.S. Marine Corps',
    yearsOfService: '2008-2016',
    vehicleType: 'Motorcycle',
    make: 'Harley-Davidson',
    model: 'Shovelhead',
    year: '1978',
    status: 'In Progress',
    startDate: 'March 2025',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=600&fit=crop'
  },
  {
    id: '2',
    veteranName: 'Sarah Mitchell',
    branch: 'U.S. Army',
    yearsOfService: '2010-2018',
    vehicleType: 'Car',
    make: 'Ford',
    model: 'Mustang',
    year: '1967',
    status: 'Completed',
    startDate: 'January 2024',
    image: 'https://images.unsplash.com/photo-1584345604476-8ec5f5e8e8b6?w=800&h=600&fit=crop'
  },
  {
    id: '3',
    veteranName: 'Marcus "Doc" Thompson',
    branch: 'U.S. Navy',
    yearsOfService: '2005-2015',
    vehicleType: 'Motorcycle',
    make: 'Indian',
    model: 'Scout',
    year: '2019',
    status: 'In Progress',
    startDate: 'June 2025',
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&h=600&fit=crop'
  }
];

// Static journal entries data
const JOURNAL_ENTRIES: JournalEntryType[] = [
  // Project 1 - Harley-Davidson Shovelhead
  {
    id: 'j1-1',
    projectId: '1',
    date: 'October 10, 2025',
    details: 'Started the day by completely disassembling the carburetor. Found some corrosion in the float bowl that needed attention. Cleaned all jets and passages with carb cleaner and compressed air. Also began work on the primary drive, removing the outer primary cover to inspect the clutch.',
    accomplishments: [
      'Successfully cleaned and rebuilt the carburetor',
      'Replaced all carburetor gaskets and o-rings',
      'Removed primary cover without damaging gasket surfaces',
      'Documented all parts with photos for reassembly'
    ],
    struggles: [
      'One of the carburetor jets was seized and required careful extraction',
      'Primary cover bolts were extremely tight, had to use heat to break them loose',
      'Discovered the clutch cable needs replacement - will need to order new one'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=1200&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=600&h=600&fit=crop'
    ]
  },
  {
    id: 'j1-2',
    projectId: '1',
    date: 'October 5, 2025',
    details: 'Focused on the electrical system today. Removed the old wiring harness which was brittle and cracked in several places. Started routing the new harness, taking care to follow the original paths while making improvements for better protection and accessibility.',
    accomplishments: [
      'Completely removed old wiring harness',
      'Installed new main wiring harness',
      'Upgraded to LED turn signals for better visibility',
      'Tested all electrical connections with multimeter'
    ],
    struggles: [
      'Routing wires through the frame was more difficult than expected',
      'Had to modify one connector to fit the new LED signals',
      'Spent extra time ensuring proper wire management and protection'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1558980664-1db506751c6c?w=1200&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?w=600&h=600&fit=crop'
    ]
  },
  {
    id: 'j1-3',
    projectId: '1',
    date: 'September 28, 2025',
    details: 'Engine day! Pulled the engine from the frame to begin the rebuild process. This is a major milestone in the project. The engine came out easier than expected thanks to proper preparation and having the right tools. Now it\'s ready for a complete teardown and inspection.',
    accomplishments: [
      'Successfully removed engine from frame',
      'Cleaned and inspected frame while engine was out',
      'Set up dedicated workspace for engine rebuild',
      'Ordered all necessary gaskets and seals for rebuild'
    ],
    struggles: [
      'Engine was heavier than expected, needed help from fellow veteran',
      'One motor mount bolt was stripped, had to drill it out',
      'Found more oil leaks than initially thought - will need extra attention during rebuild'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=1200&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1558980664-1db506751c6c?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=600&h=600&fit=crop'
    ]
  },
  // Project 2 - Ford Mustang (Completed project)
  {
    id: 'j2-1',
    projectId: '2',
    date: 'August 15, 2024',
    details: 'Final day of the build! Completed the last details including final paint touch-ups, installed the custom badges, and did a complete systems check. Took it for the first real test drive and everything performed flawlessly. This has been an incredible journey.',
    accomplishments: [
      'Completed final paint corrections and detailing',
      'Installed all chrome trim and badges',
      'Successful 50-mile test drive with no issues',
      'Dyno tested - 450hp at the wheels!',
      'Passed state inspection on first try'
    ],
    struggles: [
      'Minor paint imperfection required wet sanding and buffing',
      'Hood alignment needed fine-tuning',
      'Spent hours detailing to get it perfect'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1584345604476-8ec5f5e8e8b6?w=1200&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&h=600&fit=crop'
    ]
  },
  {
    id: 'j2-2',
    projectId: '2',
    date: 'July 20, 2024',
    details: 'Interior installation day. Fitted the custom seats, installed the new carpet, and mounted the modern gauge cluster. The blend of classic styling with modern comfort is exactly what I envisioned. Also installed the new steering wheel and shift knob.',
    accomplishments: [
      'Installed custom leather seats',
      'Laid new carpet throughout interior',
      'Mounted and wired digital gauge cluster',
      'Installed new steering wheel and column',
      'Sound deadening material applied to floor and doors'
    ],
    struggles: [
      'Seat brackets required custom fabrication',
      'Gauge cluster wiring was complex, took longer than expected',
      'Carpet fitting around transmission tunnel was tricky'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1584345604476-8ec5f5e8e8b6?w=600&h=600&fit=crop'
    ]
  },
  // Project 3 - Indian Scout
  {
    id: 'j3-1',
    projectId: '3',
    date: 'October 8, 2025',
    details: 'Started the performance upgrades today. Installed the Stage 2 cams and new valve springs. This required careful timing and precise measurements. Also began fitting the new exhaust system - the sound is going to be incredible.',
    accomplishments: [
      'Successfully installed Stage 2 camshafts',
      'Replaced valve springs and checked all clearances',
      'Fitted new exhaust headers',
      'Torqued all fasteners to spec',
      'Initial timing set correctly'
    ],
    struggles: [
      'Cam timing was challenging - had to verify multiple times',
      'One exhaust stud was cross-threaded, needed helicoil repair',
      'Valve clearances were tighter than expected on two cylinders'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&h=600&fit=crop'
    ]
  },
  {
    id: 'j3-2',
    projectId: '3',
    date: 'September 30, 2025',
    details: 'Leather work day. Started crafting the custom seat with memorial details for fallen brothers. This is the most meaningful part of the build. Each stitch represents a memory and a promise to never forget. Also began planning the tank artwork.',
    accomplishments: [
      'Cut and shaped leather for custom seat',
      'Hand-stitched memorial details into seat',
      'Created template for tank artwork',
      'Sourced high-quality leather dye in memorial colors'
    ],
    struggles: [
      'Leather work is emotionally challenging but necessary',
      'Getting the stitching perfect took multiple attempts',
      'Balancing tribute with tasteful design required careful thought'
    ],
    primaryImage: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&h=800&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=600&h=600&fit=crop'
    ]
  }
];

export default function ProjectJournal() {
  const { id } = useParams<{ id: string }>();
  const project = PROJECTS.find(p => p.id === id);
  const journalEntries = JOURNAL_ENTRIES.filter(entry => entry.projectId === id).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (!project) {
    return (
      <ContentOnly>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist.</p>
          <Link to="/projects" className="text-primary hover:underline">
            Return to Projects
          </Link>
        </div>
      </ContentOnly>
    );
  }

  const statusColors = {
    'Planning': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  };

  return (
    <ContentOnly>
      <div className="space-y-8">
        {/* Back Button */}
        <Link 
          to="/projects" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        {/* Project Header */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <div className="relative h-64 overflow-hidden">
            <img
              src={project.image}
              alt={`${project.year} ${project.make} ${project.model}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[project.status]}`}>
                  {project.status}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/20 text-white backdrop-blur-sm">
                  {project.vehicleType}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {project.year} {project.make} {project.model}
              </h1>
              <p className="text-white/90">Project started: {project.startDate}</p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-primary">
                  {project.veteranName.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">{project.veteranName}</h2>
                <p className="text-muted-foreground">{project.branch}</p>
                <p className="text-sm text-muted-foreground">{project.yearsOfService}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Journal Header */}
        <div className="flex items-center gap-3">
          <Wrench className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Build Journal</h2>
            <p className="text-muted-foreground">
              {journalEntries.length} {journalEntries.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>

        {/* Journal Entries */}
        {journalEntries.length > 0 ? (
          <div className="space-y-8">
            {journalEntries.map(entry => (
              <JournalEntry key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="border border-border rounded-lg p-12 text-center bg-card">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Journal Entries Yet</h3>
            <p className="text-muted-foreground">
              This project doesn't have any journal entries yet. Check back soon for updates!
            </p>
          </div>
        )}
      </div>
    </ContentOnly>
  );
}
