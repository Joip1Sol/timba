import React from 'react';
import ReactDOM from 'react-dom';
import WebApp from '@twa-dev/sdk';
import RouletteWrapper from './RouletteWrapper';
import './styles.css';

// Inicializar la Web App de Telegram
WebApp.ready();

// Configurar el tema y el color de fondo según Telegram
document.body.style.backgroundColor = WebApp.backgroundColor;
document.body.classList.add(WebApp.colorScheme);

// Expandir la webapp a pantalla completa
WebApp.expand();

ReactDOM.render(
  <React.StrictMode>
    <RouletteWrapper />
  </React.StrictMode>,
  document.getElementById('root')
);
