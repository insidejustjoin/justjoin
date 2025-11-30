import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useLanguage } from '../contexts/LanguageContext';
import { Building2, Mail, Users, Target } from 'lucide-react';

export const CompanyInfo: React.FC = () => {
  const { t } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-16"
        >
          <motion.p
            variants={itemVariants}
            className="text-sm font-semibold text-primary uppercase tracking-wider mb-4"
          >
            {t('company.title')}
          </motion.p>
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-black mb-6"
          >
            {t('company.subtitle')}
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Company Details */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="space-y-8"
          >
            <motion.div
              whileHover={{ scale: 1.02, x: 10 }}
              className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500 text-sm mb-1">
                    {t('company.name')}
                  </h3>
                  <p className="text-xl font-bold text-black">
                    {t('company.nameValue')}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, x: 10 }}
              className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500 text-sm mb-1">
                    {t('company.email')}
                  </h3>
                  <a
                    href={`mailto:${t('company.emailValue')}`}
                    className="text-xl font-bold text-black hover:text-accent transition-colors"
                  >
                    {t('company.emailValue')}
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-gray-700 leading-relaxed">
                {t('company.description')}
                <br />
                <br />
                {t('company.description2')}
                <br />
                {t('company.description3')}
              </p>
            </motion.div>
          </motion.div>

          {/* Visual Elements */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-6">
              <motion.div
                className="p-8 bg-primary/10 rounded-2xl text-center"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-black mb-2">50,000+</h3>
                <p className="text-gray-600 text-sm">求職者</p>
              </motion.div>

              <motion.div
                className="p-8 bg-accent/10 rounded-2xl text-center"
                whileHover={{ scale: 1.05, rotate: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Target className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-black mb-2">95%</h3>
                <p className="text-gray-600 text-sm">マッチング率</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

