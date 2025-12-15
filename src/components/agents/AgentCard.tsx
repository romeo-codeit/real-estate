import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { IAgent } from '@/lib/types';
import { Mail, Phone, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface AgentCardProps {
  agent: IAgent;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card className="text-center overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group cursor-pointer">
      <Link href={`/agents/${agent._id}`}>
        <CardContent className="p-0">
          <div className="bg-primary/10 h-24" />
          <div className="relative p-6 -mt-16">
            <Image
              src={agent.profilePhotoUrl || '/images/placeholder-agent.jpg'}
              alt={agent.name}
              width={128}
              height={128}
              className="rounded-full mx-auto border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            <h3 className="text-xl font-bold mt-4 group-hover:text-primary transition-colors">
              {agent.name}
            </h3>
            <p className="text-primary">{agent.title}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {agent.numberOfProperties} Properties
            </p>
          </div>
        </CardContent>
      </Link>
      <CardFooter className="flex-col gap-2 p-4 pt-0 border-t">
        <Button variant="ghost" className="w-full" asChild>
          <a href={`mailto:${agent.email}`}>
            <Mail className="mr-2 h-4 w-4" /> {agent.email}
          </a>
        </Button>
        <Button variant="ghost" className="w-full" asChild>
          <a href={`tel:${agent.phoneNumber}`}>
            <Phone className="mr-2 h-4 w-4" /> {agent.phoneNumber}
          </a>
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/agents/${agent._id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Profile
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
