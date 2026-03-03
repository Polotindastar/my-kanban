import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function App() {
  const [user] = useAuthState(auth);

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  return (
    <div className="p-8">
      {!user ? (
        <button onClick={login} className="bg-blue-500 text-white p-2 rounded">
          Přihlásit se přes Google
        </button>
      ) : (
        <>
          <h1>Vítej, {user.displayName}</h1>
          <button onClick={logout} className="text-red-500 underline">Odhlásit se</button>
          <TaskManager userId={user.uid} />
        </>
      )}
    </div>
  );
}