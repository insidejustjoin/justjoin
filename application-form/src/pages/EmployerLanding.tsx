
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Target, ArrowRight, CheckCircle, BarChart, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

const EmployerLanding = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen">
      {/* 言語切り替えボタン */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageToggle />
      </div>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-500/30 rounded-full text-sm mb-8">
              <Award className="h-4 w-4 mr-2" />
              {t('employerLanding.usingCompanies')}
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              {t('employerLanding.title1')}<br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                {t('employerLanding.title2')}
              </span>
            </h1>
            <p className="text-xl mb-8 text-emerald-100 max-w-2xl mx-auto">
              {t('employerLanding.subtitle')}
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 w-full sm:w-auto">
                <Link to="/login">
                  <Building className="mr-2 h-5 w-5" />
                  {t('employerLanding.startButton')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-emerald-600 w-full sm:w-auto">
                <Link to="/dashboard">
                  {t('employerLanding.viewDashboard')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('employerLanding.stepsTitle')}</h2>
            <p className="text-xl text-gray-600">{t('employerLanding.stepsSubtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-emerald-500">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">1</span>
                </div>
                <CardTitle className="text-xl">{t('employerLanding.step1.title')}</CardTitle>
                <CardDescription className="text-base">
                  {t('employerLanding.step1.description')}
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-blue-500">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <CardTitle className="text-xl">{t('employerLanding.step2.title')}</CardTitle>
                <CardDescription className="text-base">
                  {t('employerLanding.step2.description')}
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-purple-500">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <CardTitle className="text-xl">{t('employerLanding.step3.title')}</CardTitle>
                <CardDescription className="text-base">
                  {t('employerLanding.step3.description')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('employerLanding.featuresTitle')}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('employerLanding.feature1.title')}</h3>
                  <p className="text-gray-600">{t('employerLanding.feature1.description')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('employerLanding.feature2.title')}</h3>
                  <p className="text-gray-600">{t('employerLanding.feature2.description')}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('employerLanding.feature3.title')}</h3>
                  <p className="text-gray-600">{t('employerLanding.feature3.description')}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl">
              <BarChart className="h-16 w-16 text-emerald-600 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('employerLanding.stats.title')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('employerLanding.stats.successRate')}</span>
                  <span className="text-2xl font-bold text-emerald-600">92%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('employerLanding.stats.averageTime')}</span>
                  <span className="text-2xl font-bold text-blue-600">1.8ヶ月</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('employerLanding.stats.costReduction')}</span>
                  <span className="text-2xl font-bold text-purple-600">-68%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('employerLanding.pricing.title')}</h2>
            <p className="text-xl text-gray-600">{t('employerLanding.pricing.subtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{t('employerLanding.pricing.standard.title')}</CardTitle>
                <div className="text-4xl font-bold text-emerald-600 mt-4">
                  {t('employerLanding.pricing.standard.price')}
                </div>
                <CardDescription className="text-base mt-2">
                  {t('employerLanding.pricing.standard.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>{t('employerLanding.pricing.standard.feature1')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>{t('employerLanding.pricing.standard.feature2')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>{t('employerLanding.pricing.standard.feature3')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-300 border-2 border-emerald-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  {t('employerLanding.pricing.recommended')}
                </span>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{t('employerLanding.pricing.premium.title')}</CardTitle>
                <div className="text-4xl font-bold text-emerald-600 mt-4">
                  {t('employerLanding.pricing.premium.price')}
                </div>
                <CardDescription className="text-base mt-2">
                  {t('employerLanding.pricing.premium.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>{t('employerLanding.pricing.premium.feature1')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>{t('employerLanding.pricing.premium.feature2')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>{t('employerLanding.pricing.premium.feature3')}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span>{t('employerLanding.pricing.premium.feature4')}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('employerLanding.cta.title')}</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {t('employerLanding.cta.subtitle')}
          </p>
          <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4">
            <Link to="/login">
              {t('employerLanding.cta.button')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <p className="text-sm mt-4 opacity-75">{t('employerLanding.cta.note')}</p>
        </div>
      </section>
    </div>
  );
};

export default EmployerLanding;
