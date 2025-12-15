'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IAgent } from '@/lib/types';
import { ArrowLeft, Mail, Phone, Building, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface AgentDetailProps {
  agent: IAgent;
}

export function AgentDetail({ agent }: AgentDetailProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/agents">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Agent Profile Card */}
        <div className="lg:col-span-1">
          <Card className="text-center overflow-hidden shadow-lg">
            <CardContent className="p-0">
              <div className="bg-primary/10 h-32" />
              <div className="relative p-6 -mt-20">
                <Image
                  src={agent.profilePhotoUrl || '/images/placeholder-agent.jpg'}
                  alt={agent.name}
                  width={160}
                  height={160}
                  className="rounded-full mx-auto border-4 border-white shadow-lg"
                />
                <h1 className="text-2xl font-bold mt-4">{agent.name}</h1>
                <p className="text-primary text-lg">{agent.title}</p>
                <div className="flex items-center justify-center mt-2 text-muted-foreground">
                  <Building className="mr-2 h-4 w-4" />
                  <span>{agent.numberOfProperties} Properties</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`mailto:${agent.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  {agent.email}
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`tel:${agent.phoneNumber}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  {agent.phoneNumber}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Agent Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About {agent.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {agent.name} is a dedicated real estate professional with extensive experience
                in helping clients find their perfect property. With {agent.numberOfProperties}
                properties under their management, they bring expertise and commitment to every
                transaction.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Joined our team on {new Date(agent._createdAt).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{agent.numberOfProperties}</div>
                    <div className="text-sm text-muted-foreground">Properties Managed</div>
                  </div>
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">100%</div>
                    <div className="text-sm text-muted-foreground">Client Satisfaction</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Specializations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Residential Properties
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Investment Properties
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Property Management
                </span>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  Market Analysis
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Get In Touch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Ready to work with {agent.name}? Contact them directly to discuss your real estate needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="flex-1">
                  <a href={`mailto:${agent.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </a>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <a href={`tel:${agent.phoneNumber}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}