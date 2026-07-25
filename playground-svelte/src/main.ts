import { mount } from 'svelte'
import App from './App.svelte'
import { bootstrapPlaygroundRuntime } from './runtime/bootstrap'
import 'katex/dist/katex.min.css'
import 'monaco-editor/min/vs/editor/editor.main.css'
import 'markstream-svelte/index.css'
import './styles/base.css'
import './styles/settings.css'
import './styles/layout.css'
import './styles/header.css'
import './styles/home.css'
import './styles/test-lab.css'
import './styles/responsive.css'

bootstrapPlaygroundRuntime()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
