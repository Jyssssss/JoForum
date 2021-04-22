import DataLoader from "dataloader";
import { Upvote } from "../entities/Upvote";

export const createUpvoteLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Upvote | null>(
    async (keys) => {
      const upvotes = await Upvote.findByIds(keys as any);
      const idsToUpvote: Record<string, Upvote> = {};
      upvotes.forEach((u) => {
        idsToUpvote[`${u.userId}-${u.postId}`] = u;
      });
      return keys.map((key) => idsToUpvote[`${key.userId}-${key.postId}`]);
    }
  );
