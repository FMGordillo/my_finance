import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const movementRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        description: z.string(),
      })
    )
    .mutation(({ input, ctx }) => {
      return ctx.prisma.movement.create({
        data: {
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          ...input,
        },
      });
    }),

  getBalance: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.movement.aggregate({
      _sum: {
        amount: true,
      },
      where: { userId: ctx.session.user.id },
    });
  }),

  get: protectedProcedure
    .input(z.number().optional())
    .query(({ input, ctx }) => {
      const page = (input || 1) * 5;
      return ctx.prisma.movement.findMany({
        where: { userId: ctx.session.user.id },
        take: page,
        skip: page - 1,
      });
    }),
});
