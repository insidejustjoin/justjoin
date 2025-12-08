import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Phone } from 'lucide-react';

export const Hero: React.FC = () => {
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    {
      url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=1600&fit=crop&crop=faces',
      alt: 'IT・エンジニア',
    },
    {
      url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=1600&fit=crop',
      alt: '営業・接客',
    },
    {
      url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=1600&fit=crop',
      alt: '建築・建設',
    },
    {
      url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=1600&fit=crop',
      alt: 'ドライバー・物流',
    },
    {
      url: '/images/taxi-driver.jpg',
      alt: 'タクシードライバー',
    },
    {
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=1600&fit=crop',
      alt: 'バス運転手',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000); // 5秒ごとに切り替え

    return () => clearInterval(interval);
  }, [images.length]);

  const stats = [
    { value: '50,500', label: t('hero.stats.companies'), note: t('hero.stats.note1') },
    { value: '133,000', label: t('hero.stats.staff'), note: t('hero.stats.note2') },
    { value: '47', label: t('hero.stats.prefectures'), note: t('hero.stats.note3') },
  ];


  return (
    <section className="relative min-h-screen flex items-start lg:items-center overflow-hidden bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-8 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Right Column - Photo Slider (Mobile: First, Desktop: Second) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative order-1 lg:order-2 w-full"
          >
            <div className="relative">
              {/* Photo Slider - 横長レイアウト（スマホ） */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[250px] sm:h-[350px] lg:h-[600px] w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      duration: 1,
                      ease: [0.4, 0, 0.2, 1]
                    }}
                    className="absolute inset-0"
                  >
                    <motion.img
                      src={images[currentImageIndex].url}
                      alt={images[currentImageIndex].alt}
                      className="w-full h-full object-cover"
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        duration: 1.2,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      onError={(e) => {
                        // 画像が読み込めない場合はフォールバックURLを使用
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('unsplash.com')) {
                          target.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=1600&fit=crop';
                        }
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Slider Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'w-8 bg-white'
                        : 'w-2 bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Decorative Elements */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute -top-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl hidden lg:block"
              />
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="absolute -bottom-6 -left-6 w-40 h-40 bg-accent/10 rounded-full blur-2xl hidden lg:block"
              />
            </div>
          </motion.div>

          {/* Left Column - Content (Mobile: Second, Desktop: First) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="order-2 lg:order-1 w-full"
          >

            {/* Main Heading */}
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl font-bold text-black mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              dangerouslySetInnerHTML={{ __html: t('hero.title') }}
            />

            <motion.p
              className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              dangerouslySetInnerHTML={{ __html: t('hero.subtitle') }}
            />

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    {stat.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {stat.note}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* CTA Box */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mb-6"
            >
              <div className="mb-4">
                <span className="inline-block px-3 py-1.5 bg-yellow-400 text-black text-xs font-bold rounded-full mb-2">
                  {t('hero.quickInfo1')}
                </span>
                <p className="text-gray-700 font-medium text-sm mt-2">
                  {t('hero.quickInfo2')}
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3">
                <motion.a
                  href="https://justjoin.jp/jobseeker/register"
                  className="group px-5 py-3 bg-primary text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('hero.cta1')}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </motion.a>
                
                <motion.a
                  href="https://justjoin.jp/jobseeker/register"
                  className="group px-5 py-3 bg-primary text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('hero.cta2')}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </motion.a>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-wrap items-center gap-4 text-sm text-gray-600"
            >
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>{t('hero.contact')}</span>
              </div>
              <span className="text-gray-300">|</span>
              <span>{t('hero.contactHours')}</span>
            </motion.div>
          </motion.div>

        </div>

        {/* Job Seeker Appeal Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-20 pt-12 border-t border-gray-200"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              {t('hero.appeal.title')}
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              {t('hero.appeal.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: t('hero.appeal.item1.title'),
                description: t('hero.appeal.item1.description'),
                icon: '✓',
              },
              {
                title: t('hero.appeal.item2.title'),
                description: t('hero.appeal.item2.description'),
                icon: '✓',
              },
              {
                title: t('hero.appeal.item3.title'),
                description: t('hero.appeal.item3.description'),
                icon: '✓',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold">{item.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

