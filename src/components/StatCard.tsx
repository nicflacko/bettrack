import React from 'react';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  valueColor?: 'default' | 'green' | 'red' | 'blue' | 'purple' | 'orange';
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  badge?: string;
  badgeColor?: string;
}

const VALUE_COLORS = {
  default: 'text-gray-900',
  green:   'text-[#34C759]',
  red:     'text-[#FF3B30]',
  blue:    'text-[#007AFF]',
  purple:  'text-[#AF52DE]',
  orange:  'text-[#FF9F0A]',
};

export const StatCard = ({
  title, value, subtitle, valueColor = 'default',
  icon, iconBg = 'bg-blue-50', iconColor = 'text-blue-500',
  badge, badgeColor = 'bg-green-50 text-green-600',
}: Props) => (
  <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-default">
    <div className="flex items-start justify-between mb-3">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-none">
        {title}
      </p>
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} shrink-0`}>
        {icon}
      </div>
    </div>

    <p className={`text-[26px] font-bold tracking-tight leading-none mb-1 ${VALUE_COLORS[valueColor]}`}>
      {value}
    </p>

    <div className="flex items-center gap-2 mt-1.5">
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      {badge && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>
  </div>
);
