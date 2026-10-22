import React, { createContext, useContext, useState, useEffect } from 'react';
import { AllUiTexts } from '../types';
import { defaultAllUiTexts } from '../utils/uiTextDefaults';
import { apiFetch } from '../api';

interface UiTextContextType {
  uiTexts: AllUiTexts;
  loading: boolean;
  updateUiTexts: (newTexts: Partial<AllUiTexts>) => Promise<void>;
  resetUiTexts: () => Promise<void>;
  refreshUiTexts: () => Promise<void>;
}

const UiTextContext = createContext<UiTextContextType | undefined>(undefined);

export const UiTextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiTexts, setUiTexts] = useState<AllUiTexts>(defaultAllUiTexts);
  const [loading, setLoading] = useState(true);

  const fetchUiTexts = async () => {
    try {
      const res = await apiFetch('/api/settings/ui-texts');
      if (res?.uiTexts) {
        setUiTexts({
          ...defaultAllUiTexts,
          ...res.uiTexts
        });
      }
    } catch (err) {
      console.warn('Failed to fetch UI texts, using defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUiTexts();
  }, []);

  const updateUiTexts = async (newTexts: Partial<AllUiTexts>) => {
    const updated = {
      ...uiTexts,
      ...newTexts
    };
    // Optimistic update so UI reflects immediately
    setUiTexts(updated);
    try {
      const res = await apiFetch('/api/owner/all-ui-texts', {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      if (res?.uiTexts) {
        setUiTexts({
          ...defaultAllUiTexts,
          ...res.uiTexts
        });
      }
    } catch (err) {
      console.error('Failed to save UI texts to server:', err);
      // Re-fetch on error to revert
      await fetchUiTexts();
      throw err;
    }
  };

  const resetUiTexts = async () => {
    try {
      const res = await apiFetch('/api/owner/all-ui-texts/reset', {
        method: 'POST'
      });
      if (res?.uiTexts) {
        setUiTexts({
          ...defaultAllUiTexts,
          ...res.uiTexts
        });
      } else {
        setUiTexts(defaultAllUiTexts);
      }
    } catch (err) {
      console.error('Failed to reset UI texts:', err);
      throw err;
    }
  };

  return (
    <UiTextContext.Provider
      value={{
        uiTexts,
        loading,
        updateUiTexts,
        resetUiTexts,
        refreshUiTexts: fetchUiTexts
      }}
    >
      {children}
    </UiTextContext.Provider>
  );
};

export const useUiText = (): UiTextContextType => {
  const context = useContext(UiTextContext);
  if (!context) {
    throw new Error('useUiText must be used within a UiTextProvider');
  }
  return context;
};
