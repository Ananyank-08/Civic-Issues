import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AuthLayout from './AuthLayout'
import { motion } from 'framer-motion'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      })
      toast.success('Account created successfully! Please log in.')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
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
      title="Create Account"
      subtitle={{
        text: 'Already have an account?',
        link: '/login',
        linkText: 'Sign In'
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
          <label className="text-xs font-black text-primary uppercase tracking-widest pl-1">Full Name *</label>
          <input
            id="reg-name"
            name="name"
            type="text"
            className="input-saas"
            placeholder="Ravi Kumar"
            value={form.name}
            onChange={handleChange}
            required
          />
        </motion.div>

        <motion.div variants={fieldVariants} className="flex flex-col gap-2">
          <label className="text-xs font-black text-primary uppercase tracking-widest pl-1">Email Address *</label>
          <input
            id="reg-email"
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
          <label className="text-xs font-black text-primary uppercase tracking-widest pl-1">Password *</label>
          <input
            id="reg-password"
            name="password"
            type="password"
            className="input-saas"
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={handleChange}
            required
          />
        </motion.div>

        <motion.div variants={fieldVariants} className="flex flex-col gap-2">
          <label className="text-xs font-black text-primary uppercase tracking-widest pl-1">Confirm Password *</label>
          <input
            id="reg-confirm"
            name="confirm"
            type="password"
            className="input-saas"
            placeholder="Repeat your password"
            value={form.confirm}
            onChange={handleChange}
            required
          />
        </motion.div>

        <motion.button
          id="reg-submit"
          type="submit"
          disabled={loading}
          variants={fieldVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full py-4 text-base shadow-xl shadow-primary/20 relative overflow-hidden group"
        >
          <span className="relative z-10">{loading ? 'Creating account...' : 'Create Account'}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-white/10 to-accent/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </motion.button>
      </motion.form>
    </AuthLayout>
  )
}
