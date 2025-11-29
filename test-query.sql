SELECT 
  st.id,
  st."studentId",
  st."teacherId",
  s."userId" as student_user_id,
  t."userId" as teacher_user_id
FROM student_teachers st
JOIN students s ON s.id = st."studentId"
JOIN teachers t ON t.id = st."teacherId"
WHERE st."studentId" = 'cmijhfb5e0001edoit135ak1r'
  AND st."teacherId" = 'cmiji3yqv0003edoiiruco77m';
