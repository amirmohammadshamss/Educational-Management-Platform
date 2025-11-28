import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function HomePage() {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);

  if (session) {
    // Redirect authenticated users to their appropriate dashboard
    const role = session.user.role;
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      redirect('/admin/dashboard');
    } else if (role === 'TEACHER') {
      redirect('/teacher/dashboard');
    } else if (role === 'STUDENT') {
      redirect('/student/dashboard');
    }
  }

  // Redirect unauthenticated users to sign in
  redirect('/auth/signin');
}
