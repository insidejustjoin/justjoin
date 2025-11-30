import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CompanyInfo } from './components/CompanyInfo';
import { SupportCases } from './components/SupportCases';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <CompanyInfo />
        <SupportCases />
      </main>
      <Footer />
    </div>
  );
}

export default App;
