import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useLanguage } from '../contexts/LanguageContext';
import { CheckCircle, TrendingUp, Users, Briefcase } from 'lucide-react';

interface CaseCardProps {
  title: string;
  description: string;
  result: string;
  icon: React.ReactNode;
  delay: number;
  inView: boolean;
}

const CaseCard: React.FC<CaseCardProps> = ({ title, description, result, icon, delay, inView }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05, y: -10 }}
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-black">{title}</h3>
        </div>
      </div>
      <p className="text-gray-700 mb-6 leading-relaxed">{description}</p>
      <div className="flex items-center gap-2 text-primary font-semibold">
        <CheckCircle className="h-5 w-5" />
        <span>{result}</span>
      </div>
    </motion.div>
  );
};

export const SupportCases: React.FC = () => {
  const { t } = useLanguage();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const cases = [
    {
      title: t('case1.title'),
      description: t('case1.description'),
      result: t('case1.result'),
      icon: <Briefcase className="h-6 w-6 text-primary" />,
    },
    {
      title: t('case2.title'),
      description: t('case2.description'),
      result: t('case2.result'),
      icon: <Users className="h-6 w-6 text-primary" />,
    },
    {
      title: t('case3.title'),
      description: t('case3.description'),
      result: t('case3.result'),
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            {t('cases.subtitle')}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
            {t('cases.title')}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {cases.map((caseItem, index) => (
            <CaseCard
              key={index}
              title={caseItem.title}
              description={caseItem.description}
              result={caseItem.result}
              icon={caseItem.icon}
              delay={index * 0.2}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

