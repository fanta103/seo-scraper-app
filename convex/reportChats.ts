import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";

async function verifyReportAccess(
  ctx: QueryCtx | MutationCtx,
  snapshotId: string,
  userId: string,
) {
  const job = await ctx.db
    .query("scrapingJobs")
    .filter((q) =>
      q.and(
        q.eq(q.field("snapshotId"), snapshotId),
        q.eq(q.field("userId"), userId),
      ),
    )
    .first();

  if (!job) {
    throw new Error("Report not found or access denied");
  }
}

export const getMessages = query({
  args: {
    snapshotId: v.string(),
    userId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await verifyReportAccess(ctx, args.snapshotId, args.userId);

    const chat = await ctx.db
      .query("reportChats")
      .withIndex("by_user_and_snapshot", (q) =>
        q.eq("userId", args.userId).eq("snapshotId", args.snapshotId),
      )
      .first();

    return chat?.messages ?? [];
  },
});

export const saveMessages = mutation({
  args: {
    snapshotId: v.string(),
    userId: v.string(),
    messages: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await verifyReportAccess(ctx, args.snapshotId, args.userId);

    const existing = await ctx.db
      .query("reportChats")
      .withIndex("by_user_and_snapshot", (q) =>
        q.eq("userId", args.userId).eq("snapshotId", args.snapshotId),
      )
      .first();

    const updatedAt = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        messages: args.messages,
        updatedAt,
      });
    } else {
      await ctx.db.insert("reportChats", {
        snapshotId: args.snapshotId,
        userId: args.userId,
        messages: args.messages,
        updatedAt,
      });
    }

    return null;
  },
});
