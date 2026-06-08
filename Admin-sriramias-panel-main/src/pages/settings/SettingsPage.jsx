import { useState } from 'react'
import { Settings } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import { useAuth } from '../../contexts/AuthContext'

export default function SettingsPage({ title = 'Settings', section = 'general' }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    notifications: true,
    emailDigest: false,
  })

  const handleSave = (e) => {
    e.preventDefault()
    toast.success('Settings saved successfully')
  }

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-3xl space-y-6">
        <PageBanner icon={Settings} title={title} />

        <form onSubmit={handleSave} className="space-y-5">
          {(section === 'profile' || section === 'general') && (
            <div className="rounded-2xl bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-7">
              <h3 className="mb-5 bg-gradient-to-r from-[#1fa2ff] to-[#ef8b8b] bg-clip-text text-lg font-black uppercase tracking-wide text-transparent">
                Profile Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#333]">
                    Full name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-11 w-full rounded-lg bg-[#eef2fc] px-4 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7] sm:text-base"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#333]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-11 w-full rounded-lg bg-[#eef2fc] px-4 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7] sm:text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {(section === 'notifications' || section === 'general') && (
            <div className="rounded-2xl bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-7">
              <h3 className="mb-5 bg-gradient-to-r from-[#1fa2ff] to-[#ef8b8b] bg-clip-text text-lg font-black uppercase tracking-wide text-transparent">
                Notifications
              </h3>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-[#dff4ff] p-4">
                  <span className="text-sm font-semibold text-[#222]">Push notifications</span>
                  <input
                    type="checkbox"
                    checked={form.notifications}
                    onChange={(e) =>
                      setForm({ ...form, notifications: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#246392]"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-[#eef8eb] p-4">
                  <span className="text-sm font-semibold text-[#222]">Weekly email digest</span>
                  <input
                    type="checkbox"
                    checked={form.emailDigest}
                    onChange={(e) =>
                      setForm({ ...form, emailDigest: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#246392]"
                  />
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="h-11 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-8 text-sm font-bold text-white shadow-[0_5px_13px_rgba(36,99,146,0.3)] transition hover:opacity-95 sm:text-base"
          >
            Save changes
          </button>
        </form>
      </section>
    </div>
  )
}
