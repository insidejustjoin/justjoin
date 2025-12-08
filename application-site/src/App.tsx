import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { JobCategories } from './components/JobCategories';
import { SupportCases } from './components/SupportCases';
import { Process } from './components/Process';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <JobCategories />
        <SupportCases />
        <Process />
        <FAQ />
      </main>
      <Footer />
      </div>
  );
}

export default App;
