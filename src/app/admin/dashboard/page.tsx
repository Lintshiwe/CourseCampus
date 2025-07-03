
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
import { FilePenLine, PlusCircle, Trash2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Initial data for demonstration if localStorage is empty
const initialMaterials: Material[] = [
  { id: '1', title: 'Intro to Programming', course: 'ICP1521', faculty: 'ICT', program: 'Software Dev', year: 1, semester: 1, type: 'Document', url: 'https://example.com/doc1.pdf' },
  { id: '2', title: 'Calculus I Notes', course: 'MTH1521', faculty: 'Engineering', program: 'Elec Eng', year: 1, semester: 1, type: 'Document', url: 'https://example.com/doc2.pdf' },
  { id: '3', title: 'Networking Basics', course: 'CNF2521', faculty: 'ICT', program: 'Software Dev', year: 2, semester: 1, type: 'Slides', url: 'https://example.com/slides1.ppt' },
];
const initialFeedback: Feedback[] = [
    { id: '1', text: 'This app is great! Very helpful for finding materials.', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { id: '2', text: 'Could you add materials for the Economics department?', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
];
const initialSocialLinks: SocialLink[] = [
    { id: 'facebook', name: 'Facebook', url: 'https://facebook.com' },
    { id: 'twitter', name: 'Twitter', url: 'https://twitter.com' },
    { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com' },
];


export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [feedback, setFeedback] = React.useState<Feedback[]>([]);
  const [socialLinks, setSocialLinks] = React.useState<SocialLink[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const storedMaterials = JSON.parse(localStorage.getItem('materials') || 'null');
    setMaterials(storedMaterials || initialMaterials);
    if (!storedMaterials) {
        localStorage.setItem('materials', JSON.stringify(initialMaterials));
    }

    const storedFeedback = JSON.parse(localStorage.getItem('user-feedback') || 'null');
    setFeedback(storedFeedback || initialFeedback);

    const storedSocialLinks = JSON.parse(localStorage.getItem('social-links') || 'null');
    setSocialLinks(storedSocialLinks || initialSocialLinks);
  }, []);

  const saveSocialLinks = () => {
      localStorage.setItem('social-links', JSON.stringify(socialLinks));
      toast({ title: 'Success', description: 'Social links updated successfully.' });
  }

  const handleSocialLinkChange = (id: SocialLink['id'], url: string) => {
      setSocialLinks(prev => prev.map(link => link.id === id ? { ...link, url } : link));
  };
  
  const deleteFeedback = (id: string) => {
      const updatedFeedback = feedback.filter(fb => fb.id !== id);
      setFeedback(updatedFeedback);
      localStorage.setItem('user-feedback', JSON.stringify(updatedFeedback));
      toast({ title: 'Feedback Deleted', description: 'The feedback item has been removed.' });
  }
  
  const deleteMaterial = (id: string) => {
      const updatedMaterials = materials.filter(m => m.id !== id);
      setMaterials(updatedMaterials);
      localStorage.setItem('materials', JSON.stringify(updatedMaterials));
      toast({ title: 'Material Deleted' });
  }

  if (!isClient) {
      return null;
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
                                    <AlertDialogAction onClick={() => deleteMaterial(material.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              {feedback.length > 0 ? feedback.map(fb => (
                <Card key={fb.id}>
                  <CardContent className="p-4 flex justify-between items-start">
                    <div>
                      <p className="text-sm">{fb.text}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(fb.createdAt).toLocaleString()}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the feedback.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteFeedback(fb.id)}>Delete</AlertDialogAction>
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
              {socialLinks.map(link => (
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
                <Button onClick={saveSocialLinks}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
