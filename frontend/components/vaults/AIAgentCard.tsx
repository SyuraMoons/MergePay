'use client';

interface AIAgent {
  id: string;
  name: string;
  ens: string;
  agentId: string;
  avatar: string;
  tags: string[];
  trophies: number;
  stars: number;
  verified: boolean;
}

interface AIAgentCardProps {
  agent: AIAgent;
  isSelected: boolean;
  onSelect: () => void;
}

export function AIAgentCard({ agent, isSelected, onSelect }: AIAgentCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${isSelected
          ? 'border-[#F4673B] bg-gradient-to-br from-[#F4673B]/5 to-[#FF8A65]/5'
          : 'border-gray-200 hover:border-[#F4673B]/50 bg-white'
        }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl flex-shrink-0">
          {agent.avatar}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name & Verified Badge */}
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
            {agent.verified && (
              <span className="text-[#F4673B]" title="Verified on Unichain">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L9.19 4.81 5.5 5.5l.69 3.69L3 12l3.19 2.81-.69 3.69 3.69-.69L12 21l2.81-3.19 3.69.69-.69-3.69L21 12l-3.19-2.81.69-3.69-3.69.69L12 2zm-1.5 13.5L7 12l1.41-1.41L10.5 12.67l5.09-5.09L17 9l-6.5 6.5z" />
                </svg>
              </span>
            )}
          </div>

          {/* ENS & ID */}
          <p className="text-xs text-[#F4673B] font-medium">{agent.ens}</p>
          <p className="text-xs text-gray-400">{agent.agentId}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {agent.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Ratings */}
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <span className="text-amber-500">🏆</span>
              {agent.trophies}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <span className="text-amber-400">⭐</span>
              {agent.stars}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
