
"use client";

import * as React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Material, Feedback, BugReport, SocialLink } from '@/types';
import { FilePenLine, Trash2, Facebook, Twitter, Linkedin, Loader2, PlusCircle, BarChart2, Bug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMaterials, deleteMaterial, addMaterial, updateMaterial, getFeedback, deleteFeedback, getSocialLinks, updateSocialLinks, getBugReports, deleteBugReport } from '@/services/firestore';
import { storage } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartConfig } from '@/components/ui/chart';

const materialSchema = z.object({
    title: z.string().min(1, "Title is required"),
    course: z.string().min(1, "Course is required"),
    faculty: z.string().min(1, "Faculty is required"),
    program: z.string().min(1, "Program is required"),
    lecturer: z.string().min(1, "Lecturer name is required"),
    year: z.coerce.number().min(1, "Year is required"),
    semester: z.coerce.number().min(1, "Semester is required"),
    type: z.enum(['Lecture Slides', 'Past Papers', 'Memos', 'Tutorials', 'Lab Manuals']),
    file: z.any().refine(val => val?.length > 0, "File is required."),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

const faculties: Material['faculty'][] = ['Engineering', 'Humanities', 'Management Sciences', 'ICT', 'Economics & Finance'];
const materialTypes: Material['type'][] = ['Lecture Slides', 'Past Papers', 'Memos', 'Tutorials', 'Lab Manuals'];

const chartConfig = {
  downloads: {
    label: "Downloads",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const LoadingSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
    </div>
)

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [feedback, setFeedback] = React.useState<Feedback[]>([]);
  const [bugReports, setBugReports] = React.useState<BugReport[]>([]);
  const [socialLinks, setSocialLinks] = React.useState<SocialLink[]>([]);
  const [loading, setLoading] = React.useState({ materials: true, feedback: true, bugs: true, social: true });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] = React.useState<Material | null>(null);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: { title: '', course: '', faculty: 'Engineering', program: '', lecturer: '', year: 1, semester: 1, type: 'Lecture Slides' },
  });

  const fetchAllData = React.useCallback(async () => {
    setLoading({ materials: true, feedback: true, bugs: true, social: true });
    const [materialsData, feedbackData, bugReportsData, socialLinksData] = await Promise.all([
        getMaterials(),
        getFeedback(),
        getBugReports(),
        getSocialLinks(),
    ]);
    
    setMaterials(materialsData);
    setFeedback(feedbackData);
    setBugReports(bugReportsData);

    const defaultLinks: SocialLink[] = [ { id: 'facebook', name: 'Facebook', url: '' }, { id: 'twitter', name: 'Twitter', url: '' }, { id: 'linkedin', name: 'LinkedIn', url: '' } ];
    const mergedLinks = defaultLinks.map(defaultLink => socialLinksData.find(dbLink => dbLink.id === defaultLink.id) || defaultLink);
    setSocialLinks(mergedLinks);
    
    setLoading({ materials: false, feedback: false, bugs: false, social: false });
  }, []);

  React.useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  React.useEffect(() => {
    if (isFormOpen) {
      if (editingMaterial) {
        form.reset({...editingMaterial, file: undefined });
      } else {
        form.reset({ title: '', course: '', faculty: 'Engineering', program: '', lecturer: '', year: 1, semester: 1, type: 'Lecture Slides', file: undefined });
      }
    }
  }, [editingMaterial, isFormOpen, form]);


  const handleMaterialSubmit = async (values: MaterialFormValues) => {
    setIsSaving(true);
    try {
      if (editingMaterial) {
        const { file: _file, ...finalData } = values;
        const materialUpdate: Partial<Omit<Material, "id">> = { ...finalData };
        let downloadURL = editingMaterial.url;
        let fileName = editingMaterial.fileName;

        if (values.file?.length > 0) {
          const file = values.file[0];
          const storageRef = ref(storage, `materials/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          downloadURL = await getDownloadURL(snapshot.ref);
          fileName = file.name;
        }

        await updateMaterial(editingMaterial.id, { ...materialUpdate, url: downloadURL, fileName });
        toast({ title: "Success", description: "Material updated successfully." });

      } else {
        if (!values.file || values.file.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: "File is required." });
            setIsSaving(false);
            return;
        }

        const { file: _file, ...finalData } = values;
        for (const file of values.file) {
          const storageRef = ref(storage, `materials/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);
          const title = values.title.trim() && values.file.length === 1 ? values.title : file.name.replace(/\.[^/.]+$/, "");
          
          await addMaterial({ ...finalData, title, url: downloadURL, fileName: file.name });
        }
        toast({ title: "Success", description: `${values.file.length} material(s) added successfully.` });
      }

      setIsFormOpen(false);
      setEditingMaterial(null);
      fetchAllData();
    } catch (error) {
      console.error("Error saving material:", error);
      toast({ variant: 'destructive', title: 'Error', description: "Failed to save material. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (material: Material) => { setEditingMaterial(material); setIsFormOpen(true); }
  const handleAddNewClick = () => { setEditingMaterial(null); setIsFormOpen(true); }

  const handleDelete = async (id: string, type: 'material' | 'feedback' | 'bug') => {
      try {
          if (type === 'material') {
              await deleteMaterial(id);
              setMaterials(prev => prev.filter(m => m.id !== id));
              toast({ title: 'Material Deleted' });
          } else if (type === 'feedback') {
              await deleteFeedback(id);
              setFeedback(prev => prev.filter(fb => fb.id !== id));
              toast({ title: 'Feedback Deleted' });
          } else if (type === 'bug') {
              await deleteBugReport(id);
              setBugReports(prev => prev.filter(br => br.id !== id));
              toast({ title: 'Bug Report Deleted' });
          }
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: `Failed to delete ${type}.` });
      }
  }

  const saveSocialLinks = async () => {
      setIsSaving(true);
      try {
        await updateSocialLinks(socialLinks);
        toast({ title: 'Success', description: 'Social links updated successfully.' });
      } catch (error) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to update social links.' }); } 
      finally { setIsSaving(false); }
  }

  const handleSocialLinkChange = (id: SocialLink['id'], url: string) => {
      setSocialLinks(prev => prev.map(link => link.id === id ? { ...link, url } : link));
  };
  
  const analyticsData = React.useMemo(() => {
    if (loading.materials) return [];
    const dataByFaculty = materials.reduce((acc, material) => {
      const faculty = material.faculty;
      if (!acc[faculty]) {
        acc[faculty] = 0;
      }
      acc[faculty] += material.downloads || 0;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(dataByFaculty).map(([name, downloads]) => ({ name, downloads }));
  }, [materials, loading.materials]);


  return (
    <div className="container mx-auto py-4">
      <Tabs defaultValue="materials">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics"><BarChart2 className="mr-2 h-4 w-4" />Analytics</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="bugs"><Bug className="mr-2 h-4 w-4"/>Bug Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
            <Card>
                <CardHeader>
                    <CardTitle>Platform Analytics</CardTitle>
                    <CardDescription>Insights into platform usage and user engagement.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading.materials ? <LoadingSkeleton /> : (
                         <Card>
                            <CardHeader>
                                <CardTitle>Material Downloads by Faculty</CardTitle>
                            </CardHeader>
                            <CardContent className="h-96">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                                        <YAxis />
                                        <Legend />
                                        <Bar dataKey="downloads" fill="hsl(var(--primary))" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
                <div className="flex justify-between items-center"><CardTitle>Course Materials</CardTitle><Button onClick={handleAddNewClick}><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button></div>
                <CardDescription>Manage the course materials available in the app.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading.materials ? <LoadingSkeleton /> : (
                   <Table>
                       <TableHeader>
                           <TableRow>
                               <TableHead>Title</TableHead>
                               <TableHead>Course</TableHead>
                               <TableHead>Lecturer</TableHead>
                               <TableHead>Type</TableHead>
                               <TableHead>Downloads</TableHead>
                               <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                    <TableBody>
                      {materials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.title}</TableCell>
                          <TableCell>{material.course}</TableCell>
                          <TableCell>{material.lecturer}</TableCell>
                          <TableCell><Badge variant="secondary">{material.type}</Badge></TableCell>
                          <TableCell>{material.downloads}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(material)}><FilePenLine className="h-4 w-4" /></Button>
                              <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the material.</AlertDialogDescription></AlertDialogHeader>
                                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(material.id, 'material')}>Delete</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody></Table>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card><CardHeader><CardTitle>User Feedback</CardTitle><CardDescription>Here's what users are saying about the platform.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {loading.feedback ? <LoadingSkeleton /> : feedback.length > 0 ? feedback.map(fb => (<Card key={fb.id}><CardContent className="p-4 flex justify-between items-start"><div><p className="text-sm">{fb.text}</p><p className="text-xs text-muted-foreground mt-2">{fb.createdAt?.toLocaleString()}</p></div><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the feedback.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(fb.id, 'feedback')}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardContent></Card>)) : (<p className="text-center text-muted-foreground p-8">No feedback submitted yet.</p>)}
            </CardContent></Card>
        </TabsContent>

         <TabsContent value="bugs">
          <Card><CardHeader><CardTitle>Bug Reports</CardTitle><CardDescription>User-submitted issues and bug reports.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {loading.bugs ? <LoadingSkeleton /> : bugReports.length > 0 ? bugReports.map(br => (<Card key={br.id}><CardContent className="p-4 flex justify-between items-start"><div><p className="text-sm">{br.text}</p><p className="text-xs text-muted-foreground mt-2">{br.createdAt?.toLocaleString()}</p></div><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the report.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(br.id, 'bug')}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardContent></Card>)) : (<p className="text-center text-muted-foreground p-8">No bug reports submitted yet.</p>)}
            </CardContent></Card>
        </TabsContent>
        
        <TabsContent value="social">
          <Card><CardHeader><CardTitle>Social Media Links</CardTitle><CardDescription>Manage the social media links displayed in the app footer.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {loading.social ? <LoadingSkeleton /> : socialLinks.map(link => (<div key={link.id} className="flex items-center gap-4"><Label htmlFor={link.id} className="w-24 flex items-center gap-2 capitalize">{link.id === 'facebook' && <Facebook />}{link.id === 'twitter' && <Twitter />}{link.id === 'linkedin' && <Linkedin />}{link.name}</Label><Input id={link.id} value={link.url} onChange={(e) => handleSocialLinkChange(link.id, e.target.value)} /></div>))}
            </CardContent>
            <CardFooter className="flex justify-end"><Button onClick={saveSocialLinks} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button></CardFooter></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-xl">
              <DialogHeader><DialogTitle>{editingMaterial ? 'Edit Material' : 'Add New Material'}</DialogTitle></DialogHeader>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleMaterialSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title / Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="course" render={({ field }) => (<FormItem><FormLabel>Course Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="faculty" render={({ field }) => (<FormItem><FormLabel>Faculty</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a faculty" /></SelectTrigger></FormControl><SelectContent>{faculties.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="program" render={({ field }) => (<FormItem><FormLabel>Program</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="lecturer" render={({ field }) => (<FormItem><FormLabel>Lecturer</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent>{materialTypes.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="semester" render={({ field }) => (<FormItem><FormLabel>Semester</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <FormField
                        control={form.control}
                        name="file"
                        render={({ field: { onChange, value, ...rest } }) => (
                          <FormItem>
                            <FormLabel>Material File</FormLabel>
                            <FormControl><Input type="file" multiple={!editingMaterial} onChange={(e) => onChange(e.target.files)} {...rest} /></FormControl>
                            {editingMaterial && <p className="text-sm text-muted-foreground">Leave blank to keep current file. You can only upload one file when editing.</p>}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                          <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingMaterial ? 'Save Changes' : 'Add Material(s)'}</Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
