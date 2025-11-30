
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Star, ArrowRight, CheckCircle, TrendingUp, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

const JobSeekerLanding = () => {
  const { t } = useLanguage();
  
  return (
    <>
      <Helmet>
        <title>registration form for job seeker</title>
        <meta name="description" content="registration form for job seeker" />
        <meta name="keywords" content="registration form for job seeker" />
        <meta property="og:title" content="registration form for job seeker" />
        <meta property="og:description" content="registration form for job seeker" />
        <meta name="twitter:title" content="registration form for job seeker" />
        <meta name="twitter:description" content="registration form for job seeker" />
      </Helmet>
      
      <div className="min-h-screen">
        {/* 言語切り替えボタン */}
        <div className="absolute top-6 right-6 z-50">
          <LanguageToggle />
        </div>
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/30 rounded-full text-sm mb-8">
                <Star className="h-4 w-4 mr-2" />
                {t('jobSeekerLanding.successRate')}
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                {t('jobSeekerLanding.title1')}<br />
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  {t('jobSeekerLanding.title2')}
                </span>
              </h1>
              <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
                {t('jobSeekerLanding.subtitle')}
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto">
                  <Link to="/register">
                    <User className="mr-2 h-5 w-5" />
                    {t('jobSeekerLanding.startButton')}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 w-full sm:w-auto">
                  <Link to="/auth">
                    {t('jobSeekerLanding.existingAccount')}
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
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('jobSeekerLanding.stepsTitle')}</h2>
              <p className="text-xl text-gray-600">{t('jobSeekerLanding.stepsSubtitle')}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-blue-500">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <CardTitle className="text-xl">{t('jobSeekerLanding.step1.title')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('jobSeekerLanding.step1.description')}
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-emerald-500">
                <CardHeader>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-emerald-600">2</span>
                  </div>
                  <CardTitle className="text-xl">{t('jobSeekerLanding.step2.title')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('jobSeekerLanding.step2.description')}
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-purple-500">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <CardTitle className="text-xl">{t('jobSeekerLanding.step3.title')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('jobSeekerLanding.step3.description')}
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
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('jobSeekerLanding.featuresTitle')}</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('jobSeekerLanding.feature1.title')}</h3>
                    <p className="text-gray-600">{t('jobSeekerLanding.feature1.description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('jobSeekerLanding.feature2.title')}</h3>
                    <p className="text-gray-600">{t('jobSeekerLanding.feature2.description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('jobSeekerLanding.feature3.title')}</h3>
                    <p className="text-gray-600">{t('jobSeekerLanding.feature3.description')}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
                <TrendingUp className="h-16 w-16 text-blue-600 mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('jobSeekerLanding.stats.title')}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('jobSeekerLanding.stats.salaryIncrease')}</span>
                    <span className="text-2xl font-bold text-blue-600">+127%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('jobSeekerLanding.stats.successRate')}</span>
                    <span className="text-2xl font-bold text-emerald-600">95%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('jobSeekerLanding.stats.averageTime')}</span>
                    <span className="text-2xl font-bold text-purple-600">2.3ヶ月</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Shield className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('jobSeekerLanding.security.title')}</h2>
              <p className="text-xl text-gray-600 mb-8">
                {t('jobSeekerLanding.security.description')}
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('jobSeekerLanding.security.feature1.title')}</h4>
                  <p className="text-gray-600">{t('jobSeekerLanding.security.feature1.description')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('jobSeekerLanding.security.feature2.title')}</h4>
                  <p className="text-gray-600">{t('jobSeekerLanding.security.feature2.description')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('jobSeekerLanding.security.feature3.title')}</h4>
                  <p className="text-gray-600">{t('jobSeekerLanding.security.feature3.description')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">{t('jobSeekerLanding.cta.title')}</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {t('jobSeekerLanding.cta.subtitle')}
            </p>
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
              <Link to="/register">
                {t('jobSeekerLanding.cta.button')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm mt-4 opacity-75">{t('jobSeekerLanding.cta.note')}</p>
          </div>
        </section>
      </div>
    </>
  );
};

export default JobSeekerLanding;
