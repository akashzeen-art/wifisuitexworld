import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import api from '../../../lib/api'

export default function AdminUsers() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    api.get('/admin/users')
      .then(r => setUsers(Array.isArray(r.data) ? r.data : (r.data.content ?? [])))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 py-2 text-sm" placeholder="Search users..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="badge-gray text-xs">{users.length} total</span>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="table-head">User</th>
                <th className="table-head">Role</th>
                <th className="table-head">Status</th>
                <th className="table-head">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="table-row"
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge text-xs ${u.role === 'ADMIN' ? 'badge-blue' : 'badge-gray'}`}>{u.role}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge text-xs ${u.active ? 'badge-green' : 'badge-red'}`}>
                      <div className={u.active ? 'status-dot-green' : 'status-dot-red'} />
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell text-xs text-slate-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
