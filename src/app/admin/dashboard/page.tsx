"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Material, Feedback, SocialLink } from '@/types';
import { FilePenLine, Trash2, Facebook, Twitter, Linkedin, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getMaterials, deleteMaterial, getFeedback, deleteFeedback, getSocialLinks, updateSocialLinks } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';


const LoadingSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
    </div>
)

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [feedback, setFeedback] = React.useState<Feedback[]>([]);
  const [socialLinks, setSocialLinks] = React.useState<SocialLink[]>([]);
  const [loading, setLoading] = React.useState({ materials: true, feedback: true, social: true });
  const [isSaving, setIsSaving] = React.useState(false);


  React.useEffect(() => {
    const fetchData = async () => {
        setLoading(prev => ({ ...prev, materials: true }));
        const materialsData = await getMaterials();
        setMaterials(materialsData);
        setLoading(prev => ({ ...prev, materials: false }));

        setLoading(prev => ({ ...prev, feedback: true }));
        const feedbackData = await getFeedback();
        setFeedback(feedbackData);
        setLoading(prev => ({ ...prev, feedback: false }));

        setLoading(prev => ({ ...prev, social: true }));
        const socialLinksData = await getSocialLinks();
        // Ensure default structure if Firestore is empty
        const defaultLinks: SocialLink[] = [
            { id: 'facebook', name: 'Facebook', url: '' },
            { id: 'twitter', name: 'Twitter', url: '' },
            { id: 'linkedin', name: 'LinkedIn', url: '' },
        ];
        const mergedLinks = defaultLinks.map(defaultLink => {
            const found = socialLinksData.find(dbLink => dbLink.id === defaultLink.id);
            return found ? { ...defaultLink, ...found } : defaultLink;
        });
        setSocialLinks(mergedLinks);
        setLoading(prev => ({ ...prev, social: false }));
    };
    fetchData();
  }, []);

  const saveSocialLinks = async () => {
      setIsSaving(true);
      try {
        await updateSocialLinks(socialLinks);
        toast({ title: 'Success', description: 'Social links updated successfully.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update social links.' });
      } finally {
        setIsSaving(false);
      }
  }

  const handleSocialLinkChange = (id: SocialLink['id'], url: string) => {
      setSocialLinks(prev => prev.map(link => link.id === id ? { ...link, url } : link));
  };
  
  const handleDeleteFeedback = async (id: string) => {
      try {
          await deleteFeedback(id);
          setFeedback(prev => prev.filter(fb => fb.id !== id));
          toast({ title: 'Feedback Deleted', description: 'The feedback item has been removed.' });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete feedback.' });
      }
  }
  
  const handleDeleteMaterial = async (id: string) => {
      try {
          await deleteMaterial(id);
          setMaterials(prev => prev.filter(m => m.id !== id));
          toast({ title: 'Material Deleted' });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete material.' });
      }
  }

  return (
    <div className="container mx-auto py-4">
      <Tabs defaultValue="materials">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
              <CardDescription>Manage the course materials available in the app.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading.materials ? <LoadingSkeleton /> : (
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden md:table-cell">Course</TableHead>
                        <TableHead className="hidden lg:table-cell">Faculty</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.title}</TableCell>
                          <TableCell className="hidden md:table-cell">{material.course}</TableCell>
                          <TableCell className="hidden lg:table-cell">{material.faculty}</TableCell>
                          <TableCell><Badge variant="secondary">{material.type}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" disabled><FilePenLine className="h-4 w-4" /></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the material.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteMaterial(material.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </CardContent>
            <CardFooter className="border-t pt-6">
                <p className="text-sm text-muted-foreground">Add and Edit functionality coming soon.</p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback</CardTitle>
              <CardDescription>Here's what users are saying about the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading.feedback ? <LoadingSkeleton /> : feedback.length > 0 ? feedback.map(fb => (
                <Card key={fb.id}>
                  <CardContent className="p-4 flex justify-between items-start">
                    <div>
                      <p className="text-sm">{fb.text}</p>
                      <p className="text-xs text-muted-foreground mt-2">{fb.createdAt.toLocaleString()}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the feedback.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteFeedback(fb.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              )) : (
                <p className="text-center text-muted-foreground p-8">No feedback submitted yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Manage the social media links displayed in the app footer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading.social ? <LoadingSkeleton /> : socialLinks.map(link => (
                <div key={link.id} className="flex items-center gap-4">
                  <Label htmlFor={link.id} className="w-24 flex items-center gap-2 capitalize">
                    {link.id === 'facebook' && <Facebook />}
                    {link.id === 'twitter' && <Twitter />}
                    {link.id === 'linkedin' && <Linkedin />}
                    {link.name}
                  </Label>
                  <Input id={link.id} value={link.url} onChange={(e) => handleSocialLinkChange(link.id, e.target.value)} />
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={saveSocialLinks} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
