import { prisma } from "@/lib/prisma";

export async function getTenantByStackAuthId(stackAuthId: string) {
  const tenantUser = await prisma.tenantUser.findFirst({
    where: {
      stackAuthId,
      isActive: true,
      deletedAt: null,
    },
    include: {
      tenant: true,
    },
  });

  return tenantUser ?? null;
}