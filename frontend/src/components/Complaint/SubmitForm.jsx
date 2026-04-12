import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useGeoLocation } from '../../hooks/useGeoLocation'
import LocationPicker from '../Map/LocationPicker'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  { id: 'describe', title: 'Describe', icon: '📝' },
  { id: 'upload',   title: 'Upload',   icon: '📸' },
  { id: 'location', title: 'Location', icon: '📍' },
  { id: 'submit',   title: 'Submit',   icon: '🚀' },
]

export default function SubmitForm() {
  const navigate = useNavigate()
  const { location: gpsLocation, loading: gpsLoading } = useGeoLocation()

  const [currentStep, setCurrentStep] = useState(0)
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [pinLocation, setPinLocation] = useState(null)
  const [useGPS, setUseGPS] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const activeLocation = useGPS ? gpsLocation : pinLocation

  const onDrop = useCallback(files => {
    const f = files[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
    setCurrentStep(2) // Auto-advance to location
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }, maxFiles: 1,
  })

  const removeImage = () => { setImageFile(null); setImagePreview(null) }

  const handleNext = () => {
    if (currentStep === 0 && !description.trim()) { toast.error('Please describe the issue'); return }
    if (currentStep === 2 && !activeLocation) { toast.error('Location is required'); return }
    setCurrentStep(s => s + 1)
  }

  const handleBack = () => setCurrentStep(s => s - 1)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!activeLocation) { toast.error('Location is required'); return }

    setSubmitting(true)
    const fd = new FormData()
    fd.append('description', description)
    fd.append('lat', activeLocation.lat)
    fd.append('lng', activeLocation.lng)
    fd.append('areaName', activeLocation.areaName || pinLocation?.areaName || '')
    if (imageFile) fd.append('image', imageFile)

    try {
      const { data } = await api.post('/complaints', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      toast.success('Complaint submitted successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const paneVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  if (result) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto glass-card flex flex-col items-center text-center p-12 rounded-[40px] shadow-premium"
      >
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-8 ${result.mismatch ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
          {result.mismatch ? '⚠️' : '🎉'}
        </div>
        <h2 className="text-3xl font-black text-primary mb-4 tracking-tight">
          {result.mismatch ? 'Filed — Needs Review' : 'Filed Successfully!'}
        </h2>
        {result.mismatch ? (
          <p className="text-text-muted font-medium mb-10 leading-relaxed">Our AI detected a mismatch between the text and image. Our team will verify it shortly to ensure accuracy.</p>
        ) : (
          <p className="text-text-muted font-medium mb-10 leading-relaxed">Your complaint has been categorised as <span className="text-primary font-black uppercase tracking-tighter text-sm px-2 py-0.5 bg-gray-50 rounded italic">{result.finalCategory}</span> and routed to the <span className="font-bold text-primary">{result.department}</span> department.</p>
        )}
        
        <div className="w-full flex gap-4 p-6 bg-surface rounded-3xl mb-12 border border-gray-100">
          <div className="flex-1 text-left border-r border-gray-100 pr-6">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">NLP AI Category</span>
            <span className="font-bold text-primary">{result.nlpCategory}</span>
          </div>
          <div className="flex-1 text-left pl-6">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Image AI Category</span>
            <span className="font-bold text-primary">{result.imageCategory}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button className="flex-1 btn-primary py-4" onClick={() => { setResult(null); setCurrentStep(0); setDescription(''); setImageFile(null); setImagePreview(null) }}>
            + File Another Report
          </button>
          <button className="flex-1 btn-ghost py-4" onClick={() => navigate('/dashboard')}>
            View My Dashboard
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-10">
      {/* Minimal Step Indicator */}
      <div className="flex items-center justify-between px-10 relative">
        <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
        {STEPS.map((step, idx) => {
          const active = idx <= currentStep
          const completed = idx < currentStep
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
              <motion.div 
                animate={{ 
                  backgroundColor: active ? '#1e2a38' : '#fff',
                  scale: active ? 1.1 : 1,
                  boxShadow: active ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none'
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-colors duration-500 ${active ? 'border-primary text-white' : 'border-gray-100 text-text-muted'}`}
              >
                {completed ? '✓' : idx + 1}
              </motion.div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-primary' : 'text-text-muted'}`}>
                {step.title}
              </span>
            </div>
          )
        })}
      </div>

      <div className="glass-card p-10 rounded-[40px] shadow-premium overflow-hidden min-h-[500px] flex flex-col">
        <AnimatePresence mode="wait">
          {/* Step 1: Describe */}
          {currentStep === 0 && (
            <motion.div 
              key="step0"
              variants={paneVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-grow flex flex-col"
            >
              <h3 className="text-2xl font-black text-primary mb-2 tracking-tight">Describe the Issue</h3>
              <p className="text-text-muted font-medium mb-8">Provide clear details about the civic problem you noticed.</p>
              <textarea
                className="input-saas flex-grow min-h-[200px] resize-none p-6 text-lg"
                placeholder="e.g. Large pothole on Vijayanagar 3rd stage main road, causing traffic disruption..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <div className="mt-10 flex justify-end">
                <button className="btn-primary px-10 py-4 shadow-xl shadow-primary/10" onClick={handleNext}>
                  Next: Upload Photo <span className="ml-2 font-light">→</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Upload */}
          {currentStep === 1 && (
            <motion.div 
              key="step1"
              variants={paneVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-grow flex flex-col"
            >
              <h3 className="text-2xl font-black text-primary mb-2 tracking-tight">Visual Evidence</h3>
              <p className="text-text-muted font-medium mb-8">Photos help our AI categorize and verify reports faster.</p>
              
              <div className="flex-grow flex flex-col">
                {!imagePreview ? (
                  <div 
                    {...getRootProps()} 
                    className={`flex-grow border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-12 transition-all cursor-pointer group ${isDragActive ? 'border-accent bg-accent/5 ring-4 ring-accent/10' : 'border-gray-100 hover:border-accent hover:bg-accent/5'}`}
                  >
                    <input {...getInputProps()} />
                    <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">
                      📸
                    </div>
                    <p className="text-lg font-bold text-primary mb-2 group-hover:text-accent transition-colors">Drag & drop or Click to browse</p>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">JPG, PNG, WEBP — Max 5MB</span>
                  </div>
                ) : (
                  <div className="flex-grow relative rounded-3xl overflow-hidden group shadow-soft">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover min-h-[300px]" />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button className="btn-danger bg-danger text-white px-6 py-2 rounded-xl font-bold shadow-xl" onClick={removeImage}>✕ Remove Photo</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 flex justify-between items-center">
                <button className="btn-ghost px-8 py-4" onClick={handleBack}>Back</button>
                <div className="flex items-center gap-4">
                  <button className="text-sm font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors pr-4" onClick={() => setCurrentStep(2)}>Skip for now</button>
                  <button className="btn-primary px-10 py-4 shadow-xl shadow-primary/10" onClick={handleNext}>
                    Next: Location <span className="ml-2 font-light">→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Location */}
          {currentStep === 2 && (
            <motion.div 
              key="step2"
              variants={paneVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-grow flex flex-col"
            >
              <h3 className="text-2xl font-black text-primary mb-2 tracking-tight">Pin Location</h3>
              <p className="text-text-muted font-medium mb-8">Where exactly should authorities be dispatched?</p>
              
              <div className="flex p-1.5 bg-gray-100 rounded-2xl self-start mb-8">
                <button 
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${useGPS ? 'bg-white shadow-soft text-primary' : 'text-text-muted hover:text-primary'}`}
                  onClick={() => setUseGPS(true)}
                >
                  📡 GPS Active
                </button>
                <button 
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!useGPS ? 'bg-white shadow-soft text-primary' : 'text-text-muted hover:text-primary'}`}
                  onClick={() => setUseGPS(false)}
                >
                  🗺️ Pick on Map
                </button>
              </div>

              <div className="flex-grow rounded-3xl overflow-hidden relative border border-gray-50 min-h-[300px] shadow-sm">
                {useGPS ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-surface">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-soft ${gpsLoading ? 'bg-accent/10' : gpsLocation ? 'bg-success/10 text-success animate-pulse' : 'bg-danger/10 text-danger'}`}>
                      {gpsLoading ? <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" /> : gpsLocation ? '📍' : '⚠️'}
                    </div>
                    <div className="text-center">
                      <p className="font-black text-primary uppercase tracking-widest text-sm mb-1">
                        {gpsLoading ? 'Intercepting GPS Signals...' : gpsLocation ? 'Precision Locked' : 'Signals Lost'}
                      </p>
                      <p className="text-xs font-bold text-text-muted">
                        {gpsLocation ? gpsLocation.areaName || 'Secure Lat/Lng obtained' : 'Enable browser location or use manual map.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0">
                    <LocationPicker value={pinLocation} onChange={loc => setPinLocation(loc)} />
                  </div>
                )}
              </div>

              <div className="mt-10 flex justify-between">
                <button className="btn-ghost px-8 py-4" onClick={handleBack}>Back</button>
                <button 
                  className="btn-primary px-10 py-4 shadow-xl shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={handleNext}
                  disabled={!activeLocation}
                >
                  Review Details <span className="ml-2 font-light">→</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Final Review & Submit */}
          {currentStep === 3 && (
            <motion.div 
              key="step3"
              variants={paneVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-grow flex flex-col"
            >
              <h3 className="text-2xl font-black text-primary mb-2 tracking-tight">Final verification</h3>
              <p className="text-text-muted font-medium mb-8">Please confirm the report details are accurate before dispatching.</p>
              
              <div className="flex-grow flex flex-col gap-4">
                <div className="bg-surface p-8 rounded-3xl border border-gray-100 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Description</span>
                    <p className="text-lg font-bold text-primary leading-tight pl-1 italic">"{description}"</p>
                  </div>
                  <div className="flex gap-10">
                    <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Evidence</span>
                       <div className="font-extrabold text-sm flex items-center gap-2 pl-1">
                         {imageFile ? <span className="text-success">✅ High Fidelity Photo Attached</span> : <span className="text-text-muted opacity-50">❌ No Visual Evidence</span>}
                       </div>
                    </div>
                    <div className="flex flex-col gap-2">
                       <span className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1">Designated Area</span>
                       <div className="font-extrabold text-sm flex items-center gap-2 pl-1">
                         <span className="text-accent">📍 {activeLocation?.areaName || 'Geocoded Coordinates'}</span>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-accent/5 rounded-2xl flex items-start gap-4 border border-accent/10">
                   <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-xs text-accent mt-0.5">ℹ️</div>
                   <p className="text-xs font-bold text-accent/80 leading-relaxed italic">By submitting, your report will be analyzed by our Precision AI and routed to the corresponding department in under 5 minutes.</p>
                </div>
              </div>

              <div className="mt-10 flex justify-between">
                <button className="btn-ghost px-8 py-4" onClick={handleBack} disabled={submitting}>Change Details</button>
                <button 
                  className="btn-primary px-10 py-4 shadow-xl shadow-primary/20 flex items-center gap-3 group relative overflow-hidden" 
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  <span className="relative z-10">{submitting ? 'Dispatching...' : 'Dispatch Report'}</span>
                  <span className="text-xl relative z-10 group-hover:translate-x-1 transition-transform">🚀</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-white/10 to-accent/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
