'use client'
import { useTheme } from 'next-themes'
import { FiSun, FiMoon } from 'react-icons/fi'
import { useEffect, useState } from 'react'

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // ✅ يمنع مشاكل SSR ويضمن تحميل الزر بشكل صحيح

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-all"
    >
      {theme === 'dark' ? (
        <FiSun className="text-yellow-500" size={22} />
      ) : (
        <FiMoon className="text-gray-800" size={22} />
      )}
    </button>
  )
}

export default ThemeSwitcher
