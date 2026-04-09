/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Shield, ArrowRight, Sparkles, Mail, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        setSuccess('Account created! Please check your email for verification.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[40px] shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-4">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Blinkit Pro</h1>
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
              {isSignUp ? 'Create New Account' : 'Operational Intelligence Portal'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative overflow-hidden"
                  >
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-rose-400 text-xs font-bold uppercase tracking-widest text-center"
              >
                {error}
              </motion.p>
            )}

            {success && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-emerald-400 text-xs font-bold uppercase tracking-widest text-center"
              >
                {success}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 shadow-xl"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'} 
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="pt-6 border-t border-white/10 text-center space-y-4">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccess('');
              }}
              className="text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              {isSignUp ? (
                <>
                  <LogIn size={14} /> Already have an account? Sign In
                </>
              ) : (
                <>
                  <UserPlus size={14} /> New here? Create an account
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-zinc-500">
              <Sparkles size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Admin: admin@blinkit.com / admin123
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
