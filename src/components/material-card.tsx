"use client"

import type { Material } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Presentation, Video, Download, Eye, BookCopy, FileQuestion, FileCheck, FlaskConical, NotebookPen } from 'lucide-react';
import { incrementMaterialDownload } from '@/services/firestore';
import { useToast } from "@/hooks/use-toast";

type MaterialCardProps = {
  material: Material;
};

const typeIcons: Record<Material['type'], React.ReactNode> = {
  'Lecture Slides': <Presentation className="w-5 h-5" />,
  'Past Papers': <FileQuestion className="w-5 h-5" />,
  'Memos': <FileCheck className="w-5 h-5" />,
  'Tutorials': <NotebookPen className="w-5 h-5" />,
  'Lab Manuals': <FlaskConical className="w-5 h-5" />,
};

export function MaterialCard({ material }: MaterialCardProps) {
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
        await incrementMaterialDownload(material.id);
        // This makes sure the UI updates if the user comes back to the page
        material.downloads += 1; 
        window.open(material.url, '_blank');
    } catch (e) {
        toast({
            variant: 'destructive',
            title: 'Download Error',
            description: 'Could not update download count, but the download will proceed.'
        });
        window.open(material.url, '_blank');
    }
  }

  const handlePreview = () => {
    // For simplicity, preview opens the same URL. Can be extended for embedded previews.
     window.open(material.url, '_blank');
  }

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg mb-1">{material.title}</CardTitle>
          <div className="text-primary" title={material.type}>{typeIcons[material.type] || <FileText className="w-5 h-5" />}</div>
        </div>
        <CardDescription className="font-body">{material.course}</CardDescription>
        <CardDescription className="font-body text-xs text-muted-foreground">
            By {material.lecturer}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{material.faculty}</Badge>
          <Badge variant="secondary" className="truncate">{material.program}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
           <Badge variant="outline">Year {material.year}</Badge>
           <Badge variant="outline">Sem {material.semester}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-2">
         <div className="text-xs text-muted-foreground flex justify-between">
            <span>
                Uploaded: {material.uploadDate ? new Date(material.uploadDate).toLocaleDateString() : 'N/A'}
            </span>
            <span>
                {material.downloads} Downloads
            </span>
         </div>
         <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
         </div>
      </CardFooter>
    </Card>
  );
}
