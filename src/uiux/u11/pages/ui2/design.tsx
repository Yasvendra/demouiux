import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import pageData from './data.json'

interface TabItem {
  id: string
  label?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  link?: string
}

interface TabsData {
  defaultActive?: string
  items?: TabItem[]
}

interface DesignPageData {
  tabs?: TabsData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

function SidebarArrow() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

function OverlayArrow() {
  return (
    <svg
      className="h-10 w-10 sm:h-12 sm:w-12"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  )
}

function TabContent({ item }: { item: TabItem }) {
  const title = item.title?.trim() || item.label?.trim() || ''
  const description = item.description?.trim() || ''
  const imageUrl = item.image?.trim() || `https://picsum.photos/seed/${item.id}/1600/900`
  const fallbackUrl = `https://picsum.photos/seed/${item.id}-fallback/1600/900`
  const imageAlt = item.alt?.trim() || title
  const link = item.link?.trim() || '#'
  const [src, setSrc] = useState(imageUrl)

  useEffect(() => {
    setSrc(imageUrl)
  }, [imageUrl])

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease }}
      className="relative h-full w-full overflow-hidden"
    >
      <img
        src={src}
        alt={imageAlt}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setSrc((current) => (current === fallbackUrl ? current : fallbackUrl))}
        className="h-full min-h-[420px] w-full object-cover sm:min-h-[480px] lg:min-h-[560px]"
      />

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/70 to-transparent px-6 pb-8 pt-24 sm:px-8 sm:pb-10 sm:pt-28 lg:px-10 lg:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease }}
          className="max-w-2xl"
        >
          {title && (
            <h2 className="inline-block border-b-2 border-white pb-1 text-2xl font-semibold text-white sm:text-3xl">
              {title}
            </h2>
          )}

          {description && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
              {description}
            </p>
          )}

          <a
            href={link}
            className="mt-6 inline-flex text-white transition-opacity duration-200 hover:opacity-80"
            aria-label={`Learn more about ${title}`}
          >
            <OverlayArrow />
          </a>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function Design() {
  const tabs = data?.tabs
  const items = (tabs?.items ?? []).filter((item) => item?.id?.trim())

  const defaultId =
    tabs?.defaultActive?.trim() && items.some((item) => item.id === tabs.defaultActive)
      ? tabs.defaultActive
      : items[0]?.id

  const [activeId, setActiveId] = useState(defaultId ?? '')

  if (!items.length) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-6">
        <p className="text-lg text-gray-500">No tab content available.</p>
      </section>
    )
  }

  const activeItem = items.find((item) => item.id === activeId) ?? items[0]

  return (
    <section className="bg-white px-6 py-12 md:px-10 md:py-16 lg:px-16 lg:py-20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 lg:flex-row lg:gap-14 xl:gap-20">
        <nav className="lg:w-[30%] lg:shrink-0" aria-label="Solution categories">
          <ul className="flex flex-col gap-4 sm:gap-5">
            {items.map((item) => {
              const isActive = item.id === activeItem.id
              const label = item.label?.trim() || item.title?.trim() || item.id

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={`group flex w-full items-center gap-3 text-left text-lg font-medium transition-colors duration-200 sm:text-xl ${
                      isActive ? 'text-black' : 'text-gray-400 hover:text-gray-700'
                    }`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center transition-opacity duration-200 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                      aria-hidden
                    >
                      {isActive && <SidebarArrow />}
                    </span>
                    <span>{label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="relative min-h-[420px] flex-1 overflow-hidden sm:min-h-[480px] lg:min-h-[560px]">
          <AnimatePresence mode="wait">
            <TabContent key={activeItem.id} item={activeItem} />
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
