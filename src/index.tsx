import React from 'react';
import ReactDOM from 'react-dom/client';
import RouletteWrapper from './RouletteWrapper';
import WebApp from '@twa-dev/sdk';
import './styles.css';

// Inicializar la Web App de Telegram
WebApp.ready();

// Configurar el tema y el color de fondo según Telegram
if (WebApp.backgroundColor) {
  document.body.style.backgroundColor = WebApp.backgroundColor;
}
if (WebApp.colorScheme) {
  document.body.classList.add(WebApp.colorScheme);
}

// Expandir la webapp a pantalla completa
WebApp.expand();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <RouletteWrapper />
  </React.StrictMode>
);
