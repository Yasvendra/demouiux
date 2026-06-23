import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import pageData from './data.json'

interface HeroData {
  heading?: string
  description?: string
  image?: string
  alt?: string
  accentColor?: string
}

interface BottomBannerData {
  text?: string
}

interface DesignPageData {
  hero?: HeroData
  bottomBanner?: BottomBannerData
}

const data = pageData as DesignPageData

const ease = [0.22, 1, 0.36, 1] as const

const contentVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease },
  },
}

function HeroContent({
  heading,
  description,
  accentColor,
}: {
  heading: string
  description: string
  accentColor: string
}) {
  return (
    <motion.div variants={contentVariants} initial="hidden" animate="visible">
      <motion.span
        variants={itemVariants}
        className="mb-7 block h-[3px] w-[30px] origin-left"
        style={{ backgroundColor: accentColor }}
        whileHover={{ width: 48, transition: { duration: 0.25, ease } }}
        aria-hidden
      />

      {heading && (
        <motion.h1
          variants={itemVariants}
          className="text-[1.625rem] font-bold leading-[1.2] tracking-[-0.01em] text-black transition-colors duration-300 hover:text-neutral-800 sm:text-[1.75rem] lg:text-[2rem] xl:text-[2.125rem]"
        >
          {heading}
        </motion.h1>
      )}

      {description && (
        <motion.p
          variants={itemVariants}
          className="mt-6 text-[0.9375rem] font-normal leading-[1.65] text-black transition-colors duration-300 hover:text-neutral-700 sm:text-base lg:mt-7 lg:text-[1.0625rem] lg:leading-[1.7]"
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  )
}

function HeroImage({
  imageProps,
  className,
}: {
  imageProps: {
    src: string
    alt: string
    loading: 'eager'
    decoding: 'async'
    referrerPolicy: 'no-referrer'
    onError: () => void
  }
  className: string
}) {
  return (
    <motion.div
      className="overflow-hidden"
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.65, ease }}
      whileHover="hover"
    >
      <motion.img
        {...imageProps}
        variants={{
          hover: { scale: 1.04 },
        }}
        transition={{ duration: 0.5, ease }}
        className={className}
      />
    </motion.div>
  )
}

export default function Design() {
  const hero = data?.hero
  const bottomBanner = data?.bottomBanner

  const heading = hero?.heading?.trim() || ''
  const description = hero?.description?.trim() || ''
  const imageUrl =
    hero?.image?.trim() ||
    'https://media-d.global.abb/is/image/abbc/ABB%20AGM%20location:16x9?wid=1440&hei=810'
  const fallbackUrl =
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1600&h=900&fit=crop'
  const imageAlt = hero?.alt?.trim() || heading
  const accentColor = hero?.accentColor?.trim() || '#FF000F'
  const bannerText = bottomBanner?.text?.trim() || ''

  const [src, setSrc] = useState(imageUrl)

  useEffect(() => {
    setSrc(imageUrl)
  }, [imageUrl])

  if (!heading && !description && !bannerText) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center bg-white px-6">
        <p className="text-lg text-gray-500">No content available.</p>
      </section>
    )
  }

  const imageProps = {
    src,
    alt: imageAlt,
    loading: 'eager' as const,
    decoding: 'async' as const,
    referrerPolicy: 'no-referrer' as const,
    onError: () => setSrc((current) => (current === fallbackUrl ? current : fallbackUrl)),
  }

  return (
    <section className="bg-white px-6 py-12 font-sans sm:px-8 sm:py-14 md:px-10 md:py-16 lg:px-12 lg:py-20">
      <motion.div
        className="mx-auto w-full max-w-7xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease }}
      >
        {(heading || description) && (
          <>
            {/* Mobile / tablet — stacked */}
            <div className="lg:hidden">
              <HeroImage
                imageProps={imageProps}
                className="block h-[280px] w-full rounded-sm object-cover object-[center_25%] sm:h-[360px]"
              />
              <motion.div
                className="mt-6 bg-white px-4 py-8 sm:mt-8 sm:px-6 sm:py-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease }}
                whileHover={{
                  y: -2,
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
                  transition: { duration: 0.3, ease },
                }}
              >
                <HeroContent heading={heading} description={description} accentColor={accentColor} />
              </motion.div>
            </div>

            {/* Desktop — image left, white panel overlapping on right */}
            <div className="hidden lg:flex lg:min-h-[540px] lg:items-center">
              <div className="w-[63%] shrink-0 self-stretch">
                <HeroImage
                  imageProps={imageProps}
                  className="h-full min-h-[540px] w-full object-cover object-left"
                />
              </div>

              <motion.div
                className="relative z-10 -ml-[12%] w-[49%] shrink-0 cursor-default bg-white px-10 py-12 xl:px-14 xl:py-14"
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease }}
                whileHover={{
                  y: -6,
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.08)',
                  transition: { duration: 0.35, ease },
                }}
              >
                <HeroContent heading={heading} description={description} accentColor={accentColor} />
              </motion.div>
            </div>
          </>
        )}

        {bannerText && (
          <motion.div
            className="mt-12 sm:mt-16 lg:mt-20"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease }}
          >
            <motion.p
              className="mx-auto max-w-5xl text-center text-[1.125rem] font-bold leading-[1.45] text-black sm:text-[1.25rem] lg:text-[1.375rem] lg:leading-[1.5]"
              whileHover={{
                scale: 1.01,
                color: '#1a1a1a',
                transition: { duration: 0.25, ease },
              }}
            >
              {bannerText}
            </motion.p>
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
