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
      const take = 5;
      const skip = ((input || 1) - 1) * take;

      return ctx.prisma.movement.findMany({
        where: { userId: ctx.session.user.id },
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
});
