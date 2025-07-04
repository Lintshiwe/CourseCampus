
"use client"

import type { Material } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Presentation, Download, Eye, FileQuestion, FileCheck, FlaskConical, NotebookPen, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { incrementMaterialDownload, incrementMaterialHelpful } from '@/services/firestore';
import { useToast } from "@/hooks/use-toast";
import { getFileNameFromUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
  const [rating, setRating] = React.useState<'helpful' | 'not-helpful' | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = React.useState(false);
  const [displayHelpfulCount, setDisplayHelpfulCount] = React.useState(material.helpful || 0);

  React.useEffect(() => {
    const storedValue = localStorage.getItem(`material_rating_${material.id}`);
    if (storedValue) {
        setRating(storedValue as 'helpful' | 'not-helpful');
    }
  }, [material.id]);

  const handleDownload = async () => {
    try {
        await incrementMaterialDownload(material.id);
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
     window.open(material.url, '_blank');
  }

  const handleRating = async (helpful: boolean) => {
    if (rating !== null || isSubmittingRating) return;
    setIsSubmittingRating(true);
    try {
        if (helpful) {
            await incrementMaterialHelpful(material.id);
            setDisplayHelpfulCount(prev => prev + 1);
        }
        localStorage.setItem(`material_rating_${material.id}`, helpful ? 'helpful' : 'not-helpful');
        setRating(helpful ? 'helpful' : 'not-helpful');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your rating.' });
    } finally {
        setIsSubmittingRating(false);
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg mb-1 bg-secondary p-2 rounded-md">{material.title}</CardTitle>
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
        <div className="flex items-center text-sm text-muted-foreground pt-2">
            <FileText className="w-4 h-4 mr-2 shrink-0" />
            <span className="truncate" title={getFileNameFromUrl(material.url)}>{getFileNameFromUrl(material.url)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-2 pt-4">
         <div className="text-xs text-muted-foreground flex justify-between">
            <span>
                Uploaded: {material.uploadDate ? new Date(material.uploadDate).toLocaleDateString() : 'N/A'}
            </span>
            <span>
                {material.downloads} Downloads
            </span>
         </div>
         <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-medium">Helpful?</span>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRating(true)} disabled={isSubmittingRating || rating !== null}>
                    {isSubmittingRating && rating === null ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className={cn("h-4 w-4", rating === 'helpful' && "text-primary fill-current")} />}
                </Button>
                <span className="font-semibold min-w-[1rem] text-center">{displayHelpfulCount}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRating(false)} disabled={isSubmittingRating || rating !== null}>
                    <ThumbsDown className={cn("h-4 w-4", rating === 'not-helpful' && "text-destructive fill-current")} />
                </Button>
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
         </div>
      </CardFooter>
    </Card>
  );
}
