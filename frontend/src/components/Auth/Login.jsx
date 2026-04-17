import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../../store/authSlice'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AuthLayout from './AuthLayout'
import { motion } from 'framer-motion'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      dispatch(loginSuccess(data))
      toast.success(`Welcome back, ${data.name}!`)
      if (data.role === 'admin') navigate('/admin')
      else if (data.role === 'DEPARTMENT_STAFF') navigate('/department')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <AuthLayout
      title="Sign In"
      subtitle={{
        text: "New to Mysore Civic?",
        link: "/register",
        linkText: "Create an Account"
      }}
    >
      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 mb-6 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-bold"
        >
          {error}
        </motion.div>
      )}

      <motion.form 
        onSubmit={handleSubmit} 
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
        className="flex flex-col gap-6"
      >
        <motion.div variants={fieldVariants} className="flex flex-col gap-2">
          <label className="text-xs font-black text-primary uppercase tracking-widest pl-1">Email Address *</label>
          <input
            id="login-email"
            name="email"
            type="email"
            className="input-saas"
            placeholder="name@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </motion.div>

        <motion.div variants={fieldVariants} className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black text-primary uppercase tracking-widest">Password *</label>
            <a href="#" className="text-xs font-bold text-accent hover:underline">Forgot password?</a>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            className="input-saas"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
          />
        </motion.div>

        <motion.div variants={fieldVariants} className="flex items-center gap-3 pl-1">
          <input 
            type="checkbox" 
            id="keep-signed" 
            className="w-4 h-4 rounded border-gray-100 text-accent focus:ring-accent/30 transition-all cursor-pointer"
          />
          <label htmlFor="keep-signed" className="text-sm font-bold text-text-muted cursor-pointer">Keep me signed in</label>
        </motion.div>

        <motion.button 
          id="login-submit" 
          type="submit" 
          disabled={loading}
          variants={fieldVariants}
          whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
          className="btn-primary w-full py-4 text-base shadow-xl shadow-primary/20 relative overflow-hidden group"
        >
           <span className="relative z-10">{loading ? 'Signing in…' : 'Sign In'}</span>
           <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-white/10 to-accent/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </motion.button>

        <div className="relative py-2 flex items-center gap-4">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">Or Explore</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        <motion.button 
          type="button"
          variants={fieldVariants}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setForm({ email: 'admin@mysore.gov', password: 'admin123' });
            setTimeout(() => {
              const btn = document.getElementById('login-submit');
              if (btn) btn.click();
            }, 100);
          }}
          className="w-full py-4 rounded-[20px] border-2 border-primary/5 hover:border-accent/20 hover:bg-accent/5 text-primary font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3"
        >
           <span className="text-lg">👑</span> Try Demo Access (Admin)
        </motion.button>
      </motion.form>
    </AuthLayout>
  )
}
