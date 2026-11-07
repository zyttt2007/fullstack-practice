export interface Author {
  id: number;
  username: string;
  avatar: string;
  bio?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  summary: string;
  cover: string;
  category: string;
  tags: string[];
  authorId: number;
  author: Author;
  views: number;
  likesCount: number;
  commentsCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  readingMinutes: number;
  liked?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  postCount: number;
}

export interface Comment {
  id: number;
  postId: number;
  content: string;
  createdAt: string;
  author: Author;
}
