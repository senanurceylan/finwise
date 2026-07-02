-- Bank statement RAG: documents and text chunks with embeddings

CREATE TABLE "statement_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" VARCHAR(255),
    "text_length" INTEGER NOT NULL,
    "chunk_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statement_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "statement_chunks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statement_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "statement_documents_user_id_idx" ON "statement_documents"("user_id");
CREATE INDEX "statement_chunks_user_id_idx" ON "statement_chunks"("user_id");
CREATE INDEX "statement_chunks_document_id_idx" ON "statement_chunks"("document_id");

ALTER TABLE "statement_documents" ADD CONSTRAINT "statement_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "statement_chunks" ADD CONSTRAINT "statement_chunks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "statement_chunks" ADD CONSTRAINT "statement_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "statement_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
