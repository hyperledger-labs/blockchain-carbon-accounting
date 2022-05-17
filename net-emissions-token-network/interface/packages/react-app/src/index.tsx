// SPDX-License-Identifier: Apache-2.0
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./index.css";
import App from "./App";

const el = document.getElementById('root')
if (el) {
  const root = createRoot(el)
  root.render(<App/>)
}
