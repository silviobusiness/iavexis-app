import React from 'react';
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Target, 
  Share2, 
  MessageCircle, 
  Heart,
  Eye,
  Star,
  ChevronRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const engagementData = [
  { name: 'Mon', views: 4000, engagement: 2400 },
  { name: 'Tue', views: 3000, engagement: 1398 },
  { name: 'Wed', views: 2000, engagement: 9800 },
  { name: 'Thu', views: 2780, engagement: 3908 },
  { name: 'Fri', views: 1890, engagement: 4800 },
  { name: 'Sat', views: 2390, engagement: 3800 },
  { name: 'Sun', views: 3490, engagement: 4300 },
];

const StatCard = ({ label, value, trend, trendType, icon: Icon, color }: any) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-surface-1 border border-white/5 p-6 rounded-xl hover:border-white/10 transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-lg bg-white/5", color)}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium",
          trendType === 'up' ? "text-green-neon" : "text-red-500"
        )}>
          {trendType === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {trend}
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold tracking-tight text-white">{value}</h3>
    </div>
  </motion.div>
);

export const Growth: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter text-white uppercase italic">Growth Center</h1>
          <p className="text-gray-400 font-medium">Analyze performance and scale your designer authority.</p>
        </div>
        <button className="px-6 py-3 bg-purple-neon text-white rounded-xl text-sm font-bold hover:bg-purple-neon/90 transition-all flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Generate Strategy
        </button>
      </header>

      {/* Overview Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Followers" value="45.2K" trend="+12%" trendType="up" icon={Users} color="text-purple-neon" />
        <StatCard label="Avg. Engagement" value="4.8%" trend="+0.5%" trendType="up" icon={Heart} color="text-white" />
        <StatCard label="Profile Visits" value="12.4K" trend="-2%" trendType="down" icon={Eye} color="text-gray-400" />
        <StatCard label="Authority Score" value="92/100" trend="+5%" trendType="up" icon={Star} color="text-purple-neon" />
      </section>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Engagement Chart */}
        <div className="lg:col-span-2 bg-surface-1 border border-white/5 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold tracking-tight text-white">Engagement Analysis</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <div className="w-2 h-2 bg-purple-neon rounded-full" />
                Views
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <div className="w-2 h-2 bg-white rounded-full" />
                Engagement
              </span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#BC13FE' }}
                />
                <Bar dataKey="views" fill="#BC13FE" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="engagement" fill="#FFFFFF" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-surface-1 border border-white/5 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-neon/10 rounded-lg">
              <Zap className="w-5 h-5 text-purple-neon" />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white uppercase italic">Smart Insights</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { id: 1, title: 'Post Peak Time', text: 'Your audience is most active at 19:00 BRT. Schedule your next post for then.', icon: Clock },
              { id: 2, title: 'Content Format', text: 'Reels with "Behind the Scenes" process get 40% more engagement than static posts.', icon: Target },
              { id: 3, title: 'Hashtag Strategy', text: 'Stop using #design. Use #sportsdesign and #conceptkit for better reach.', icon: Share2 },
              { id: 4, title: 'Engagement Opportunity', text: 'You have 15 unanswered comments on your last Nike post. Respond now.', icon: MessageCircle },
            ].map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 group hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-2">
                  <insight.icon className="w-4 h-4 text-purple-neon" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">{insight.title}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{insight.text}</p>
              </div>
            ))}
          </div>
          
          <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            View Full Report
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Performance */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold tracking-tight text-white">Top Performing Content</h3>
          <button className="text-purple-neon text-sm font-bold hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: 1, title: 'Nike Concept 2024', views: '12.4K', engagement: '8.2%', image: 'https://picsum.photos/seed/growth1/400/300' },
            { id: 2, title: 'Red Bull Branding', views: '8.1K', engagement: '6.5%', image: 'https://picsum.photos/seed/growth2/400/300' },
            { id: 3, title: 'F1 Poster Series', views: '15.2K', engagement: '9.1%', image: 'https://picsum.photos/seed/growth3/400/300' },
            { id: 4, title: 'NBA Social Kit', views: '6.4K', engagement: '5.2%', image: 'https://picsum.photos/seed/growth4/400/300' },
          ].map((content) => (
            <div
              key={content.id}
              className="bg-surface-1 border border-white/5 rounded-xl overflow-hidden group hover:border-white/10 transition-all"
            >
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={content.image} 
                  alt={content.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                  <div className="flex justify-between text-xs font-bold text-white uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {content.views}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {content.engagement}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');
