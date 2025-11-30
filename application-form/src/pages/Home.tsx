
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Building, TrendingUp, Award, Target, Globe } from 'lucide-react';

const Home = () => {
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
        <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v20h40V20H20z'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-6xl font-bold mb-8 leading-tight">
                {t('home.title').includes('本気で繋ぐ') ? (
                  <>
                    {t('home.title').split('本気で繋ぐ')[0]}<br />
                    <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                      本気で繋ぐ
                    </span>
                  </>
                ) : t('home.title').includes('serious employers') ? (
                  <>
                    {t('home.title').split('serious employers')[0]}<br />
                    <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                      serious employers
                    </span>
                  </>
                ) : (
                  <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                    {t('home.title')}
                  </span>
                )}
              </h1>
              <p className="text-xl mb-12 text-gray-300 max-w-2xl mx-auto leading-relaxed">
                {t('home.subtitle')}
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 group">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-semibold mb-4">{t('home.jobSeekerCard.title')}</h3>
                    <p className="text-gray-300 mb-6 text-sm">
                      {t('home.jobSeekerCard.description')}
                    </p>
                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                      <Link to="/jobseeker">
                        {t('home.jobSeekerCard.button')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 group">
                  <CardContent className="p-8 text-center">
                    <Building className="h-12 w-12 text-emerald-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-semibold mb-4">{t('home.companyCard.title')}</h3>
                    <p className="text-gray-300 mb-6 text-sm">
                      {t('home.companyCard.description')}
                    </p>
                    <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                      <Link to="/employer">
                        {t('home.companyCard.button')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">50,000+</div>
                <div className="text-gray-600">{t('home.stats.jobSeekers')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-600 mb-2">5,000+</div>
                <div className="text-gray-600">{t('home.stats.jobs')}</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
                <div className="text-gray-600">{t('home.stats.matchRate')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('home.features.title')}</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('home.features.subtitle')}
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <TrendingUp className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <CardTitle className="text-xl">{t('home.features.aiMatching.title')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('home.features.aiMatching.description')}
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <Award className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                  <CardTitle className="text-xl">{t('home.features.highClass.title')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('home.features.highClass.description')}
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <Target className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <CardTitle className="text-xl">{t('home.features.support.title')}</CardTitle>
                  <CardDescription className="text-base">
                    {t('home.features.support.description')}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <Globe className="h-16 w-16 mx-auto mb-6 opacity-80" />
            <h2 className="text-4xl font-bold mb-6">{t('home.cta.title')}</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {t('home.cta.subtitle')}
            </p>
            <div className="space-x-4">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-medium">
                <Link to="/jobseeker">
                  {t('home.cta.jobSeekerButton')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 font-medium">
                <Link to="/employer">
                  {t('home.cta.companyButton')}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
