"use client"

import type { Material } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Presentation, Video, Download, Eye } from 'lucide-react';

type MaterialCardProps = {
  material: Material;
};

const typeIcons: Record<Material['type'], React.ReactNode> = {
  'Document': <FileText className="w-5 h-5" />,
  'Slides': <Presentation className="w-5 h-5" />,
  'Video': <Video className="w-5 h-5" />,
};

export function MaterialCard({ material }: MaterialCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg mb-1">{material.title}</CardTitle>
          <div className="text-primary">{typeIcons[material.type]}</div>
        </div>
        <CardDescription className="font-body">{material.course}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{material.faculty}</Badge>
          <Badge variant="secondary">{material.program}</Badge>
          <Badge variant="outline">Year {material.year}</Badge>
          <Badge variant="outline">Sem {material.semester}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <a href={material.url} download target="_blank" rel="noopener noreferrer">
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}
