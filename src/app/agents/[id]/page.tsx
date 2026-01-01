import type { Metadata } from 'next';
import { getAgentById } from '@/services/sanity/agents.sanity';
import { notFound } from 'next/navigation';
import { AgentDetail } from '@/components/agents/AgentDetail';

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const agent = await getAgentById(params.id);
  if (!agent) return { title: 'Agent - Real Estate Invest' };
  return { title: `${agent.name} - Real Estate Invest`, description: agent.title || 'Agent profile' };
}

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