import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Dumbbell,
  Zap,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
  Crown,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Calendar,
  ShieldCheck,
  Search,
  Activity,
  ArrowRight,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  WorkoutSession,
  CardioSession,
  CommunityChallenge,
  CommunityAthleteRank,
  CommunityChallengeCategory,
} from '../../types';
import { CommunityChallengeService } from '../../services/communityChallengeService';

interface CommunityChallengeSectionProps {
  profile: UserProfile;
  history?: WorkoutSession[];
  cardioHistory?: CardioSession[];
  onStartWorkout?: () => void;
}

export const CommunityChallengeSection: React.FC<CommunityChallengeSectionProps> = ({
  profile,
  history = [],
  cardioHistory = [],
  onStartWorkout,
}) => {
  const isAr = profile.language === 'ar';

  // Available challenges
  const challenges = useMemo(() => {
    return CommunityChallengeService.getChallenges(history, profile, cardioHistory);
  }, [history, profile, cardioHistory]);

  const [activeCategory, setActiveCategory] = useState<CommunityChallengeCategory>('squat_weight');
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | 'podium' | 'near_me'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [cheeredAthletes, setCheeredAthletes] = useState<Record<string, boolean>>({});

  // Active challenge details
  const activeChallenge = useMemo(() => {
    return challenges.find((c) => c.category === activeCategory) || challenges[0];
  }, [challenges, activeCategory]);

  // Dynamic leaderboard for active challenge
  const { ranks, currentUserRank, userStats } = useMemo(() => {
    return CommunityChallengeService.getLeaderboard(activeCategory, history, profile, cardioHistory);
  }, [activeCategory, history, profile, cardioHistory]);

  // Filtered leaderboard rows
  const displayedRanks = useMemo(() => {
    let list = [...ranks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.nameAr && a.nameAr.toLowerCase().includes(q)) ||
          a.countryName.toLowerCase().includes(q)
      );
    }

    if (leaderboardFilter === 'podium') {
      list = list.slice(0, 3);
    } else if (leaderboardFilter === 'near_me') {
      const myIdx = list.findIndex((a) => a.isCurrentUser);
      if (myIdx !== -1) {
        const start = Math.max(0, myIdx - 2);
        const end = Math.min(list.length, myIdx + 3);
        list = list.slice(start, end);
      }
    }

    return list;
  }, [ranks, leaderboardFilter, searchQuery]);

  // Top 3 Podium athletes
  const topPodium = useMemo(() => {
    return {
      first: ranks[0],
      second: ranks[1],
      third: ranks[2],
    };
  }, [ranks]);

  // Handle cheer / fist bump
  const handleCheer = (athleteId: string) => {
    if (cheeredAthletes[athleteId]) return;

    CommunityChallengeService.cheerAthlete(athleteId);
    setCheeredAthletes((prev) => ({ ...prev, [athleteId]: true }));

    // Burst of micro celebratory confetti
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
    });
  };

  // Handle manual sync of contribution
  const handleSyncContribution = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      await CommunityChallengeService.syncUserChallengeToFirestore(
        activeChallenge.id,
        userStats.contribution,
        profile
      );

      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#059669', '#facc15'],
      });

      setSyncMessage(
        isAr
          ? `تم تحديث مساهمتك بنجاح! رصيدك الحالي: ${userStats.contribution.toLocaleString()} ${activeChallenge.unitAr}`
          : `Contribution synchronized! Current score: ${userStats.contribution.toLocaleString()} ${activeChallenge.unit}`
      );
    } catch {
      setSyncMessage(isAr ? 'تم حفظ التحديث محلياً بنجاح' : 'Progress saved locally');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  // Progress percentage capped at 100% for bar, but show real % in text
  const progressPercent = Math.min(
    100,
    Math.round((activeChallenge.currentProgress / activeChallenge.targetGoal) * 1000) / 10
  );

  return (
    <section
      id="community-challenge-section"
      className="rounded-2xl border border-primary/20 bg-card/60 p-4 sm:p-6 lg:p-7 shadow-xl backdrop-blur-md transition-all duration-300 relative overflow-hidden"
    >
      {/* Background Ambience Glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: activeChallenge.accentColor }}
      />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary">
              <Users className="h-3.5 w-3.5" />
              <span>{isAr ? 'تحديات المجتمع الجماعية' : 'Community Challenges'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-500">
              <Calendar className="h-3 w-3" />
              <span>{isAr ? activeChallenge.monthAr : activeChallenge.month}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
              <Flame className="h-3 w-3" />
              <span>
                {isAr
                  ? `متبقي ${activeChallenge.daysRemaining} يوم`
                  : `${activeChallenge.daysRemaining} Days Left`}
              </span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{isAr ? activeChallenge.titleAr : activeChallenge.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            {isAr ? activeChallenge.descriptionAr : activeChallenge.description}
          </p>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            id="community-rules-btn"
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            <span>{isAr ? 'دليل التحدي' : 'Challenge Guide'}</span>
          </button>
          <button
            id="sync-contribution-btn"
            type="button"
            disabled={isSyncing}
            onClick={handleSyncContribution}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-2 text-xs font-semibold shadow-md hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث مساهمتي' : 'Sync My Volume'}</span>
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncMessage && (
        <div className="mt-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-400 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncMessage(null)}
            className="text-emerald-400/80 hover:text-emerald-400 font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Challenge Selector Tabs */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {challenges.map((challenge) => {
          const isSelected = challenge.category === activeCategory;
          const pct = Math.round((challenge.currentProgress / challenge.targetGoal) * 100);

          return (
            <button
              id={`challenge-tab-${challenge.category}`}
              key={challenge.id}
              type="button"
              onClick={() => {
                setActiveCategory(challenge.category);
                setShowBreakdown(false);
              }}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/40'
                  : 'border-border/50 bg-background/50 hover:bg-muted/40 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-lg">
                  {challenge.category === 'squat_weight' && '🏋️‍♂️'}
                  {challenge.category === 'push_volume' && '⚡'}
                  {challenge.category === 'total_sessions' && '🔥'}
                  {challenge.category === 'cardio_distance' && '🏃'}
                </span>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {pct}%
                </span>
              </div>
              <span className="text-xs font-bold text-foreground line-clamp-1">
                {isAr ? challenge.titleAr : challenge.title}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {challenge.targetGoal.toLocaleString()} {isAr ? challenge.unitAr : challenge.unit}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Group Progress Gauge & Milestones */}
      <div className="mt-6 rounded-xl border border-border/60 bg-background/70 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isAr ? 'الهدف الجماعي التراكمي' : 'Collective Group Milestone'}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {activeChallenge.currentProgress.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                / {activeChallenge.targetGoal.toLocaleString()} {isAr ? activeChallenge.unitAr : activeChallenge.unit}
              </span>
              <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30">
                {progressPercent}% {isAr ? 'مكتمل' : 'Reached'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span>
                <strong>{activeChallenge.totalParticipants}</strong> {isAr ? 'بطل مشارك' : 'Athletes'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span>
                <strong>
                  {Math.round(activeChallenge.currentProgress / (30 - activeChallenge.daysRemaining || 1)).toLocaleString()}
                </strong>{' '}
                {isAr ? 'يومياً' : '/ day'}
              </span>
            </div>
          </div>
        </div>

        {/* Big Visual Progress Bar with Milestones */}
        <div className="relative mt-4 pt-2 pb-6">
          <div className="h-3.5 w-full overflow-hidden rounded-full bg-muted/60 border border-border/60 relative">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out relative"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: activeChallenge.accentColor,
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          {/* Milestone Checkpoints */}
          <div className="relative w-full mt-2">
            {activeChallenge.milestones.map((m) => {
              const leftPos = m.percent;
              return (
                <div
                  key={m.percent}
                  className="absolute -top-6 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                  style={{ left: `${leftPos}%` }}
                >
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      m.unlocked
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                        : 'border-muted-foreground/40 bg-background text-muted-foreground'
                    }`}
                  >
                    {m.unlocked ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Lock className="h-2.5 w-2.5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-[10px] font-bold whitespace-nowrap hidden sm:block ${
                      m.unlocked ? 'text-emerald-500' : 'text-muted-foreground'
                    }`}
                  >
                    {m.percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-border/40 mt-2">
          {activeChallenge.milestones.map((m) => (
            <div
              key={m.percent}
              className={`rounded-xl border p-2.5 text-xs transition-all ${
                m.unlocked
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-border/40 bg-muted/20 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-extrabold text-[11px] ${
                    m.unlocked ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}
                >
                  {m.percent}% {isAr ? 'المرحلة' : 'Milestone'}
                </span>
                {m.unlocked ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                    {isAr ? 'مفتوح' : 'Unlocked'}
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                    {isAr ? 'مغلق' : 'Locked'}
                  </span>
                )}
              </div>
              <p className="font-semibold text-foreground text-[11px] line-clamp-1">
                {isAr ? m.rewardBadgeAr : m.rewardBadge}
              </p>
              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                {isAr ? m.labelAr : m.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Your Personal Standing & Impact Card */}
      <div className="mt-5 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-primary-foreground font-extrabold text-xl shadow-md border-2 border-white/20">
                {currentUserRank.avatarInitials}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary text-[11px] font-black text-primary shadow-sm">
                #{userStats.rank}
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                  {currentUserRank.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                  {isAr ? currentUserRank.tierLabelAr : currentUserRank.tierLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>
                  {isAr
                    ? `ترتيبك #${userStats.rank} من بين ${userStats.totalAthletes} متسابق في إيدي ب`
                    : `Your Rank: #${userStats.rank} of ${userStats.totalAthletes} EDDIEB FIT athletes`}
                </span>
                <span>•</span>
                <span className="text-primary font-semibold">
                  {isAr
                    ? `${userStats.percentageOfTotal}% من إجمالي الفريق`
                    : `${userStats.percentageOfTotal}% of group total`}
                </span>
              </p>
            </div>
          </div>

          {/* Personal Stats Pills */}
          <div className="flex items-center gap-2 sm:gap-3 self-start md:self-auto flex-wrap">
            <div className="rounded-xl bg-background/80 border border-border/60 px-3.5 py-2 text-center shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                {isAr ? 'مساهمتك' : 'Your Contribution'}
              </span>
              <span className="text-base sm:text-lg font-black text-primary">
                {userStats.contribution.toLocaleString()}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  {isAr ? activeChallenge.unitAr : activeChallenge.unit}
                </span>
              </span>
            </div>

            <div className="rounded-xl bg-background/80 border border-border/60 px-3.5 py-2 text-center shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
                {isAr ? 'الترتيب الشخصي' : 'Leaderboard Rank'}
              </span>
              <span className="text-base sm:text-lg font-black text-amber-500">
                #{userStats.rank}
                <span className="text-xs font-normal text-muted-foreground"> / {userStats.totalAthletes}</span>
              </span>
            </div>

            {userStats.behindByValue && userStats.nextRankAthleteName ? (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-left text-xs max-w-xs">
                <span className="text-[10px] text-amber-400 font-bold block">
                  {isAr ? 'الهدف القادم للتفوق' : 'Next Podium Target'}
                </span>
                <span className="text-amber-200 font-medium text-[11px] line-clamp-2">
                  {isAr
                    ? `يفصلك ${userStats.behindByValue.toLocaleString()} ${activeChallenge.unitAr} لتجاوز ${userStats.nextRankAthleteName} والصعود للمركز #${userStats.rank - 1}!`
                    : `Only ${userStats.behindByValue.toLocaleString()} ${activeChallenge.unit} behind ${userStats.nextRankAthleteName} to claim #${userStats.rank - 1}!`}
                </span>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-center">
                <span className="text-[10px] text-emerald-400 font-bold block">
                  {isAr ? 'الصدارة' : 'Status'}
                </span>
                <span className="text-emerald-300 font-extrabold text-xs">
                  {isAr ? '👑 أنت في القمة!' : '👑 Top Leader!'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contributing Exercises Dropdown Toggle */}
        {userStats.contributingExercises.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <button
              id="toggle-breakdown-btn"
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <span>
                {isAr
                  ? 'عرض التمارين المسجلة التي ساهمت في رصيدك'
                  : 'View exercises contributing to your score'}
              </span>
              {showBreakdown ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {showBreakdown && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 animate-fadeIn">
                {userStats.contributingExercises.map((ex, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-background/90 border border-border/60 p-2.5 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-foreground block">
                        {isAr && ex.nameAr ? ex.nameAr : ex.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {ex.setsCount} {isAr ? 'مجموعات' : 'sets'} • {ex.repsCount}{' '}
                        {isAr ? 'تكرار' : 'reps'}
                      </span>
                    </div>
                    <span className="font-black text-primary">
                      {ex.volumeKg.toLocaleString()} {isAr ? 'كجم' : 'kg'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top 3 Podium Display */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              {isAr ? 'منصة التتويج (أفضل 3 أبطال)' : 'Podium Leaders (Top 3)'}
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {isAr ? 'تحديث حي' : 'Live Sync'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2">
          {/* 2nd Place */}
          {topPodium.second && (
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-slate-700/80 border-2 border-slate-300 flex items-center justify-center text-white font-black text-sm sm:text-base shadow-md">
                  {topPodium.second.avatarInitials}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-[10px] font-black text-slate-900 shadow">
                  🥈
                </span>
              </div>
              <span className="text-xs font-bold text-foreground line-clamp-1">
                {topPodium.second.countryFlag} {topPodium.second.name}
              </span>
              <span className="text-xs font-extrabold text-slate-300 mt-0.5">
                {topPodium.second.contribution.toLocaleString()}{' '}
                <span className="text-[10px] font-normal text-muted-foreground">
                  {isAr ? activeChallenge.unitAr : activeChallenge.unit}
                </span>
              </span>
              <div className="w-full mt-2 h-14 sm:h-18 rounded-t-xl bg-gradient-to-t from-slate-800 to-slate-700/60 border-t-2 border-slate-300 flex items-center justify-center">
                <span className="text-xs font-black text-slate-300">2nd</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {topPodium.first && (
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <Crown className="h-5 w-5 text-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
                <div className="h-14 w-14 sm:h-18 sm:w-18 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 border-2 border-amber-300 flex items-center justify-center text-amber-950 font-black text-base sm:text-xl shadow-lg ring-2 ring-amber-400/40">
                  {topPodium.first.avatarInitials}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-amber-950 shadow">
                  🥇
                </span>
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-foreground line-clamp-1">
                {topPodium.first.countryFlag} {topPodium.first.name}
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-400 mt-0.5">
                {topPodium.first.contribution.toLocaleString()}{' '}
                <span className="text-[10px] font-normal text-muted-foreground">
                  {isAr ? activeChallenge.unitAr : activeChallenge.unit}
                </span>
              </span>
              <div className="w-full mt-2 h-20 sm:h-24 rounded-t-xl bg-gradient-to-t from-amber-900/80 to-amber-700/60 border-t-2 border-amber-400 flex items-center justify-center shadow-md">
                <span className="text-sm font-black text-amber-300">1st</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topPodium.third && (
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-2">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-amber-900/80 border-2 border-amber-600 flex items-center justify-center text-amber-200 font-black text-sm sm:text-base shadow-md">
                  {topPodium.third.avatarInitials}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-black text-white shadow">
                  🥉
                </span>
              </div>
              <span className="text-xs font-bold text-foreground line-clamp-1">
                {topPodium.third.countryFlag} {topPodium.third.name}
              </span>
              <span className="text-xs font-extrabold text-amber-500 mt-0.5">
                {topPodium.third.contribution.toLocaleString()}{' '}
                <span className="text-[10px] font-normal text-muted-foreground">
                  {isAr ? activeChallenge.unitAr : activeChallenge.unit}
                </span>
              </span>
              <div className="w-full mt-2 h-10 sm:h-12 rounded-t-xl bg-gradient-to-t from-amber-950 to-amber-900/60 border-t-2 border-amber-600 flex items-center justify-center">
                <span className="text-xs font-black text-amber-500">3rd</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Community Leaderboard Full Roster */}
      <div className="mt-6 rounded-2xl border border-border/60 bg-background/80 p-3 sm:p-5">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/50 self-start">
            <button
              id="filter-all-athletes-btn"
              type="button"
              onClick={() => setLeaderboardFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                leaderboardFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'جميع الأبطال' : 'All Athletes'} ({ranks.length})
            </button>
            <button
              id="filter-podium-btn"
              type="button"
              onClick={() => setLeaderboardFilter('podium')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                leaderboardFilter === 'podium'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'المتصدرين' : 'Podium Top 3'}
            </button>
            <button
              id="filter-near-me-btn"
              type="button"
              onClick={() => setLeaderboardFilter('near_me')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                leaderboardFilter === 'near_me'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? 'حوالي ترتيبي' : 'Near My Rank'}
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="search-athletes-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث عن بطل...' : 'Search athletes...'}
              className="w-full rounded-xl bg-background border border-border/60 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Table / List of Athletes */}
        <div className="divide-y divide-border/30">
          {displayedRanks.map((athlete) => {
            const isUser = athlete.isCurrentUser;
            const hasCheered = !!cheeredAthletes[athlete.id];

            return (
              <div
                key={athlete.id}
                id={`athlete-row-${athlete.id}`}
                className={`py-3 px-2 sm:px-3 rounded-xl transition-all flex items-center justify-between gap-2 sm:gap-4 ${
                  isUser
                    ? 'bg-primary/10 border-2 border-primary/40 shadow-xs my-1'
                    : 'hover:bg-muted/30'
                }`}
              >
                {/* Rank & Avatar & Name */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  <div className="w-6 sm:w-7 text-center font-black text-xs sm:text-sm">
                    {athlete.rank === 1 && '🥇'}
                    {athlete.rank === 2 && '🥈'}
                    {athlete.rank === 3 && '🥉'}
                    {athlete.rank > 3 && (
                      <span className={isUser ? 'text-primary font-extrabold' : 'text-muted-foreground'}>
                        #{athlete.rank}
                      </span>
                    )}
                  </div>

                  <div
                    className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                      isUser
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/40'
                        : 'bg-muted border border-border/60 text-foreground'
                    }`}
                  >
                    {athlete.avatarInitials}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                        {isAr && athlete.nameAr ? athlete.nameAr : athlete.name}
                      </span>
                      <span>{athlete.countryFlag}</span>
                      {isUser && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-primary text-primary-foreground">
                          {isAr ? 'أنت' : 'YOU'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span className="capitalize">{athlete.level}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                        <Flame className="h-2.5 w-2.5" />
                        {athlete.streakDays}d
                      </span>
                      <span>•</span>
                      <span>{isAr ? athlete.lastActiveTextAr : athlete.lastActiveText}</span>
                    </div>
                  </div>
                </div>

                {/* Score, Share, and Fist Bump Cheer */}
                <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                  <div className="text-right">
                    <span
                      className={`font-black text-xs sm:text-sm block ${
                        isUser ? 'text-primary font-extrabold' : 'text-foreground'
                      }`}
                    >
                      {athlete.contribution.toLocaleString()}{' '}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        {isAr ? activeChallenge.unitAr : activeChallenge.unit}
                      </span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {athlete.percentageOfTotal}% {isAr ? 'من المجموع' : 'share'}
                    </span>
                  </div>

                  {/* Fist Bump / Cheer Button */}
                  <button
                    id={`cheer-athlete-${athlete.id}`}
                    type="button"
                    disabled={isUser}
                    onClick={() => handleCheer(athlete.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                      isUser
                        ? 'opacity-40 cursor-default border-border/40 text-muted-foreground'
                        : hasCheered
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-background hover:bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground'
                    }`}
                    title={isUser ? '' : isAr ? 'أرسل تحية رياضية' : 'Send Fist Bump'}
                  >
                    <span>{hasCheered ? '🔥' : '👊'}</span>
                    <span className="text-[11px] font-bold">{athlete.cheersReceived}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Motivational Callout to Action */}
        <div className="mt-5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-primary/10 border border-primary/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <p className="text-xs text-foreground">
              {isAr
                ? 'كل تكرار ووزن ترفعه في تمرين اليوم يضاف فوراً إلى رصيد مجتمع إيدي ب ويرفع ترتيبك!'
                : 'Every rep and set logged in your workouts automatically adds to the EDDIEB community target and advances your rank!'}
            </p>
          </div>
          {onStartWorkout && (
            <button
              id="start-workout-from-challenge-btn"
              type="button"
              onClick={onStartWorkout}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-bold shadow-sm hover:bg-primary/90 transition-all shrink-0 self-start sm:self-auto"
            >
              <span>{isAr ? 'ابدأ تمرينك الآن' : 'Start Workout'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Challenge Rules & Guide Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {isAr ? 'دليل وقواعد تحديات مجتمع إيدي ب' : 'EDDIEB FIT Challenge Guide'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-foreground font-medium">
                {isAr
                  ? 'تحديات المجتمع هي أهداف جماعية شهرية يتعاون فيها كافة أبطال إيدي ب حول العالم لتحقيق أرقام قياسية مشتركة.'
                  : 'Community Challenges are monthly collective missions where EDDIEB FIT athletes worldwide unite to achieve monumental volume and endurance records.'}
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                  {isAr ? 'كيف يتم احتساب المساهمات؟' : 'How Are Contributions Calculated?'}
                </h4>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>
                    <strong>{isAr ? 'ملحمة السكوات:' : 'Squat Crusade:'}</strong>{' '}
                    {isAr
                      ? 'يتم احتساب مجموع (الوزن × التكرارات) لجميع تمارين السكوات، مكابس الأرجل، والسكوات الأمامي المسجلة.'
                      : 'Sums up total tonnage (Weight × Reps) for all Barbell, Goblet, Front, and Leg Press squats.'}
                  </li>
                  <li>
                    <strong>{isAr ? 'تحدي الدفع:' : 'Push Volume:'}</strong>{' '}
                    {isAr
                      ? 'يتم احتساب أوزان تمارين الصدر المستوي والعلوي ودفع الأكتاف والغطس.'
                      : 'Accumulates volume across all flat, incline, shoulder presses, and weighted dips.'}
                  </li>
                  <li>
                    <strong>{isAr ? 'الترتيب الشخصي:' : 'Personal Rank:'}</strong>{' '}
                    {isAr
                      ? 'يتم ترتيبك تلقائياً بحسب مساهمتك الفعلية مقارنة ببقية أبطال المجتمع مع تحديد الأوسمة المستحقة.'
                      : 'Updates dynamically as you log workouts, showing your exact place and gap to the podium.'}
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                <span className="font-bold text-amber-400 block mb-0.5">
                  {isAr ? 'أوسمة المجتمع الحصرية' : 'Exclusive Community Badges'}
                </span>
                <p>
                  {isAr
                    ? 'عند اكتمال كل مرحلة (25%، 50%، 75%، 100%)، يحصل جميع المشاركين الفعالين على وسام الشرف الخاص بالتحدي!'
                    : 'When the community unlocks 25%, 50%, 75%, and 100% milestones, all active contributors earn exclusive commemorative badges!'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                {isAr ? 'فهمت، جاهز للتحدي!' : 'Got It, Let’s Crush It!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
