export interface Author {
  id: number;
  username: string;
  avatar: string;
  bio?: string;
}

export interface Question {
  id: number;
  title: string;
  content: string;
  tags: string[];
  authorId: number;
  author: Author;
  views: number;
  answersCount: number;
  votes: number;
  isSolved: boolean;
  createdAt: string;
  updatedAt: string;
  myVote?: boolean;
}

export interface Answer {
  id: number;
  questionId: number;
  content: string;
  votes: number;
  isAccepted: boolean;
  authorId: number;
  author: Author;
  createdAt: string;
  myVote: boolean;
}

export interface Leader {
  id: number;
  username: string;
  avatar: string;
  bio: string;
  points: number;
  questionCount: number;
  answerCount: number;
  acceptedCount: number;
}
