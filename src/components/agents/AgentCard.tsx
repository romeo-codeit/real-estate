import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { IAgent } from '@/lib/types';
import { Mail, Phone, Eye, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface AgentCardProps {
  agent: IAgent;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border-0 bg-card/60 backdrop-blur-sm group">
      <Link href={`/agents/${agent._id}`} className="block flex-1 flex flex-col">
        {/* Image Header Section - Similar to PropertyCard */}
        <CardHeader className="p-0 relative">
          <div className="relative w-full h-56 md:h-64 bg-gradient-to-br from-blue-50 via-blue-100/50 to-transparent dark:from-blue-950/30 dark:via-blue-900/20 dark:to-transparent overflow-hidden">
            {/* Profile image */}
            <Image
              src={agent.profilePhotoUrl || '/images/placeholder-agent.jpg'}
              alt={agent.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            
            {/* Info pill in corner - like property price */}
            <div className="absolute bottom-4 left-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground text-xs font-semibold shadow-lg ring-1 ring-primary/30">
                {agent.numberOfProperties} Properties
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Content Section */}
        <CardContent className="p-5 flex-grow flex flex-col">
          {/* Name - large and bold like property title */}
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {agent.name}
          </h3>

          {/* Title */}
          <p className="text-sm font-medium text-primary dark:text-primary mb-3">
            {agent.title}
          </p>

          {/* Contact info with icons - like property features */}
          <div className="space-y-2 text-sm text-muted-foreground mb-auto">
            <div className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
              <a href={`mailto:${agent.email}`} className="truncate hover:underline text-xs md:text-sm">
                {agent.email}
              </a>
            </div>
            <div className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Phone className="w-4 h-4 text-primary flex-shrink-0" />
              <a href={`tel:${agent.phoneNumber}`} className="text-xs md:text-sm hover:underline">
                {agent.phoneNumber}
              </a>
            </div>
          </div>
        </CardContent>
      </Link>

      {/* Action Buttons - matching PropertyCard layout */}
      <CardFooter className="p-5 pt-0 gap-3 flex">
        <Button variant="outline" className="flex-1 rounded-lg h-10" asChild>
          <a href={`mailto:${agent.email}`} className="flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Contact</span>
          </a>
        </Button>
        <Button className="flex-1 rounded-lg h-10 bg-primary hover:bg-primary/90" asChild>
          <Link href={`/agents/${agent._id}`} className="flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">View</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
