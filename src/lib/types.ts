export type Prayer = {
  id: string;
  name: string | null;
  body: string;
  category: string | null;
  prayedCount: number;
  answered: boolean;
  praise: string | null;
  createdAt: string;
  answeredAt: string | null;
};
