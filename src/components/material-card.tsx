
"use client"

import type { Material } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Presentation, Download, Eye, FileQuestion, FileCheck, FlaskConical, NotebookPen, Terminal, Share2 } from 'lucide-react';
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
        // Optimistically update downloads count on the client
        material.downloads = (material.downloads || 0) + 1; 
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
     window.open(material.url, '_blank');
  }

  const handleShare = async () => {
    const shareData = {
      title: `CourseCampus: ${material.title}`,
      text: `Check out "${material.title}" on CourseCampus.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "A link to the CourseCampus page has been copied to your clipboard.",
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          variant: 'destructive',
          title: 'Share Failed',
          description: 'Could not share or copy the link.'
        });
      }
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 bg-card">
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
        {material.fileName && (
            <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="truncate">{material.fileName}</span>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-2 pt-4">
         <div className="text-xs text-muted-foreground flex justify-between">
            <span>
                Uploaded: {material.uploadDate ? new Date(material.uploadDate).toLocaleDateString() : 'N/A'}
            </span>
            <span>
                {material.downloads || 0} Downloads
            </span>
         </div>
         <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex gap-1">
                {(material.title?.toLowerCase().includes('information security') || material.title?.toLowerCase().includes('operating system')) && (
                    <Button variant="ghost" size="icon" title="Open Terminal" className="h-9 w-9" asChild>
                        <a href="https://terminux.live/" target="_blank" rel="noopener noreferrer">
                            <Terminal className="h-4 w-4" />
                        </a>
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" title="Share" className="h-9 w-9" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handlePreview}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button size="sm" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
            </div>
         </div>
      </CardFooter>
    </Card>
  );
}
