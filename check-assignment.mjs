import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAssignment() {
  const studentId = 'cmijhfb5e0001edoit135ak1r';
  const teacherId = 'cmiji3yqv0003edoiiruco77m';
  
  // Check if assignment exists
  const assignment = await prisma.studentTeacher.findFirst({
    where: {
      studentId,
      teacherId
    }
  });
  
  console.log('Student ID:', studentId);
  console.log('Teacher ID:', teacherId);
  console.log('Assignment exists:', !!assignment);
  
  if (!assignment) {
    console.log('\n❌ Teacher is NOT assigned to student');
    console.log('To fix this, assign the teacher to the student in the admin panel');
    console.log('Or run this command to assign them:');
    console.log(`\nnpx prisma db execute --stdin <<SQL
INSERT INTO student_teachers (id, "studentId", "teacherId", "assignedAt")
VALUES (gen_random_uuid(), '${studentId}', '${teacherId}', NOW())
ON CONFLICT ("studentId", "teacherId") DO NOTHING;
SQL`);
  } else {
    console.log('\n✅ Teacher IS assigned to student');
  }
  
  await prisma.$disconnect();
}

checkAssignment().catch(console.error);
