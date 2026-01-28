import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EventItem, SiteSettings, TeamMember } from '@/types/event';
import { mockEvents, defaultSettings, teamMembers } from '@/data/mockData';

interface EventContextType {
  events: EventItem[];
  addEvent: (event: Omit<EventItem, 'id' | 'createdAt'>) => void;
  updateEvent: (id: string, event: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
  settings: SiteSettings;
  updateSettings: (settings: Partial<SiteSettings>) => void;
  team: TeamMember[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<EventItem[]>(mockEvents);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const addEvent = (event: Omit<EventItem, 'id' | 'createdAt'>) => {
    const newEvent: EventItem = {
      ...event,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (id: string, updates: Partial<EventItem>) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, ...updates } : event
    ));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const login = (email: string, password: string): boolean => {
    // Mock login - ในอนาคตจะเชื่อมกับ backend
    if (email === 'admin@example.com' && password === 'admin123') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <EventContext.Provider value={{
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      settings,
      updateSettings,
      team: teamMembers,
      isAuthenticated,
      login,
      logout,
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};
