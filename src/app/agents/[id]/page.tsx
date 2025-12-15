import { getAgentById } from '@/services/sanity/agents.sanity';
import { notFound } from 'next/navigation';
import { AgentDetail } from '@/components/agents/AgentDetail';

interface AgentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AgentPage({ params }: AgentPageProps) {
  const resolvedParams = await params;
  const agent = await getAgentById(resolvedParams.id);

  if (!agent) {
    notFound();
  }

  return <AgentDetail agent={agent} />;
}