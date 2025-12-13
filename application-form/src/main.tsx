import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initGA } from './utils/gtag'

// GA4を初期化
initGA();

createRoot(document.getElementById("root")!).render(<App />);
