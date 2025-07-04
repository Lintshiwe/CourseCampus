
export type Material = {
  id: string;
  title: string;
  course: string;
  faculty: 'Engineering' | 'Humanities' | 'Management Sciences' | 'ICT' | 'Economics & Finance' | string;
  program: string;
  year: number;
  semester: number;
  type: 'Lecture Slides' | 'Past Papers' | 'Memos' | 'Tutorials' | 'Lab Manuals';
  url: string;
  fileName: string;
  lecturer: string;
  uploadDate: any; 
  downloads: number;
  isAccessible: boolean;
};

export type Feedback = {
  id: string;
  text: string;
  createdAt: Date;
};

export type BugReport = {
  id: string;
  text: string;
  createdAt: Date;
};

export type SocialLink = {
  id: 'facebook' | 'twitter' | 'linkedin';
  name: string;
  url: string;
};
