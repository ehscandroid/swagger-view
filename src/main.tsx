import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './style/app.css';
import App from './App';

const container = document.getElementById('root')!;
const root = createRoot(container);

const Main = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  );
};

root.render(<Main />);