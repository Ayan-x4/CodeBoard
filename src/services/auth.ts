export interface User { id: string; name: string; email: string; avatarUrl?: string }
export interface AuthProvider {
  currentUser(): Promise<User | null>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;
}
