import { useState } from 'react'
import { motion } from 'framer-motion'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import 'keen-slider/keen-slider.min.css'
import { useKeenSlider } from 'keen-slider/react'

const costPerLead = 250
const minAmount = 5000
const maxAmount = 100000

// Demo banners (real URLs)
const demoBanners = [
  'https://images.unsplash.com/photo-1626791761864-3f6d2e993c73?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1589278013386-3d5f7e6f8144?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573166364684-824a0e04b2be?auto=format&fit=crop&w=600&q=80',
]

// Default fallback if image fails
const fallbackImage =
  'https://via.placeholder.com/400x300.png?text=Ad+Banner+Not+Available'

const MetaCampaign = () => {
  const [amount, setAmount] = useState(10000)
  const [leads, setLeads] = useState(Math.floor(amount / costPerLead))

  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView: 3, spacing: 16 },
    breakpoints: {
      '(max-width: 1024px)': { slides: { perView: 2, spacing: 12 } },
      '(max-width: 640px)': { slides: { perView: 1, spacing: 8 } },
    },
    dragSpeed: 1.5,
    mode: 'snap',
    created: (slider) => {
      setInterval(() => slider.next(), 8000)
    },
  })

  const handleAmountChange = (val: number | number[]) => {
    const value = Array.isArray(val) ? val[0] : val
    setAmount(value)
    setLeads(Math.floor(value / costPerLead))
  }

  const handleLeadInputChange = (val: string) => {
    const leadsVal = parseInt(val) || 0
    setLeads(leadsVal)
    const newAmount = Math.max(minAmount, Math.min(leadsVal * costPerLead, maxAmount))
    setAmount(newAmount)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      {/* Budget Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">💰 Select Your Budget</h2>
        <div className="text-center text-2xl font-bold text-blue-600">
          ₹{amount.toLocaleString()}
        </div>
        <Slider
          min={minAmount}
          max={maxAmount}
          step={500}
          value={amount}
          onChange={handleAmountChange}
          trackStyle={{ backgroundColor: '#3b82f6', height: 8 }}
          handleStyle={{ borderColor: '#3b82f6', height: 24, width: 24 }}
          railStyle={{ height: 8 }}
        />
      </section>

      {/* Leads Section */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">🎯 Estimated Leads</h2>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min={1}
            value={leads}
            onChange={(e) => handleLeadInputChange(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-40 text-center text-lg font-semibold"
          />
        </div>
      </section>

      {/* Banner Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">📢 Lead Magnet Banners</h2>
        <div ref={sliderRef} className="keen-slider cursor-grab active:cursor-grabbing">
          {(demoBanners.length > 0 ? demoBanners : [fallbackImage]).map((url, idx) => (
            <div
              key={idx}
              className="keen-slider__slide bg-white rounded shadow border flex justify-center items-center p-2 min-w-[300px]"
            >
              <img
                src={url}
                alt={`Banner ${idx + 1}`}
                className="object-cover h-[300px] w-full rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = fallbackImage
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Button */}
      <section className="text-center pt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition"
        >
          🚀 Launch Meta Campaign ({leads} Leads / ₹{amount.toLocaleString()})
        </motion.button>
      </section>
    </div>
  )
}

export default MetaCampaign
