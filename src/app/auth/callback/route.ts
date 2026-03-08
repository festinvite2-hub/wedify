import { handleAuthConfirmation } from '@/lib/auth-confirm';

export async function GET(request: Request) {
  return handleAuthConfirmation(request);
}
