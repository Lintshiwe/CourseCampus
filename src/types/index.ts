export type Material = {
  id: string;
  title: string;
  course: string;
  faculty: string;
  program: string;
  year: number;
  semester: number;
  type: 'Document' | 'Slides' | 'Video';
  url: string;
};
