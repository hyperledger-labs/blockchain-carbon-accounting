import { createRoot } from 'react-dom/client';
import React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import App from './App';
import './index.css';
import * as serviceWorker from './serviceWorker';

const el = document.getElementById('root')
if (el) {
  const root = createRoot(el)
  root.render(<React.StrictMode>
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
    >
      <App />
    </GoogleReCaptchaProvider>
  </React.StrictMode>)

}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
