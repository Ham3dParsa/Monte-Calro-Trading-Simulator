import { createPRNG } from './prng.js';

export function runSingleSimulation(p, simIndex) {
            // Use the seeded random function
            const random = createPRNG(p.seed + simIndex); 
            
            let balance = p.initialBalance;
            let balanceWithoutWithdrawals = p.initialBalance;
            let riskBase = p.initialBalance;
            let nextStepUpTarget = riskBase * p.stepUpMultiplier;
            let totalWithdrawals = 0;
            let totalCommission = 0;
            let balanceAtLastWithdrawal = p.initialBalance;
            
            const dailyBalance = [p.initialBalance];
            const dailyBalanceWithoutWithdrawals = [p.initialBalance];
            const dailyDrawdowns = [];
            const eventLog = []; 
            const dailyStats = [{ wins: 0, losses: 0, pnl: 0, tradeCount: 0 }];
            
            let totalTrades = 0, wins = 0, losses = 0, grossProfit = 0, grossLoss = 0;
            let consecutiveWins = 0, maxConsecutiveWins = 0, currentWinStreakPL = 0, maxWinStreakPL = 0;
            let balanceAtWinStreakStart = 0, balanceAtLossStreakStart = 0;
            let maxWinStreakDetails = { count: 0, pnl: 0, startTrade: 0, endTrade: 0 };
            let maxLossStreakDetails = { count: 0, pnl: 0, startTrade: 0, endTrade: 0 };
            let consecutiveLosses = 0, maxConsecutiveLosses = 0, currentLossStreakPL = 0, maxLossStreakPL = 0;
            let tradeCounter = 0;
            let tradingDaysCount = 0;
            let activeTradingDaysCount = 0;
            let cumulativeR = 0;
            let totalR = 0;
            let daysInDrawdown = 0;
            let daysInDdFromPeak = 0;
            let currentDdStreak = 0;
            let maxDdStreak = 0;

            let slLimitHitCount = 0, tpLimitHitCount = 0, lossLimitHitCount = 0, profitTargetHitCount = 0;
            
            const startDate = new Date(p.startDate);

            for (let dayIndex = 1; dayIndex <= p.totalDays; dayIndex++) {
                let currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + dayIndex);
                
                const dayOfWeek = currentDate.getDay();
                const isWeekend = (dayOfWeek === 6) || (dayOfWeek === 0);
                
                let dailyProfit = 0;
                let dailyWins = 0;
                let dailyLosses = 0;
                let dailyTradeCount = 0;

                if (!isWeekend) {
                    tradingDaysCount++;
                    const startOfDayBalance = balanceWithoutWithdrawals;
                    let minBalanceDuringDay = startOfDayBalance;
                    
                    const numTrades = p.minTrades + Math.floor(random() * (p.maxTrades - p.minTrades + 1));
                    if (numTrades > 0) {
                        activeTradingDaysCount++;
                    }
                    
                    for (let j = 0; j < numTrades; j++) {
                        if (balance <= 0) break;

                        totalTrades++;
                        tradeCounter++;
                        dailyTradeCount++;
                        
                        let riskAmountInUSD;
                        if (p.isCompound) {
                            // منطق خالص و ایزوله شده برای ریسک مرکب
                            riskAmountInUSD = balance * p.riskPercent;
                        } else {
                            // منطق خالص و ایزوله شده برای ریسک ثابت / پله‌ای
                            riskAmountInUSD = riskBase * p.riskPercent;
                        }
                        if (riskAmountInUSD <= 0) continue;

                        let lotSize = null;
                        let stopLossInPips = null;
                        let commissionCost = 0;
                        let lossPerLot = 0; // *** FIX: Declaration moved to the outer scope

                        if (p.enableLotCalculation) {
                            const tickSize = p.assetType === 'gold' ? 0.01 : 0.00001;
                            const pointValuePerLot = p.contractSize * tickSize;
                            const stopLossInPoints = Math.round(p.minStopLossPoints + random() * (p.maxStopLossPoints - p.minStopLossPoints));
                            stopLossInPips = stopLossInPoints / 10;
                            lossPerLot = stopLossInPips * pointValuePerLot * 10; // *** FIX: Assignment without 'const'
                            
                            if (lossPerLot > 0) {
                                let calculatedLotSize = riskAmountInUSD / lossPerLot;
                                // حیاتی: شبیه‌سازی محدودیت بروکر با گرد کردن (به پایین) حجم لات به دو رقم اعشار
                                lotSize = Math.floor(calculatedLotSize * 100) / 100;
                                if (p.enableLotCap && lotSize > p.maxLotAllowed) {
                                    lotSize = p.maxLotAllowed;
                                }
                                if (lotSize < 0.01) continue;
                                commissionCost = lotSize * p.commissionPerLot;
                                balance -= commissionCost;
                                balanceWithoutWithdrawals -= commissionCost;
                                totalCommission += commissionCost;
                            }
                        }

                        // --- START: Final replacement block for PNL calculation logic ---
                        let tradeResult, tradeType, rMultiple;
                        let finalRiskForPNL; // متغیر جدید برای ریسک نهایی

                        if (p.enableLotCalculation && lotSize != null && lossPerLot > 0) {
                            // در حالت محاسبه لات، ریسک واقعی همیشه از لات نهایی محاسبه می‌شود.
                            // این حالت، مشکل سقف لات را به طور کامل حل می‌کند.
                            finalRiskForPNL = lotSize * lossPerLot;
                        } else {
                            // اگر محاسبه لات خاموش باشد، از همان ریسک درصدی اولیه استفاده می‌کنیم.
                            finalRiskForPNL = riskAmountInUSD;
                        }

                        if (random() < p.winRate) {
                            // محاسبه سود بر اساس ریسک نهایی
                            tradeResult = finalRiskForPNL * p.rrRatio;
                            rMultiple = p.rrRatio;
                            tradeType = 'win';
                            wins++; dailyWins++; grossProfit += tradeResult;

                            // --- Streak Logic for Wins ---
                            if (consecutiveLosses > 0) {
                                const streakPnl = (balanceWithoutWithdrawals + commissionCost) - balanceAtLossStreakStart;
                                if (streakPnl < maxLossStreakDetails.pnl) {
                                    maxLossStreakDetails = { count: consecutiveLosses, pnl: streakPnl, startTrade: tradeCounter - consecutiveLosses, endTrade: tradeCounter - 1 };
                                }
                            }
                            consecutiveLosses = 0;
                            if (consecutiveWins === 0) {
                                balanceAtWinStreakStart = balanceWithoutWithdrawals + commissionCost;
                            }
                            consecutiveWins++;
                        } else {
                            // محاسبه ضرر بر اساس ریسک نهایی
                            tradeResult = -finalRiskForPNL;
                            rMultiple = -1;
                            tradeType = 'loss';
                            losses++; dailyLosses++; grossLoss += tradeResult;

                            // --- Streak Logic for Losses ---
                            if (consecutiveWins > 0) {
                                const streakPnl = (balanceWithoutWithdrawals + commissionCost) - balanceAtWinStreakStart;
                                if (streakPnl > maxWinStreakDetails.pnl) {
                                    maxWinStreakDetails = { count: consecutiveWins, pnl: streakPnl, startTrade: tradeCounter - consecutiveWins, endTrade: tradeCounter - 1 };
                                }
                            }
                            consecutiveWins = 0;
                            if (consecutiveLosses === 0) {
                                balanceAtLossStreakStart = balanceWithoutWithdrawals + commissionCost;
                            }
                            consecutiveLosses++;
                        }

                        // --- Update Max Streaks (this should be outside the win/loss blocks) ---
                        if (consecutiveWins > maxConsecutiveWins) maxConsecutiveWins = consecutiveWins;
                        if (consecutiveLosses > maxConsecutiveLosses) maxConsecutiveLosses = consecutiveLosses;
                        // --- END: Final replacement block ---

                        cumulativeR += rMultiple;
                        totalR += rMultiple;
                        if(consecutiveWins > maxConsecutiveWins) maxConsecutiveWins = consecutiveWins;
                        if(consecutiveLosses > maxConsecutiveLosses) maxConsecutiveLosses = consecutiveLosses;
                        
                        balanceWithoutWithdrawals += tradeResult;
                        balance += tradeResult;
                        dailyProfit += tradeResult;
                        minBalanceDuringDay = Math.min(minBalanceDuringDay, balanceWithoutWithdrawals);

                        eventLog.push({
                            id: tradeCounter, date: currentDate, dayIndex, type: tradeType,
                            amount: tradeResult, cumulativeR, balanceAfter: balance > 0 ? balance : 0,
                            lotSize, stopLossInPips, commission: commissionCost
                        });
                        
                        // --- REVISED DAILY LIMIT LOGIC V2 ---
                        let limitHit = false;
                        let limitType = null;

                        // Check limits after the trade. Prioritize percentage limits.
                        const postTradePnl = balanceWithoutWithdrawals - startOfDayBalance;
                        const dailyLimitBase = p.dailyLimitBasis === 'initial' ? p.initialBalance : startOfDayBalance;
                        const postTradeProfitPercent = dailyLimitBase > 0 ? (postTradePnl / dailyLimitBase) * 100 : 0;

                        if (p.enableDailyLossLimit && postTradeProfitPercent <= -p.dailyLossLimit) {
                            limitHit = true;
                            limitType = 'loss_limit_hit';
                            lossLimitHitCount++;
                        } else if (p.enableDailyProfitTarget && postTradeProfitPercent >= p.dailyProfitTarget) {
                            limitHit = true;
                            limitType = 'profit_target_hit';
                            profitTargetHitCount++;
                        } else if (p.enableMaxDailySL && dailyLosses >= p.maxDailySL) {
                            limitHit = true;
                            limitType = 'sl_limit_hit';
                            slLimitHitCount++;
                        } else if (p.enableMaxDailyTP && dailyWins >= p.maxDailyTP) {
                            limitHit = true;
                            limitType = 'tp_limit_hit';
                            tpLimitHitCount++;
                        }

                        // If a limit was hit, log it and break the loop for the day.
                        if (limitHit) {
                            eventLog.push({
                                id: ++tradeCounter, date: currentDate, dayIndex, type: limitType,
                                amount: 0, cumulativeR, balanceAfter: balance,
                                lotSize: null, stopLossInPips: null, commission: 0
                            });
                            break; // Exit the trade loop for the day
                        }
                    } // End of daily trade loop
                    
                    const dailyDdValue = startOfDayBalance - minBalanceDuringDay;
                    dailyDrawdowns.push({ dd: dailyDdValue, base: startOfDayBalance, dayIndex: dayIndex });
                }
                
                if (balanceWithoutWithdrawals < p.initialBalance) {
                    daysInDrawdown++;
                }
                
                // Days in Drawdown from Peak
                if (balanceWithoutWithdrawals < dailyBalanceWithoutWithdrawals[dailyBalanceWithoutWithdrawals.length - 2]) {
                     daysInDdFromPeak++;
                     currentDdStreak++;
                } else {
                     if (currentDdStreak > maxDdStreak) {
                         maxDdStreak = currentDdStreak;
                     }
                     currentDdStreak = 0;
                }
                

                dailyStats.push({ wins: dailyWins, losses: dailyLosses, pnl: dailyProfit, tradeCount: dailyTradeCount });
                
                if(currentWinStreakPL > maxWinStreakPL) maxWinStreakPL = currentWinStreakPL;
                if(currentLossStreakPL < maxLossStreakPL) maxLossStreakPL = currentLossStreakPL;
                
                if (p.withdrawEnabled && !isWeekend && (tradingDaysCount % (p.withdrawalPeriodWeeks * 5) === 0) && tradingDaysCount > 0) {
                    const profitSinceLast = balance - balanceAtLastWithdrawal;
                    let shouldWithdraw = false;
                    if (balanceAtLastWithdrawal <= 500) { shouldWithdraw = profitSinceLast >= 10; } 
                    else { shouldWithdraw = (profitSinceLast > 0) && ((profitSinceLast / balanceAtLastWithdrawal) >= 0.03); }
                    if (shouldWithdraw) {
                        const withdrawalAmount = profitSinceLast * p.withdrawalPercent;
                        if (withdrawalAmount > 0) {
                            balance -= withdrawalAmount;
                            totalWithdrawals += withdrawalAmount;
                            tradeCounter++;
                            eventLog.push({ id: tradeCounter, date: currentDate, dayIndex, type: 'withdrawal', amount: -withdrawalAmount, cumulativeR, balanceAfter: balance > 0 ? balance : 0, lotSize: null, stopLossInPips: null, commission: 0 });
                            balanceAtLastWithdrawal = balance > 0 ? balance : 0;
                        }
                    }
                }
    
                if (!p.isCompound && p.stepUpEnabled && balanceWithoutWithdrawals >= nextStepUpTarget) {
                    riskBase = balanceWithoutWithdrawals;
                    nextStepUpTarget = riskBase * p.stepUpMultiplier;
                }
                
                dailyBalance.push(balance > 0 ? balance : 0);
                dailyBalanceWithoutWithdrawals.push(balanceWithoutWithdrawals > 0 ? balanceWithoutWithdrawals : 0);
            }
            // Final check for any ongoing streak at the end of the simulation
            if (consecutiveWins > 0) {
                const streakPnl = balanceWithoutWithdrawals - balanceAtWinStreakStart;
                if (streakPnl > maxWinStreakDetails.pnl) {
                    maxWinStreakDetails = {
                        count: consecutiveWins,
                        pnl: streakPnl,
                        startTrade: tradeCounter - consecutiveWins, // CORRECTED
                        endTrade: tradeCounter
                    };
                }
            }
            if (consecutiveLosses > 0) {
                const streakPnl = balanceWithoutWithdrawals - balanceAtLossStreakStart;
                if (streakPnl < maxLossStreakDetails.pnl) {
                    maxLossStreakDetails = {
                        count: consecutiveLosses,
                        pnl: streakPnl,
                        startTrade: tradeCounter - consecutiveLosses, // CORRECTED
                        endTrade: tradeCounter
                    };
                }
            }
            if (currentDdStreak > maxDdStreak) { maxDdStreak = currentDdStreak; }
            return { 
                balances: dailyBalance, balancesWithoutWithdrawals: dailyBalanceWithoutWithdrawals,
                dailyDrawdowns, eventLog, dailyStats,
                totalWins: wins, totalLosses: losses, grossProfit, grossLoss, totalCommission,
                tradingDaysCount, activeTradingDaysCount, daysInDrawdown, daysInDdFromPeak, maxDdStreak,
                totalR, totalWithdrawals,
                maxConsecutiveWins, maxWinStreakDetails, maxConsecutiveLosses, maxLossStreakDetails,
                slLimitHitCount, tpLimitHitCount, lossLimitHitCount, profitTargetHitCount
            };
        }
