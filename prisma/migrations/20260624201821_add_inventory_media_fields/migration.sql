-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "images" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "specs" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN "tags" TEXT;

-- AlterTable
ALTER TABLE "pools" ADD COLUMN "executionQueue" TEXT;
ALTER TABLE "pools" ADD COLUMN "insuranceAllocation" INTEGER;
ALTER TABLE "pools" ADD COLUMN "surplus" INTEGER;
