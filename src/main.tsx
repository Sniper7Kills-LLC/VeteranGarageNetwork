import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import outputs from '@/../amplify_outputs.json';

import '@aws-amplify/ui-react/styles.css'; // Import Amplify UI styles

import './index.css'
import App from './App.tsx'

Amplify.configure(outputs);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Authenticator.Provider>
      <App />
    </Authenticator.Provider>
  </StrictMode>,
)
