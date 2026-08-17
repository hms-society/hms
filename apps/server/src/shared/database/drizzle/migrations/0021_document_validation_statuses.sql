ALTER TYPE "document_status" ADD VALUE IF NOT EXISTS 'not_linked';
ALTER TYPE "document_status" ADD VALUE IF NOT EXISTS 'not_corresponding';
ALTER TYPE "document_status" ADD VALUE IF NOT EXISTS 'resend_requested';
