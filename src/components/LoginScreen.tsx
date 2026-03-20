import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, User, Mail, Lock as LockIcon, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

type AuthMode = 'login' | 'signup' | 'reset';

export function LoginScreen() {
  const { signIn, signInWithGithub, signInAsGuest, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email) {
      setError('O email é obrigatório.');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido.');
      return;
    }

    try {
      setLoading(true);
      
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('O nome é obrigatório.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('As senhas não coincidem.');
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, name);
      } else if (mode === 'login') {
        if (!password) {
          setError('A senha é obrigatória.');
          setLoading(false);
          return;
        }
        await signInWithEmail(email, password);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email ou senha incorretos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      setLoading(true);
      await signIn();
    } catch (err: any) {
      console.error(err);
      setError('Falha no login com Google. Tente novamente ou entre como visitante.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError('');
    try {
      setLoading(true);
      await signInWithGithub();
    } catch (err: any) {
      console.error(err);
      setError('Falha no login com GitHub. Verifique se sua conta está configurada ou entre como visitante.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError('');
    try {
      setLoading(true);
      await signInAsGuest();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao entrar como visitante. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 blueprint-grid relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-neon/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-neon/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface-1 border border-white/5 rounded-2xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-neon/10 border border-green-neon/20 rounded-2xl flex items-center justify-center mb-4">
            <Zap className="w-10 h-10 text-green-neon" />
          </div>
          <p className="text-gray-400 text-sm font-medium mt-2">
            {mode === 'login' && 'Command Center Login'}
            {mode === 'signup' && 'Create Your Designer ID'}
            {mode === 'reset' && 'Reset Access Code'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </motion.div>
        )}

        {message && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-green-neon/10 border border-green-neon/20 rounded-xl flex items-start gap-3 text-green-neon text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{message}</p>
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-neon focus:ring-1 focus:ring-green-neon/20 transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-neon focus:ring-1 focus:ring-green-neon/20 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Access Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => { setMode('reset'); setError(''); setMessage(''); }}
                    className="text-[10px] font-bold text-green-neon uppercase tracking-widest hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <LockIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-neon focus:ring-1 focus:ring-green-neon/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative">
                <LockIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-neon focus:ring-1 focus:ring-green-neon/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-neon hover:bg-green-neon/90 text-black font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="uppercase tracking-widest">
                  {mode === 'login' && 'Initialize System'}
                  {mode === 'signup' && 'Create Designer ID'}
                  {mode === 'reset' && 'Send Recovery Code'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {mode !== 'reset' && (
          <>
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink-0 mx-4 text-gray-600 text-[10px] font-bold uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="uppercase tracking-widest">Google</span>
            </button>

            <button
              onClick={handleGithubSignIn}
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] mt-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span className="uppercase tracking-widest">GitHub</span>
            </button>

            <button
              onClick={handleGuestSignIn}
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] mt-2"
            >
              <User className="w-5 h-5" />
              <span className="uppercase tracking-widest">Entrar como visitante</span>
            </button>
          </>
        )}

        <div className="mt-8 text-center">
          {mode === 'login' ? (
            <p className="text-sm text-gray-500">
              New to the ecosystem?{' '}
              <button onClick={() => { setMode('signup'); setError(''); setMessage(''); }} className="text-green-neon font-bold hover:underline">
                Register Now
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Already have an ID?{' '}
              <button onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-green-neon font-bold hover:underline">
                Initialize Login
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
