import { useState } from 'react';
import { RegisterForm } from './components/RegisterForm';
import { ProfileForm } from './components/ProfileForm';
import { MultiStepForm } from './components/MultiStepForm';
import { DynamicForm } from './components/DynamicForm';
import './App.css';

type Tab = 'register' | 'profile' | 'multistep' | 'dynamic';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('register');

  return (
    <div className="app">
      <header className="app-header">
        <h1>React Hook Form + FIRM Validation</h1>
        <p className="subtitle">
          Production-ready form validation with type safety
        </p>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'register' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('register')}
        >
          Basic Form
        </button>
        <button
          className={activeTab === 'profile' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('profile')}
        >
          Profile Form
        </button>
        <button
          className={activeTab === 'multistep' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('multistep')}
        >
          Multi-Step
        </button>
        <button
          className={activeTab === 'dynamic' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('dynamic')}
        >
          Dynamic Fields
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'register' && <RegisterForm />}
        {activeTab === 'profile' && <ProfileForm />}
        {activeTab === 'multistep' && <MultiStepForm />}
        {activeTab === 'dynamic' && <DynamicForm />}
      </main>

      <footer className="app-footer">
        <div className="features">
          <div className="feature">
            <strong>Pre-compiled Schemas</strong>
            <span>3-10x faster validation</span>
          </div>
          <div className="feature">
            <strong>Type Safety</strong>
            <span>Full TypeScript inference</span>
          </div>
          <div className="feature">
            <strong>Easy Integration</strong>
            <span>Works with React Hook Form</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
