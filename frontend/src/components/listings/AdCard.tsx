// frontend/src/components/listings/AdCard.tsx
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from 'lucide-react';

// Define the shape of the Ad object coming from the backend
export interface IAd {
  _id: string;
  sponsorName: string;
  adTitle: string;
  adDescription: string;
  imageUrl: string;
  targetUrl: string;
}

interface AdCardProps {
  ad: IAd;
}

const AdCard: React.FC<AdCardProps> = ({ ad }) => {
  return (
    // The entire card is a clickable link that opens in a new tab
    <a
      href={ad.targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative  overflow-hidden rounded-lg shadow-md border border-neutral-700 bg-neutral-900 transition-all hover:shadow-xl hover:border-primary hover:-translate-y-1 h-full flex flex-col"
    >
      {/* Image Section */}
      <div className="relative h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${ad.imageUrl})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4">
            <h3 className="text-lg font-bold text-white" title={ad.adTitle}>
                {ad.adTitle}
            </h3>
        </div>
        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">Sponsored</Badge>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        <p className="text-sm text-neutral-400 mb-4 flex-grow">{ad.adDescription}</p>
        <div className="flex items-center justify-between text-xs text-primary font-semibold">
            <span>{ad.sponsorName}</span>
            <span className="flex items-center gap-1">
                Learn More <ExternalLink size={14} />
            </span>
        </div>
      </div>
    </a>
  );
};

export default AdCard;