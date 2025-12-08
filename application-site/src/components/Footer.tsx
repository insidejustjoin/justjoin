import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { Instagram, MessageCircle, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  const socialLinks = [
    {
      name: 'Instagram',
      icon: Instagram,
      href: '#',
      color: 'hover:text-pink-600',
    },
    {
      name: 'Telegram',
      icon: MessageCircle,
      href: '#',
      color: 'hover:text-blue-500',
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      href: '#',
      color: 'hover:text-black',
    },
  ];

  return (
    <footer className="bg-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t('footer.company')}</h3>
            <p className="text-gray-400 text-sm">
              {t('company.description')}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">お問い合わせ</h3>
            <a
              href={`mailto:${t('company.emailValue')}`}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              {t('company.emailValue')}
            </a>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t('footer.sns')}</h3>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-400 ${social.color} transition-colors`}
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <a
                href="https://justjoin.jp/privacy-policy"
                className="hover:text-white transition-colors"
              >
                プライバシーポリシー
              </a>
              <a
                href="https://justjoin.jp/terms-of-service"
                className="hover:text-white transition-colors"
              >
                利用規約
              </a>
              <a
                href="https://justjoin.jp/commercial-transaction"
                className="hover:text-white transition-colors"
              >
                特定商取引法に基づく表記
              </a>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {t('footer.company')}. {t('footer.rights')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

