DELETE FROM "JobFitAnalysis"
WHERE "rawJson"->>'source' = 'prisma/mock.ts'
   OR "rawJson"->>'version' = 'mock-seed-v1';
