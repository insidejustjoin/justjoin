import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useLanguage } from '../contexts/LanguageContext';
import { Scale, MapPin, Zap } from 'lucide-react';

export const Features: React.FC = () => {
  const { t } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      number: '01',
      title: t('features.reason1.title'),
      subtitle: t('features.reason1.subtitle'),
      description: t('features.reason1.description'),
      icon: Scale,
      color: 'primary',
    },
    {
      number: '02',
      title: t('features.reason2.title'),
      subtitle: t('features.reason2.subtitle'),
      description: t('features.reason2.description'),
      icon: MapPin,
      color: 'accent',
    },
    {
      number: '03',
      title: t('features.reason3.title'),
      subtitle: t('features.reason3.subtitle'),
      description: t('features.reason3.description'),
      icon: Zap,
      color: 'primary',
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
            {t('features.title')}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const bgColorClass = feature.color === 'primary' ? 'bg-primary/10' : 'bg-accent/10';
            const textColorClass = feature.color === 'primary' ? 'text-primary' : 'text-accent';
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-4 ${bgColorClass} rounded-xl`}>
                    <Icon className={`h-8 w-8 ${textColorClass}`} />
                  </div>
                  <span className="text-6xl font-bold text-gray-100">{feature.number}</span>
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">
                  {feature.title}
                </h3>
                <p className="text-lg font-semibold text-gray-600 mb-4">
                  {feature.subtitle}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

