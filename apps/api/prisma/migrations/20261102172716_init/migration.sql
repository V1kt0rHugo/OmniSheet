-- CreateTable
CREATE TABLE "fichas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL DEFAULT '',
    "epiteto" TEXT NOT NULL DEFAULT '',
    "campanha" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Ativo',
    "classe" TEXT NOT NULL DEFAULT '',
    "ancestralidade" TEXT NOT NULL DEFAULT '',
    "nivel" TEXT NOT NULL DEFAULT '',
    "resumo" TEXT NOT NULL DEFAULT '',
    "aparencia" TEXT NOT NULL DEFAULT '',
    "personalidade" TEXT NOT NULL DEFAULT '',
    "historia" TEXT NOT NULL DEFAULT '',
    "atributos" JSONB NOT NULL DEFAULT '[]',
    "item" JSONB NOT NULL DEFAULT '{}',
    "imagem" TEXT,
    "foco" INTEGER NOT NULL DEFAULT 25,
    "cor" INTEGER NOT NULL DEFAULT 210,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_pkey" PRIMARY KEY ("id")
);
