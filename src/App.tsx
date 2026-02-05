import { useState, useEffect } from 'react';
import { SetupScreen, UnlockScreen, Layout } from './components';
import { getVaultStatus, lockVault } from './lib/api';
import type { Vault, AppScreen } from './types';
import './App.css';

function App() {
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [vault, setVault] = useState<Vault | null>(null);

  useEffect(() => {
    checkVaultStatus();
  }, []);

  const checkVaultStatus = async () => {
    try {
      const status = await getVaultStatus();
      if (!status.exists) {
        setScreen('setup');
      } else if (!status.unlocked) {
        setScreen('unlock');
      } else {
        setScreen('main');
      }
    } catch (err) {
      console.error('Failed to check vault status:', err);
      setScreen('setup');
    }
  };

  const handleSetupComplete = (newVault: Vault) => {
    setVault(newVault);
    setScreen('main');
  };

  const handleUnlock = (unlockedVault: Vault) => {
    setVault(unlockedVault);
    setScreen('main');
  };

  const handleLock = async () => {
    try {
      await lockVault();
      setVault(null);
      setScreen('unlock');
    } catch (err) {
      console.error('Failed to lock vault:', err);
    }
  };

  const handleVaultUpdate = (updatedVault: Vault) => {
    setVault(updatedVault);
  };

  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (screen === 'setup') {
    return <SetupScreen onSetupComplete={handleSetupComplete} />;
  }

  if (screen === 'unlock') {
    return <UnlockScreen onUnlock={handleUnlock} />;
  }

  if (screen === 'main' && vault) {
    return (
      <Layout
        vault={vault}
        onVaultUpdate={handleVaultUpdate}
        onLock={handleLock}
      />
    );
  }

  return null;
}

export default App;
