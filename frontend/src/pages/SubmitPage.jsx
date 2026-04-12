import SubmitForm from '../components/Complaint/SubmitForm'
import { motion } from 'framer-motion'

export default function SubmitPage() {
  return (
    <div className="flex flex-col gap-10 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-black text-primary tracking-tight mb-4">
          Report a <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Civic Incident</span>
        </h1>
        <p className="text-text-muted font-medium max-w-xl mx-auto">
          Our Precision AI analyzes your submission in real-time to ensure rapid response and accurate departmental routing.
        </p>
      </motion.div>

      {/* AI processing flow visualization */}
      <div className="flex flex-wrap justify-center items-center gap-3 px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100">
        {[
          { label: 'Intelligence.NLP', icon: '🧠' },
          { label: 'Vision.OCR', icon: '🖼️' },
          { label: 'Hybrid Verify', icon: '🔀' },
          { label: 'City Hall Dispatch', icon: '🏢' }
        ].map((step, i) => (
          <div key={step.label} className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-soft rounded-lg border border-gray-100">
              <span className="text-xs">{step.icon}</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{step.label}</span>
            </div>
            {i < 3 && <span className="text-gray-300 font-light">→</span>}
          </div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <SubmitForm />
      </motion.div>
    </div>
  )
}
