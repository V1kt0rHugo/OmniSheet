/*
  Warnings:

  - You are about to drop the column `ancestralidade` on the `fichas` table. All the data in the column will be lost.
  - You are about to drop the column `aparencia` on the `fichas` table. All the data in the column will be lost.
  - You are about to drop the column `atributos` on the `fichas` table. All the data in the column will be lost.
  - You are about to drop the column `classe` on the `fichas` table. All the data in the column will be lost.
  - You are about to drop the column `historia` on the `fichas` table. All the data in the column will be lost.
  - You are about to drop the column `nivel` on the `fichas` table. All the data in the column will be lost.
  - You are about to drop the column `personalidade` on the `fichas` table. All the data in the column will be lost.
  - Added the required column `sistemaId` to the `fichas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "fichas" DROP COLUMN "ancestralidade",
DROP COLUMN "aparencia",
DROP COLUMN "atributos",
DROP COLUMN "classe",
DROP COLUMN "historia",
DROP COLUMN "nivel",
DROP COLUMN "personalidade",
ADD COLUMN     "dados" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "sistemaId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "sistemas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "secoes" JSONB NOT NULL DEFAULT '[]',
    "builtin" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sistemas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fichas" ADD CONSTRAINT "fichas_sistemaId_fkey" FOREIGN KEY ("sistemaId") REFERENCES "sistemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
