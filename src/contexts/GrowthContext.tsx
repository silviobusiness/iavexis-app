import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../utils/firestoreUtils";
import { useAuth } from "./AuthContext";

export type LeadType = "cliente" | "influenciador" | "parceiro";
export type LeadStatus = "novo_lead" | "contato_iniciado" | "proposta_enviada" | "negociacao" | "aguardando_resposta" | "fechado";
export type OpportunityScore = "Alta" | "Baixa" | "Não avaliado";

export interface Interaction {
  id: string;
  date: string;
  type: "note" | "message" | "proposal" | "system";
  content: string;
}

export interface Lead {
  id: string;
  name: string;
  type: LeadType;
  socialMedia?: string;
  followers?: number;
  serviceType: string;
  status: LeadStatus;
  notes?: string;
  createdAt: any;
  updatedAt: any;
  // Influencer specific
  niche?: string;
  engagement?: number;
  partnershipType?: string;
  // Advanced CRM fields
  score?: OpportunityScore;
  history?: Interaction[];
  lastContactAt?: string;
  projectHours?: number;
  valuePerHour?: number;
  extraCosts?: number;
  margin?: number;
}

export interface SocialMetric {
  id: string;
  date: string;
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
  platform: string;
  change: number;
  value: number;
  name: string;
}

export interface ContentSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'reels' | 'post' | 'stories' | 'carousel';
  trend: 'high' | 'medium' | 'low';
  tags: string[];
  platform: string;
  potential: string;
}

export interface Engagement {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface PostPerformance {
  id: string;
  type: 'reels' | 'post' | 'stories' | 'carousel';
  reach: number;
  date: string;
  thumbnail: string;
  title: string;
  engagement: Engagement;
  platform: string;
}

interface GrowthContextType {
  leads: Lead[];
  socialMetrics: SocialMetric[];
  suggestions: ContentSuggestion[];
  postPerformance: PostPerformance[];
  loading: boolean;
  createLead: (data: Omit<Lead, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updateLead: (id: string, data: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addInteraction: (leadId: string, interaction: Omit<Interaction, "id" | "date">) => Promise<void>;
  updateSocialMetrics: (metrics: Omit<SocialMetric, "id" | "date">) => Promise<void>;
  createSuggestion: (data: Omit<ContentSuggestion, "id">) => Promise<void>;
}

const GrowthContext = createContext<GrowthContextType | undefined>(undefined);

export function GrowthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [socialMetrics, setSocialMetrics] = useState<SocialMetric[]>([]);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [postPerformance, setPostPerformance] = useState<PostPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const leadsQ = query(
      collection(db, "leads"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const socialQ = query(
      collection(db, "social_metrics"),
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );

    const suggestionsQ = query(
      collection(db, "content_suggestions"),
      where("userId", "==", user.uid)
    );

    const performanceQ = query(
      collection(db, "post_performance"),
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );

    const unsubLeads = onSnapshot(leadsQ, (snapshot) => {
      const newLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Lead);
      setLeads(newLeads);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "leads");
    });

    const unsubSocial = onSnapshot(socialQ, (snapshot) => {
      setSocialMetrics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SocialMetric));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "social_metrics");
    });

    const unsubSuggestions = onSnapshot(suggestionsQ, (snapshot) => {
      setSuggestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ContentSuggestion));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "content_suggestions");
    });

    const unsubPerformance = onSnapshot(performanceQ, (snapshot) => {
      setPostPerformance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PostPerformance));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "post_performance");
      setLoading(false);
    });

    return () => {
      unsubLeads();
      unsubSocial();
      unsubSuggestions();
      unsubPerformance();
    };
  }, [user]);

  const updateSocialMetrics = async (metrics: Omit<SocialMetric, "id" | "date">) => {
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, "social_metrics"), {
        ...metrics,
        userId: user?.uid || 'guest-user',
        date: now
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "social_metrics");
    }
  };

  const createLead = async (
    data: Omit<Lead, "id" | "createdAt" | "updatedAt">,
  ) => {
    const now = new Date().toISOString();
    const leadData = {
      ...data,
      userId: user?.uid || 'guest-user',
      createdAt: now,
      updatedAt: now,
      score: data.score || "Não avaliado",
      history: data.history || [{
        id: crypto.randomUUID(),
        date: now,
        type: "system",
        content: "Lead criado no sistema."
      }],
      lastContactAt: now,
    };

    // Remove undefined values to prevent Firestore errors
    const cleanData = Object.fromEntries(
      Object.entries(leadData).filter(([_, v]) => v !== undefined)
    );

    try {
      const docRef = await addDoc(collection(db, "leads"), cleanData);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "leads");
      throw error;
    }
  };

  const updateLead = async (id: string, data: Partial<Lead>) => {
    const leadRef = doc(db, "leads", id);
    const updatePayload: any = { ...data, updatedAt: new Date().toISOString() };
    
    // Remove undefined values to prevent Firestore errors
    const cleanPayload = Object.fromEntries(
      Object.entries(updatePayload).filter(([_, v]) => v !== undefined)
    );
    
    try {
      await updateDoc(leadRef, cleanPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
    }
  };

  const deleteLead = async (id: string) => {
    try {
      await deleteDoc(doc(db, "leads", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `leads/${id}`);
    }
  };

  const addInteraction = async (leadId: string, interaction: Omit<Interaction, "id" | "date">) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newInteraction: Interaction = {
      ...interaction,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };

    const updatedHistory = [newInteraction, ...(lead.history || [])];
    
    await updateLead(leadId, { 
      history: updatedHistory,
      lastContactAt: newInteraction.date
    });
  };

  const createSuggestion = async (data: Omit<ContentSuggestion, "id">) => {
    try {
      await addDoc(collection(db, "content_suggestions"), {
        ...data,
        userId: user?.uid || 'guest-user',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "content_suggestions");
    }
  };

  return (
    <GrowthContext.Provider
      value={{ 
        leads, 
        socialMetrics, 
        suggestions, 
        postPerformance, 
        loading, 
        createLead, 
        updateLead, 
        deleteLead, 
        addInteraction,
        updateSocialMetrics,
        createSuggestion
      }}
    >
      {children}
    </GrowthContext.Provider>
  );
}

export function useGrowth() {
  const context = useContext(GrowthContext);
  if (context === undefined) {
    throw new Error("useGrowth must be used within a GrowthProvider");
  }
  return context;
}
