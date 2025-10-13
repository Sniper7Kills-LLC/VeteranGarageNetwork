import { Calendar, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import ImageCarousel from './ImageCarousel';

export interface JournalEntry {
  id: string;
  projectId: string;
  date: string;
  details: string;
  accomplishments: string[];
  struggles: string[];
  primaryImage: string;
  photos: string[];
}

interface JournalEntryProps {
  entry: JournalEntry;
}

export default function JournalEntry({ entry }: JournalEntryProps) {
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);

  const allImages = [entry.primaryImage, ...entry.photos];

  const handleImageClick = (index: number) => {
    setCarouselStartIndex(index);
    setIsCarouselOpen(true);
  };

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Date Header */}
        <div className="bg-primary/5 border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">{entry.date}</h3>
          </div>
        </div>

        {/* Primary Image */}
        <div 
          className="relative h-96 overflow-hidden cursor-pointer group"
          onClick={() => handleImageClick(0)}
        >
          <img
            src={entry.primaryImage}
            alt={`Work from ${entry.date}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
              <ImageIcon className="w-6 h-6 text-gray-800" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Details Section */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Today's Work</h4>
            <p className="text-muted-foreground leading-relaxed">{entry.details}</p>
          </div>

          {/* Accomplishments Section */}
          {entry.accomplishments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-lg">Accomplishments</h4>
              </div>
              <ul className="space-y-2">
                {entry.accomplishments.map((accomplishment, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-muted-foreground">{accomplishment}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Struggles Section */}
          {entry.struggles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-lg">Challenges</h4>
              </div>
              <ul className="space-y-2">
                {entry.struggles.map((struggle, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span className="text-muted-foreground">{struggle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Photos Grid */}
          {entry.photos.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3">Additional Photos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {entry.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                    onClick={() => handleImageClick(index + 1)}
                  >
                    <img
                      src={photo}
                      alt={`Additional photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                        <ImageIcon className="w-4 h-4 text-gray-800" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Carousel */}
      <ImageCarousel
        images={allImages}
        initialIndex={carouselStartIndex}
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
      />
    </>
  );
}
