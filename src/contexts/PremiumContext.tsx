import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface PremiumContextType {
  isPremium: boolean;
  canAddTask: (currentCount: number) => boolean;
  canAddHabit: (currentCount: number) => boolean;
  maxTasks: number;
  maxHabits: number;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const FREE_LIMITS = {
  tasks: 10,
  habits: 3
};

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  const isPremium = profile?.plano === 'premium';

  const canAddTask = (currentCount: number) => {
    return isPremium || currentCount < FREE_LIMITS.tasks;
  };

  const canAddHabit = (currentCount: number) => {
    return isPremium || currentCount < FREE_LIMITS.habits;
  };

  return (
    <PremiumContext.Provider value={{
      isPremium,
      canAddTask,
      canAddHabit,
      maxTasks: isPremium ? Infinity : FREE_LIMITS.tasks,
      maxHabits: isPremium ? Infinity : FREE_LIMITS.habits
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
