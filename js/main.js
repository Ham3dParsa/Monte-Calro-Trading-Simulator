    document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let simulationState = {
        isRunning: false, isPaused: false, isComplete: false, allSimulations: [], fullStats: [], params: {}, chartDates: [], singleChartMode: 'single', randomSimIndices: [], maxSimulatedDays: 0,
        candidates: {
            finalBalance: { best: { val: -Infinity, idx: -1 }, worst: { val: Infinity, idx: -1 } },
            maxDrawdown: { best: { val: Infinity, idx: -1, p: -1 }, worst: { val: -Infinity, idx: -1, p: -1 } },
            relativeDdPercent: { best: { val: Infinity, idx: -1 }, worst: { val: -Infinity, idx: -1 } },
            daysInDrawdown: { best: { val: Infinity, idx: -1 }, worst: { val: -Infinity, idx: -1 } },
            maxConsecutiveWins: { best: { val: -Infinity, idx: -1 }, worst: { val: Infinity, idx: -1 } },
            maxConsecutiveLosses: { best: { val: Infinity, idx: -1 }, worst: { val: -Infinity, idx: -1 } }
        },
        ui: {
            maxDrawdownCandidateUnit: 'percent' // 'percent' or 'usd'
        }
    };
    let balanceChart, singleSimChart;
    let simulationWorker = null;

    // --- DOM Elements ---
    const allInputEls = document.querySelectorAll('.input-field, .select-field, input[type="checkbox"], .toggle-btn-group button');
    const initialBalanceEl = document.getElementById('initialBalance');
    const usdToIrtEl = document.getElementById('usdToIrt');
    const riskPercentEl = document.getElementById('riskPercent');
    const riskTypeCompoundBtn = document.getElementById('riskTypeCompound');
    const riskTypeFixedBtn = document.getElementById('riskTypeFixed');
    const stepUpRiskGroup = document.getElementById('stepUpRiskGroup');
    const enableStepUpEl = document.getElementById('enableStepUp');
    const stepUpMultiplierEl = document.getElementById('stepUpMultiplier');
    const winRateEl = document.getElementById('winRate');
    const rrRatioRewardEl = document.getElementById('rrRatioReward');
    const minDailyTradesEl = document.getElementById('minDailyTrades');
    const maxDailyTradesEl = document.getElementById('maxDailyTrades');
    const dailyTradesErrorEl = document.getElementById('dailyTradesError');
    const simulationModeTimeEl = document.getElementById('simulationModeTime');
    const simulationModeTradesEl = document.getElementById('simulationModeTrades');
    const tradeTargetGroup = document.getElementById('tradeTargetGroup');
    const durationGroup = document.getElementById('durationGroup');
    const targetTradesEl = document.getElementById('targetTrades');
    const showTradeTimeEstimateEl = document.getElementById('showTradeTimeEstimate');
    const tradeTimeEstimateEl = document.getElementById('tradeTimeEstimate');
    const durationValueEl = document.getElementById('durationValue');
    const durationUnitEl = document.getElementById('durationUnit');
    const enableWithdrawalsEl = document.getElementById('enableWithdrawals');
    const withdrawalPeriodEl = document.getElementById('withdrawalPeriod');
    const withdrawalPercentEl = document.getElementById('withdrawalPercent');
    const numSimulationsEl = document.getElementById('numSimulations');
    const simulationsWarningEl = document.getElementById('simulationsWarning');
    const simulationsTooltipEl = document.getElementById('simulationsTooltip');
    const simulationSeedEl = document.getElementById('simulationSeed');
    const preserveSeedEl = document.getElementById('preserveSeed');
    const newSeedBtn = document.getElementById('newSeedBtn');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const resultsSection = document.getElementById('results-section');
    const chartCanvas = document.getElementById('balanceChart');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const summaryTableHeader = document.getElementById('summary-table-header');
    const summaryTableContainer = document.getElementById('summary-table-container');
    const summaryCollapseIcon = document.querySelector('.summary-collapse-icon');
    const summaryTableHead = document.getElementById('summary-table-head');
    const chartTabs = document.getElementById('chart-tabs');
    const scaleLinearBtn = document.getElementById('scale-linear');
    const scaleLogBtn = document.getElementById('scale-log');
    const simSelectorEl = document.getElementById('sim-selector');
    const prevSimBtn = document.getElementById('prev-sim-btn');
    const nextSimBtn = document.getElementById('next-sim-btn');
    const singleSimChartCanvas = document.getElementById('singleSimChart');
    const singleSimChartTabs = document.getElementById('single-sim-chart-tabs');
    const singleScaleLinearBtn = document.getElementById('single-scale-linear');
    const singleScaleLogBtn = document.getElementById('single-scale-log');
    const multiSimControls = document.getElementById('multi-sim-controls');
    const newRandomBtn = document.getElementById('new-random-btn');
    const showSingleSimBtn = document.getElementById('show-single-sim-btn');
    const singleSimControls = document.getElementById('single-sim-controls');
    const inDepthStatsContainer = document.getElementById('in-depth-stats-container');
    const overallStatsInfo = document.getElementById('overall-stats-info');
    const panelsContainer = document.getElementById('panels-container');
    const tradeLogSection = document.getElementById('trade-log-section');
    const tradeLogHeader = document.getElementById('trade-log-header');
    const tradeLogContainer = document.getElementById('trade-log-container');
    const tradeLogHead = document.getElementById('tradeLogHead');
    const tradeLogBody = document.getElementById('tradeLogBody');
    const tradeLogCollapseIcon = document.querySelector('.trade-log-collapse-icon');
    const multiSimLegendContainer = document.getElementById('multi-sim-legend-container');
    const customTooltipEl = document.getElementById('custom-tooltip');
    const enableMaxDailySLEl = document.getElementById('enableMaxDailySL');
    const maxDailySLEl = document.getElementById('maxDailySL');
    const enableMaxDailyTPEl = document.getElementById('enableMaxDailyTP');
    const maxDailyTPEl = document.getElementById('maxDailyTP');
    const enableDailyLossLimitEl = document.getElementById('enableDailyLossLimit');
    const dailyLossLimitEl = document.getElementById('dailyLossLimit');
    const enableDailyProfitTargetEl = document.getElementById('enableDailyProfitTarget');
    const dailyProfitTargetEl = document.getElementById('dailyProfitTarget');
    const dailyLimitBasisFloatingBtn = document.getElementById('dailyLimitBasisFloating');
    const dailyLimitBasisInitialBtn = document.getElementById('dailyLimitBasisInitial');
    const dailyLimitBasisGroupEl = document.getElementById('dailyLimitBasisGroup');
    const enableLotCalculationEl = document.getElementById('enableLotCalculation');
    const executionSettingsEl = document.getElementById('executionSettings');
    const assetTypeEl = document.getElementById('assetType');
    const assetPriceEl = document.getElementById('assetPrice');
    const minStopLossPointsEl = document.getElementById('minStopLossPoints');
    const maxStopLossPointsEl = document.getElementById('maxStopLossPoints');
    const stopLossErrorEl = document.getElementById('stopLossError');
    const contractSizeEl = document.getElementById('contractSize');
    const commissionPerLotEl = document.getElementById('commissionPerLot');
    const enableLotCapEl = document.getElementById('enableLotCap');
    const maxLotAllowedEl = document.getElementById('maxLotAllowed');
    const percentileStatsContainer = document.getElementById('percentile-stats-summary-container');
    const fullscreenContainer = document.getElementById('fullscreen-container');
    const fullscreenChartContainer = document.getElementById('fullscreen-chart-container');
    const fullscreenTabsContainer = document.getElementById('fullscreen-tabs');
    const exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');
    const exportSection = document.getElementById('export-section');
    const exportSummaryBtn = document.getElementById('exportSummaryBtn');
    const exportLogsBtn = document.getElementById('exportLogsBtn');
    const rankingPanel = document.getElementById('ranking-panel');
    const sortMetricEl = document.getElementById('sort-metric');
    const sortDescBtn = document.getElementById('sort-desc');
    const sortAscBtn = document.getElementById('sort-asc');
    const rankingStatsSummaryEl = document.getElementById('ranking-stats-summary');
    const rankingTableHeadEl = document.getElementById('ranking-table-head');
    const rankingTableBodyEl = document.getElementById('ranking-table-body');
    const mainChartControls = document.getElementById('main-chart-controls');
    const singleChartControls = document.getElementById('single-chart-controls');
    const mainResetZoomBtn = document.getElementById('main-reset-zoom');
    const singleResetZoomBtn = document.getElementById('single-reset-zoom');
    const fontSizeToggleBtn = document.getElementById('fontSizeToggle');
    const mobileNav = document.getElementById('mobile-bottom-nav');
    const navButtons = document.querySelectorAll('[data-nav-target]');
    const navSections = document.querySelectorAll('[data-nav-section]');
    let currentNavTarget = 'config';

    const LS_PARAMS_KEY = 'tradingSimParams_v30_final';
    const LS_FONT_SIZE_KEY = 'tradingSimFontSize_v1';
    const FONT_SIZE_CLASSES = ['font-size-normal', 'font-size-large', 'font-size-xlarge'];

    function restoreFontSizePreference() {
        const saved = localStorage.getItem(LS_FONT_SIZE_KEY);
        if (saved && FONT_SIZE_CLASSES.includes(saved)) {
            const root = document.documentElement;
            FONT_SIZE_CLASSES.forEach(cls => root.classList.remove(cls));
            root.classList.add(saved);
        }
    }

    function cycleFontSizePreference() {
        const root = document.documentElement;
        const currentIndex = FONT_SIZE_CLASSES.findIndex(cls => root.classList.contains(cls));
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % FONT_SIZE_CLASSES.length;
        const targetClass = FONT_SIZE_CLASSES[nextIndex];
        FONT_SIZE_CLASSES.forEach(cls => root.classList.remove(cls));
        root.classList.add(targetClass);
        localStorage.setItem(LS_FONT_SIZE_KEY, targetClass);
    }

    function isSectionVisibleForTarget(section, target) {
        const keys = (section.dataset.navSection || '').split(',').map(t => t.trim()).filter(Boolean);
        return keys.includes(target);
    }

    function resizeVisibleCharts() {
        if (balanceChart && typeof balanceChart.resize === 'function') {
            balanceChart.resize();
        }
        if (singleSimChart && typeof singleSimChart.resize === 'function') {
            singleSimChart.resize();
        }
    }

    function applyNavVisibility(target = currentNavTarget) {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        currentNavTarget = target;
        navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.navTarget === target));
        navSections.forEach(section => {
            if (!isMobile) {
                section.style.display = '';
                section.classList.add('active-mobile');
                return;
            }
            const isActive = isSectionVisibleForTarget(section, target);
            section.classList.toggle('active-mobile', isActive);
            section.style.display = isActive ? '' : 'none';
        });

        // Ensure charts get a resize pass after sections toggle visibility (especially on touch devices)
        requestAnimationFrame(() => resizeVisibleCharts());
    }

    function saveParamsToLocalStorage() {
        const paramsToSave = {
            initialBalance: initialBalanceEl.value, usdToIrt: usdToIrtEl.value, riskPercent: riskPercentEl.value,
            riskType: riskTypeFixedBtn.classList.contains('active') ? 'fixed' : 'compound',
            enableStepUp: enableStepUpEl.checked, stepUpMultiplier: stepUpMultiplierEl.value,
            winRate: winRateEl.value, rrRatioReward: rrRatioRewardEl.value,
            simulationMode: simulationModeTradesEl.checked ? 'trades' : 'time',
            targetTrades: targetTradesEl.value, showTradeTimeEstimate: showTradeTimeEstimateEl.checked,
            minDailyTrades: minDailyTradesEl.value, maxDailyTrades: maxDailyTradesEl.value,
            durationValue: durationValueEl.value, durationUnit: durationUnitEl.value,
            enableWithdrawals: enableWithdrawalsEl.checked, withdrawalPeriod: withdrawalPeriodEl.value, withdrawalPercent: withdrawalPercentEl.value,
            numSimulations: numSimulationsEl.value, simulationSeed: simulationSeedEl.value, preserveSeed: preserveSeedEl.checked,
            enableMaxDailySL: enableMaxDailySLEl.checked, maxDailySL: maxDailySLEl.value,
            enableMaxDailyTP: enableMaxDailyTPEl.checked, maxDailyTP: maxDailyTPEl.value,
            enableDailyLossLimit: enableDailyLossLimitEl.checked, dailyLossLimit: dailyLossLimitEl.value,
            enableDailyProfitTarget: enableDailyProfitTargetEl.checked, dailyProfitTarget: dailyProfitTargetEl.value,
            dailyLimitBasis: dailyLimitBasisFloatingBtn.classList.contains('active') ? 'floating' : 'initial',
            enableLotCalculation: enableLotCalculationEl.checked, assetType: assetTypeEl.value, assetPrice: assetPriceEl.value,
            minStopLossPoints: minStopLossPointsEl.value, maxStopLossPoints: maxStopLossPointsEl.value,
            contractSize: contractSizeEl.value, commissionPerLot: commissionPerLotEl.value,
            enableLotCap: enableLotCapEl.checked, maxLotAllowed: maxLotAllowedEl.value,
        };
        localStorage.setItem(LS_PARAMS_KEY, JSON.stringify(paramsToSave));
    }

    function loadParamsFromLocalStorage() {
        const savedParams = JSON.parse(localStorage.getItem(LS_PARAMS_KEY));
        if (!savedParams) {
            // Set defaults for a fresh start
            enableLotCapEl.checked = true; // Default to checked
            numSimulationsEl.value = '500'; 
            updateRiskTypeUI(); 
            updateDailyLimitsUI(); 
            updateExecutionSettingsUI(); 
            updateSimulationsLimit(); 
            return;
        };
        initialBalanceEl.value = savedParams.initialBalance || '1000';
        usdToIrtEl.value = savedParams.usdToIrt || '92000';
        riskPercentEl.value = savedParams.riskPercent || '0.65';
        if (savedParams.riskType === 'compound') { riskTypeCompoundBtn.classList.add('active'); riskTypeFixedBtn.classList.remove('active'); } 
        else { riskTypeFixedBtn.classList.add('active'); riskTypeCompoundBtn.classList.remove('active'); }
        enableStepUpEl.checked = savedParams.enableStepUp || false;
        stepUpMultiplierEl.value = savedParams.stepUpMultiplier || '1.5';
        winRateEl.value = savedParams.winRate || '60';
        rrRatioRewardEl.value = savedParams.rrRatioReward || '2.5';
        const mode = savedParams.simulationMode === 'trades' ? 'trades' : 'time';
        if (mode === 'trades') { simulationModeTradesEl.checked = true; simulationModeTimeEl.checked = false; }
        else { simulationModeTimeEl.checked = true; simulationModeTradesEl.checked = false; }
        targetTradesEl.value = savedParams.targetTrades || '500';
        showTradeTimeEstimateEl.checked = savedParams.showTradeTimeEstimate || false;
        minDailyTradesEl.value = savedParams.minDailyTrades || '0';
        maxDailyTradesEl.value = savedParams.maxDailyTrades || '5';
        durationValueEl.value = savedParams.durationValue || '12';
        durationUnitEl.value = savedParams.durationUnit || 'months';
        enableWithdrawalsEl.checked = savedParams.enableWithdrawals || false;
        withdrawalPeriodEl.value = savedParams.withdrawalPeriod || '2';
        withdrawalPercentEl.value = savedParams.withdrawalPercent || '50';
        numSimulationsEl.value = savedParams.numSimulations || '500';
        simulationSeedEl.value = savedParams.simulationSeed || '';
        preserveSeedEl.checked = savedParams.preserveSeed || false;
        enableMaxDailySLEl.checked = savedParams.enableMaxDailySL === true;
        maxDailySLEl.value = savedParams.maxDailySL || '2';
        enableMaxDailyTPEl.checked = savedParams.enableMaxDailyTP === true;
        maxDailyTPEl.value = savedParams.maxDailyTP || '3';
        enableDailyLossLimitEl.checked = savedParams.enableDailyLossLimit === true;
        dailyLossLimitEl.value = savedParams.dailyLossLimit || '2';
        enableDailyProfitTargetEl.checked = savedParams.enableDailyProfitTarget === true;
        dailyProfitTargetEl.value = savedParams.dailyProfitTarget || '4';
        if (savedParams.dailyLimitBasis === 'initial') { dailyLimitBasisInitialBtn.classList.add('active'); dailyLimitBasisFloatingBtn.classList.remove('active'); } 
        else { dailyLimitBasisFloatingBtn.classList.add('active'); dailyLimitBasisInitialBtn.classList.remove('active'); }
        enableLotCalculationEl.checked = savedParams.enableLotCalculation === true;
        assetTypeEl.value = savedParams.assetType || 'gold';
        assetPriceEl.value = savedParams.assetPrice || '3500';
        minStopLossPointsEl.value = savedParams.minStopLossPoints || '30';
        maxStopLossPointsEl.value = savedParams.maxStopLossPoints || '65';
        contractSizeEl.value = savedParams.contractSize || '100';
        commissionPerLotEl.value = savedParams.commissionPerLot || '7';
        // Handle the new default for lot cap
        enableLotCapEl.checked = typeof savedParams.enableLotCap === 'boolean' ? savedParams.enableLotCap : true;
        maxLotAllowedEl.value = savedParams.maxLotAllowed || '100';
        updateRiskTypeUI(); updateDailyLimitsUI(); updateExecutionSettingsUI(); updateSimulationsLimit(); updateSimulationModeUI();
        updateTradeTimeEstimate();
    }
    
    function updateSimulationsLimit() {
        if (simulationModeTradesEl.checked) {
            const maxSims = 3500;
            numSimulationsEl.max = maxSims;
            simulationsWarningEl.textContent = `حداکثر تعداد مجاز در حالت معاملات: ${maxSims}`;
            simulationsTooltipEl.innerHTML = `تعداد بالاتر نتایج آماری دقیق‌تری می‌دهد اما زمان بیشتری می‌برد. <br><strong>توصیه می‌شود حدود ۵۰۰ انتخاب شود.</strong>`;
            if (parseInt(numSimulationsEl.value) > maxSims) numSimulationsEl.value = maxSims;
            return;
        }
        const durationVal = parseInt(durationValueEl.value);
        const durationUnit = durationUnitEl.value;
        const totalYears = durationUnit === 'years' ? durationVal : durationVal / 12;
        let maxSims;
        if (totalYears >= 5) maxSims = 1000;
        else if (totalYears >= 2) maxSims = 2000;
        else maxSims = 3500;
        numSimulationsEl.max = maxSims;
        simulationsWarningEl.textContent = `حداکثر تعداد مجاز برای این بازه: ${maxSims}`;
        simulationsTooltipEl.innerHTML = `تعداد بالاتر نتایج آماری دقیق‌تری می‌دهد اما زمان بیشتری می‌برد. <br><strong>توصیه می‌شود حدود ۵۰۰ انتخاب شود.</strong>`;
        if (parseInt(numSimulationsEl.value) > maxSims) numSimulationsEl.value = maxSims;
    }

    function validateInputs() {
        let isValid = true;
        document.querySelectorAll('.input-field.invalid, .error-message').forEach(el => {
            el.classList.remove('invalid');
            if (el.classList.contains('error-message')) el.style.display = 'none';
        });
        const minTrades = parseInt(minDailyTradesEl.value);
        const maxTrades = parseInt(maxDailyTradesEl.value);
        if (minTrades > maxTrades) {
            isValid = false; minDailyTradesEl.classList.add('invalid'); maxDailyTradesEl.classList.add('invalid'); dailyTradesErrorEl.style.display = 'block';
        }
        if (simulationModeTradesEl.checked) {
            const targetTrades = parseInt(targetTradesEl.value);
            if (!targetTrades || targetTrades <= 0) { isValid = false; targetTradesEl.classList.add('invalid'); }
        }
        if (enableLotCalculationEl.checked) {
            const minSL = parseInt(minStopLossPointsEl.value); const maxSL = parseInt(maxStopLossPointsEl.value);
            if (minSL > maxSL) {
                isValid = false; minStopLossPointsEl.classList.add('invalid'); maxStopLossPointsEl.classList.add('invalid'); stopLossErrorEl.style.display = 'block';
            }
        }
        document.querySelectorAll('input[type="number"]').forEach(input => {
            if (input.value === '' || parseFloat(input.value) < 0) { isValid = false; input.classList.add('invalid'); }
        });
        return isValid;
    }
    
    function updateRiskTypeUI() {
        const isFixed = riskTypeFixedBtn.classList.contains('active');
        stepUpRiskGroup.classList.toggle('disabled', !isFixed);
        if (!isFixed) enableStepUpEl.checked = false;
        stepUpMultiplierEl.disabled = !isFixed || !enableStepUpEl.checked;
    }
    
    function updateDailyLimitsUI() {
        maxDailySLEl.disabled = !enableMaxDailySLEl.checked;
        maxDailyTPEl.disabled = !enableMaxDailyTPEl.checked;
        dailyLossLimitEl.disabled = !enableDailyLossLimitEl.checked;
        dailyProfitTargetEl.disabled = !enableDailyProfitTargetEl.checked;
        const anyPercentLimitEnabled = enableDailyLossLimitEl.checked || enableDailyProfitTargetEl.checked;
        dailyLimitBasisGroupEl.classList.toggle('disabled', !anyPercentLimitEnabled);
    }

    function updateSimulationModeUI() {
        const isTradeMode = simulationModeTradesEl.checked;
        tradeTargetGroup.classList.toggle('disabled', !isTradeMode);
        tradeTargetGroup.classList.toggle('hidden', false);
        durationGroup.classList.toggle('disabled', isTradeMode);
        durationGroup.classList.toggle('hidden', isTradeMode);
        targetTradesEl.disabled = !isTradeMode;
        showTradeTimeEstimateEl.disabled = !isTradeMode;
        durationValueEl.disabled = isTradeMode;
        durationUnitEl.disabled = isTradeMode;
        if (!isTradeMode) {
            tradeTimeEstimateEl.classList.add('hidden');
        }
    }

    function updateTradeTimeEstimate() {
        if (!simulationModeTradesEl.checked || !showTradeTimeEstimateEl.checked) {
            tradeTimeEstimateEl.classList.add('hidden');
            tradeTimeEstimateEl.textContent = '';
            return;
        }
        const target = parseInt(targetTradesEl.value);
        const minTrades = Math.max(0, parseInt(minDailyTradesEl.value));
        const maxTrades = Math.max(0, parseInt(maxDailyTradesEl.value));
        if (!target || target <= 0) {
            tradeTimeEstimateEl.classList.remove('hidden');
            tradeTimeEstimateEl.textContent = 'برای تخمین، تعداد معاملات هدف را تعیین کنید.';
            return;
        }
        if (minTrades === 0 && maxTrades === 0) {
            tradeTimeEstimateEl.classList.remove('hidden');
            tradeTimeEstimateEl.textContent = 'برای تخمین زمان، حداقل یکی از مقادیر معاملات روزانه را بیشتر از صفر کنید.';
            return;
        }
        const avgTrades = (minTrades + maxTrades) / 2;
        const minDays = maxTrades > 0 ? target / maxTrades : null;
        const maxDays = minTrades > 0 ? target / minTrades : null;
        const avgDays = avgTrades > 0 ? target / avgTrades : null;

        const formatDays = (val) => {
            if (val === null || !isFinite(val)) return '-';
            const days = Math.ceil(val);
            const weeks = (days / 7).toFixed(1);
            const months = (days / 30).toFixed(1);
            return `${days} روز (حدود ${weeks} هفته / ${months} ماه)`;
        };

        const parts = [];
        if (minDays !== null) parts.push(`حداقل ≈ ${formatDays(minDays)}`);
        if (maxDays !== null) parts.push(`حداکثر ≈ ${formatDays(maxDays)}`);
        if (avgDays !== null) parts.push(`میانگین ≈ ${formatDays(avgDays)}`);

        tradeTimeEstimateEl.classList.remove('hidden');
        tradeTimeEstimateEl.innerHTML = `برای ${target.toLocaleString('fa-IR')} معامله تقریبی: ${parts.join(' | ')}`;
    }

    function updateExecutionSettingsUI() {
        const isEnabled = enableLotCalculationEl.checked;
        executionSettingsEl.classList.toggle('disabled', !isEnabled);
        const lotCapGroup = enableLotCapEl.closest('.input-group');
        if (lotCapGroup) lotCapGroup.classList.toggle('disabled', !isEnabled);
        maxLotAllowedEl.disabled = !isEnabled || !enableLotCapEl.checked;
    }

    // --- UI Event Listeners ---
    newSeedBtn.addEventListener('click', () => {
        simulationSeedEl.value = Math.floor(Math.random() * 2**32);
        saveParamsToLocalStorage();
    });
    enableLotCapEl.addEventListener('change', updateExecutionSettingsUI);
    simulationModeTimeEl.addEventListener('change', () => { updateSimulationModeUI(); updateSimulationsLimit(); updateTradeTimeEstimate(); saveParamsToLocalStorage(); });
    simulationModeTradesEl.addEventListener('change', () => { updateSimulationModeUI(); updateSimulationsLimit(); updateTradeTimeEstimate(); saveParamsToLocalStorage(); });
    targetTradesEl.addEventListener('input', () => { updateTradeTimeEstimate(); saveParamsToLocalStorage(); });
    showTradeTimeEstimateEl.addEventListener('change', () => { updateTradeTimeEstimate(); saveParamsToLocalStorage(); });
    [minDailyTradesEl, maxDailyTradesEl].forEach(el => el.addEventListener('input', () => { updateTradeTimeEstimate(); }));
    riskTypeCompoundBtn.addEventListener('click', () => { riskTypeCompoundBtn.classList.add('active'); riskTypeFixedBtn.classList.remove('active'); updateRiskTypeUI(); });
    riskTypeFixedBtn.addEventListener('click', () => { riskTypeFixedBtn.classList.add('active'); riskTypeCompoundBtn.classList.remove('active'); updateRiskTypeUI(); });
    dailyLimitBasisFloatingBtn.addEventListener('click', () => { dailyLimitBasisFloatingBtn.classList.add('active'); dailyLimitBasisInitialBtn.classList.remove('active'); });
    dailyLimitBasisInitialBtn.addEventListener('click', () => { dailyLimitBasisInitialBtn.classList.add('active'); dailyLimitBasisFloatingBtn.classList.remove('active'); });
    enableStepUpEl.addEventListener('change', () => { stepUpMultiplierEl.disabled = !enableStepUpEl.checked; });
    enableWithdrawalsEl.addEventListener('change', () => {
        const isDisabled = !enableWithdrawalsEl.checked;
        document.getElementById('withdrawalSettings').classList.toggle('hidden', isDisabled);
        withdrawalPeriodEl.disabled = isDisabled; withdrawalPercentEl.disabled = isDisabled;
    });
    [enableMaxDailySLEl, enableMaxDailyTPEl, enableDailyLossLimitEl, enableDailyProfitTargetEl].forEach(el => el.addEventListener('change', updateDailyLimitsUI));
    enableLotCalculationEl.addEventListener('change', updateExecutionSettingsUI);
    assetTypeEl.addEventListener('change', () => {
        if (assetTypeEl.value === 'gold') { contractSizeEl.value = '100'; assetPriceEl.value = '3500'; } 
        else { contractSizeEl.value = '100000'; assetPriceEl.value = '1.08'; }
    });
    durationValueEl.addEventListener('input', updateSimulationsLimit);
    durationUnitEl.addEventListener('change', updateSimulationsLimit);
    startBtn.addEventListener('click', handleStart);
    pauseBtn.addEventListener('click', handlePauseResume);
    resetBtn.addEventListener('click', handleReset);
    exportSummaryBtn.addEventListener('click', exportSummaryCSV);
    exportLogsBtn.addEventListener('click', exportLogsCSV);
    
    chartTabs.addEventListener('click', (e) => {
        if (e.target.closest('.tab-btn')) {
            chartTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            const clickedBtn = e.target.closest('.tab-btn');
            clickedBtn.classList.add('active');
            renderChart();
            if (simulationState.isComplete) {
                const periodInDays = parseInt(clickedBtn.dataset.period);
                renderTable(periodInDays);
                updateRankingPanelForPeriod(periodInDays); // <<<--- این خط جدید را اضافه کنید

            }
        }
    });
    scaleLinearBtn.addEventListener('click', () => setChartScale(balanceChart, 'linear'));
    scaleLogBtn.addEventListener('click', () => setChartScale(balanceChart, 'logarithmic'));
    singleScaleLinearBtn.addEventListener('click', () => setChartScale(singleSimChart, 'linear'));
    singleScaleLogBtn.addEventListener('click', () => setChartScale(singleSimChart, 'logarithmic'));
    
    panelsContainer.addEventListener('click', (e) => {
        const header = e.target.closest('.collapsible-header');
        if (header && !e.target.closest('.drag-handle')) {
            const content = header.nextElementSibling;
            content.classList.toggle('hidden');
            header.querySelector('.collapse-icon').classList.toggle('rotate-180');
        }
        const fullscreenBtn = e.target.closest('.fullscreen-btn');
        if (fullscreenBtn) {
            const chartPanel = fullscreenBtn.closest('.card-content').querySelector('.chart-panel');
            if (chartPanel) {
                const chartId = chartPanel.querySelector('canvas').id;
                enterFullscreen(chartId);
            }
        }
        const statLink = e.target.closest('.stat-link');
        if (statLink && statLink.dataset.simIndex) {
            e.preventDefault();
            const simIndex = parseInt(statLink.dataset.simIndex);
            simSelectorEl.value = simIndex + 1;
            if (simulationState.singleChartMode !== 'single') toggleSingleMultiView();
            renderSingleSimulationChart();
            const singleSimPanel = document.getElementById('single-sim-viewer');
            singleSimPanel.scrollIntoView({ behavior: 'smooth' });
            const sspHeader = singleSimPanel.querySelector('.collapsible-header');
            const sspContent = singleSimPanel.querySelector('.card-content');
            if(sspContent.classList.contains('hidden')) {
                sspContent.classList.remove('hidden');
                sspHeader.querySelector('.collapse-icon').classList.remove('rotate-180');
            }
        }
        const ddUnitToggle = e.target.closest('#dd-unit-toggle');
        if (ddUnitToggle) {
            simulationState.ui.maxDrawdownCandidateUnit = simulationState.ui.maxDrawdownCandidateUnit === 'percent' ? 'usd' : 'percent';
            ddUnitToggle.querySelector('#dd-unit-usd').classList.toggle('active', simulationState.ui.maxDrawdownCandidateUnit === 'usd');
            ddUnitToggle.querySelector('#dd-unit-percent').classList.toggle('active', simulationState.ui.maxDrawdownCandidateUnit === 'percent');
            renderOverallStats(); // Re-render to update the candidate display
        }
    });
    summaryTableHeader.addEventListener('click', () => { summaryTableContainer.classList.toggle('hidden'); summaryCollapseIcon.classList.toggle('rotate-180'); });
    tradeLogHeader.addEventListener('click', () => { tradeLogContainer.classList.toggle('hidden'); tradeLogCollapseIcon.classList.toggle('rotate-180'); });
    let draggedItem = null;
    panelsContainer.addEventListener('dragstart', (e) => {
        if (e.target.closest('.drag-handle')) {
            draggedItem = e.target.closest('.draggable-panel');
            if (draggedItem) { e.dataTransfer.effectAllowed = 'move'; setTimeout(() => { draggedItem.classList.add('dragging'); }, 0); }
        } else { e.preventDefault(); }
    });
    panelsContainer.addEventListener('dragend', () => { if(draggedItem){ draggedItem.classList.remove('dragging'); draggedItem = null; } });
    panelsContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); if (!draggedItem) return;
        const afterElement = getDragAfterElement(panelsContainer, e.clientY);
        if (afterElement == null) panelsContainer.appendChild(draggedItem);
        else panelsContainer.insertBefore(draggedItem, afterElement);
    });
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.draggable-panel:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            else return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    simSelectorEl.addEventListener('change', () => { if (simulationState.singleChartMode !== 'single') toggleSingleMultiView(); renderSingleSimulationChart(); });
    prevSimBtn.addEventListener('click', () => { simSelectorEl.value = Math.max(1, parseInt(simSelectorEl.value) - 1); if (simulationState.singleChartMode !== 'single') toggleSingleMultiView(); renderSingleSimulationChart(); });
    nextSimBtn.addEventListener('click', () => { simSelectorEl.value = Math.min(simulationState.params.numSimulations, parseInt(simSelectorEl.value) + 1); if (simulationState.singleChartMode !== 'single') toggleSingleMultiView(); renderSingleSimulationChart(); });
    // --- REPLACEMENT for old multi-sim button listeners ---
    multiSimControls.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-count]');
        if (button) {
            const count = parseInt(button.dataset.count);
            showMultiSimView(count);
        }
    });

    newRandomBtn.addEventListener('click', () => {
        const currentCount = simulationState.randomSimIndices.length || 10;
        showMultiSimView(currentCount);
    });

    showSingleSimBtn.addEventListener('click', showSingleSimView);
    if (mainResetZoomBtn) {
        mainResetZoomBtn.addEventListener('click', () => {
            if (balanceChart && typeof balanceChart.resetZoom === 'function') {
                balanceChart.resetZoom();
                balanceChart.update('none');
            }
        });
    }
    if (singleResetZoomBtn) {
        singleResetZoomBtn.addEventListener('click', () => {
            if (singleSimChart && typeof singleSimChart.resetZoom === 'function') {
                singleSimChart.resetZoom();
                singleSimChart.update('none');
            }
        });
    }
    singleSimChartTabs.addEventListener('click', (e) => {
        if (e.target.closest('.tab-btn')) {
            singleSimChartTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            e.target.closest('.tab-btn').classList.add('active');
            renderSingleSimulationChart();
        }
    });
    sortMetricEl.addEventListener('change', () => renderRankingTable(simulationState.currentRankingStats, true));
    sortAscBtn.addEventListener('click', () => { sortAscBtn.classList.add('active'); sortDescBtn.classList.remove('active'); renderRankingTable(simulationState.currentRankingStats, true); });
    sortDescBtn.addEventListener('click', () => { sortDescBtn.classList.add('active'); sortAscBtn.classList.remove('active'); renderRankingTable(simulationState.currentRankingStats, true); });
    // --- FINAL REPLACEMENT for setupChartInteraction function ---
    function setupChartInteraction(controls, chart) {
        if (!controls || !chart) return;

        // A flag to prevent adding listeners multiple times
        if (controls.dataset.listenerAttached === 'true') return;

        // Set initial state based on default options
        const dragZoomEnabled = chart.options.plugins.zoom.zoom.drag.enabled;
        controls.querySelector('button[data-mode="pan"]').classList.toggle('active', !dragZoomEnabled);
        controls.querySelector('button[data-mode="zoom"]').classList.toggle('active', dragZoomEnabled);

        controls.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button || !chart) return; // Add guard for chart existence

            const mode = button.dataset.mode;

            controls.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            chart.options.plugins.zoom.pan.enabled = true;
            chart.options.plugins.zoom.zoom.drag.enabled = mode === 'zoom';
            chart.update('none');
        });

        controls.dataset.listenerAttached = 'true';
    }

    // We need to wait for the charts to be created, so we'll call this later.

    // --- Control Functions ---
    function handleStart() {
        if (!validateInputs()) return;
        handleReset(true);
        simulationState.isRunning = true;
        simulationState.isPaused = false;
        updateButtonStates();
        collectParams();
        generateDynamicTimeTabs();
        resultsSection.classList.remove('hidden');
        exportSection.classList.add('hidden');
        simulationWorker = new Worker('./js/worker/simulationWorker.js', { type: 'module' });
        simulationWorker.onmessage = handleWorkerMessage;
        simulationWorker.postMessage({ command: 'start', params: simulationState.params });
    }
    function handlePauseResume() {
        if (!simulationState.isRunning) return;
        simulationState.isPaused = !simulationState.isPaused;
        updateButtonStates();
        simulationWorker.postMessage({ command: simulationState.isPaused ? 'pause' : 'resume' });
    }
    function handleReset(isSoft = false) {
        if (simulationWorker) {
            simulationWorker.terminate();
            simulationWorker = null;
        }
        const oldParams = simulationState.params;
        simulationState = {
            isRunning: false, isPaused: false, isComplete: false, allSimulations: [], fullStats: [], params: isSoft ? oldParams : {}, chartDates: [], singleChartMode: 'single', randomSimIndices: [], maxSimulatedDays: 0,
            candidates: {
                finalBalance: { best: { val: -Infinity, idx: -1 }, worst: { val: Infinity, idx: -1 } },
                maxDrawdown: { best: { val: Infinity, idx: -1, p: -1 }, worst: { val: -Infinity, idx: -1, p: -1 } },
                relativeDdPercent: { best: { val: Infinity, idx: -1 }, worst: { val: -Infinity, idx: -1 } },
                daysInDrawdown: { best: { val: Infinity, idx: -1 }, worst: { val: -Infinity, idx: -1 } },
                maxConsecutiveWins: { best: { val: -Infinity, idx: -1 }, worst: { val: Infinity, idx: -1 } },
                maxConsecutiveLosses: { best: { val: Infinity, idx: -1 }, worst: { val: -Infinity, idx: -1 } }
            },
            ui: { maxDrawdownCandidateUnit: 'percent' }
        };
        updateButtonStates();
        updateProgressBar(0, 100, 'آماده');
        exportSection.classList.add('hidden');
        if (!isSoft) {
            resultsSection.classList.add('hidden');
            if (balanceChart) balanceChart.destroy();
            if (singleSimChart) singleSimChart.destroy();
            simulationSeedEl.value = '';
            preserveSeedEl.checked = false;
        }
    }
    function updateButtonStates() {
        startBtn.disabled = simulationState.isRunning;
        pauseBtn.disabled = !simulationState.isRunning || simulationState.isComplete;
        resetBtn.disabled = !simulationState.isRunning && !simulationState.isComplete;
        if (simulationState.isPaused) {
            pauseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon-sm" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg> ادامه`;
            pauseBtn.classList.remove('btn-warning'); pauseBtn.classList.add('btn-primary');
        } else {
            pauseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="icon-sm" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg> مکث`;
            pauseBtn.classList.add('btn-warning'); pauseBtn.classList.remove('btn-primary');
        }
    }
    
    function handleWorkerMessage(e) {
        const { type, completed, total, results } = e.data;
        if (type === 'progress') {
            const percentage = (completed / total) * 100;
            updateProgressBar(percentage * 0.9, 100, 'در حال شبیه‌سازی...');
        } else if (type === 'complete') {
            updateProgressBar(90, 100, 'در حال پردازش نتایج...');
            setTimeout(() => {
                simulationState.isRunning = false;
                simulationState.isComplete = true;
                simulationState.allSimulations = results.map(sim => ({ ...sim, eventLog: sim.eventLog.map(event => ({ ...event, date: new Date(event.date) })) }));
                updateButtonStates();
                processAndDisplayResults();
                updateProgressBar(100, 100, 'تکمیل شد');
                exportSection.classList.remove('hidden');
            }, 50);
        }
    }

    function collectParams() {
        const simulationMode = simulationModeTradesEl.checked ? 'trades' : 'time';
        const durationVal = parseInt(durationValueEl.value);
        const durationUnit = durationUnitEl.value;
        const totalMonths = durationUnit === 'years' ? durationVal * 12 : durationVal;
        const startDate = new Date('2025-02-03T00:00:00');
        let endDate = new Date(startDate);
        if (durationUnit === 'years') endDate.setFullYear(endDate.getFullYear() + durationVal);
        else endDate.setMonth(endDate.getMonth() + durationVal);
        const timeModeTotalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const minTrades = parseInt(minDailyTradesEl.value);
        const maxTrades = parseInt(maxDailyTradesEl.value);
        const targetTrades = parseInt(targetTradesEl.value) || 0;
        const tradeModeDays = simulationMode === 'trades'
            ? calculateTradeModeDays(targetTrades, minTrades, maxTrades)
            : timeModeTotalDays;
        const effectiveTotalDays = simulationMode === 'trades' ? tradeModeDays : timeModeTotalDays;
        const effectiveTotalMonths = simulationMode === 'trades' ? Math.max(1, Math.ceil(effectiveTotalDays / 30.44)) : totalMonths;
        
        let seed = simulationSeedEl.value.trim();
        if (!preserveSeedEl.checked || seed === '' || isNaN(parseInt(seed))) {
            seed = Math.floor(Math.random() * 2**32);
            simulationSeedEl.value = seed;
        }

        simulationState.params = {
            initialBalance: parseFloat(initialBalanceEl.value), riskPercent: parseFloat(riskPercentEl.value) / 100, isCompound: riskTypeCompoundBtn.classList.contains('active'),
            stepUpEnabled: enableStepUpEl.checked, stepUpMultiplier: parseFloat(stepUpMultiplierEl.value), rrRatio: parseFloat(rrRatioRewardEl.value),
            winRate: parseFloat(winRateEl.value) / 100, minTrades, maxTrades,
            withdrawEnabled: enableWithdrawalsEl.checked, withdrawalPeriodWeeks: parseInt(withdrawalPeriodEl.value), withdrawalPercent: parseFloat(withdrawalPercentEl.value) / 100,
            usdToIrt: parseFloat(usdToIrtEl.value), numSimulations: parseInt(numSimulationsEl.value), totalMonths: effectiveTotalMonths, totalDays: effectiveTotalDays, startDate: startDate.toISOString(),
            seed: parseInt(seed), simulationMode, targetTrades, tradeModeMaxDays: tradeModeDays,
            enableMaxDailySL: enableMaxDailySLEl.checked, maxDailySL: parseInt(maxDailySLEl.value), enableMaxDailyTP: enableMaxDailyTPEl.checked, maxDailyTP: parseInt(maxDailyTPEl.value),
            enableDailyLossLimit: enableDailyLossLimitEl.checked, dailyLossLimit: parseFloat(dailyLossLimitEl.value), enableDailyProfitTarget: enableDailyProfitTargetEl.checked, dailyProfitTarget: parseFloat(dailyProfitTargetEl.value),
            dailyLimitBasis: dailyLimitBasisFloatingBtn.classList.contains('active') ? 'floating' : 'initial', enableLotCalculation: enableLotCalculationEl.checked,
            enableLotCap: enableLotCapEl.checked, maxLotAllowed: parseFloat(maxLotAllowedEl.value || 0),
            assetType: assetTypeEl.value, minStopLossPoints: parseFloat(minStopLossPointsEl.value), maxStopLossPoints: parseFloat(maxStopLossPointsEl.value),
            contractSize: parseFloat(contractSizeEl.value), commissionPerLot: parseFloat(commissionPerLotEl.value),
        };
        simulationState.chartDates = generateAllDates(startDate, effectiveTotalDays);
    }

    // --- Result Processing and Display ---

    // --- RankingPanel ---
    function updateRankingPanelForPeriod(periodInDays) {
        if (!simulationState.isComplete) return;
        const newStats = recalculateStatsForPeriod(periodInDays);
        simulationState.currentRankingStats = newStats; // <-- داده‌های جدید را در حافظه بروز می‌کنیم
        renderRankingTable(newStats, true);
    }
    // --- RankingPanel ---
    function recalculateStatsForPeriod(periodInDays) {
        return simulationState.allSimulations.map((sim, index) => {
            const stats = calculatePeriodStats(sim, periodInDays, false);
            return { ...stats, index };
        });
    }
    
    function processAndDisplayResults() {
        // Calculate full stats for every simulation
        simulationState.fullStats = simulationState.allSimulations.map((sim, index) => {
            const stats = calculatePeriodStats(sim, sim.balances.length - 1, false);
            return { ...stats, index };
        });

        simulationState.maxSimulatedDays = Math.max(...simulationState.allSimulations.map(sim => (sim.balances?.length || 1) - 1));
        
        simulationState.currentRankingStats = simulationState.fullStats; // <-- داده‌های اولیه را در حافظه ذخیره می‌کنیم

        // Find candidates using the new fullStats array
        simulationState.fullStats.forEach((stats, index) => {
            if (stats.finalBalance > simulationState.candidates.finalBalance.best.val) simulationState.candidates.finalBalance.best = { val: stats.finalBalance, idx: index };
            if (stats.finalBalance < simulationState.candidates.finalBalance.worst.val) simulationState.candidates.finalBalance.worst = { val: stats.finalBalance, idx: index };
            
            if (stats.maxDrawdownPercent < simulationState.candidates.maxDrawdown.best.val) simulationState.candidates.maxDrawdown.best = { val: stats.maxDrawdown, p: stats.maxDrawdownPercent, idx: index };
            if (stats.maxDrawdownPercent > simulationState.candidates.maxDrawdown.worst.val) simulationState.candidates.maxDrawdown.worst = { val: stats.maxDrawdown, p: stats.maxDrawdownPercent, idx: index };

            if (stats.relativeDdPercent < simulationState.candidates.relativeDdPercent.best.val) simulationState.candidates.relativeDdPercent.best = { val: stats.relativeDdPercent, idx: index };
            if (stats.relativeDdPercent > simulationState.candidates.relativeDdPercent.worst.val) simulationState.candidates.relativeDdPercent.worst = { val: stats.relativeDdPercent, idx: index };
            
            if (stats.daysInDrawdown < simulationState.candidates.daysInDrawdown.best.val) simulationState.candidates.daysInDrawdown.best = { val: stats.daysInDrawdown, idx: index };
            if (stats.daysInDrawdown > simulationState.candidates.daysInDrawdown.worst.val) simulationState.candidates.daysInDrawdown.worst = { val: stats.daysInDrawdown, idx: index };

            if (stats.maxConsecutiveWins > simulationState.candidates.maxConsecutiveWins.best.val) simulationState.candidates.maxConsecutiveWins.best = { val: stats.maxConsecutiveWins, idx: index };
            if (stats.maxConsecutiveWins < simulationState.candidates.maxConsecutiveWins.worst.val) simulationState.candidates.maxConsecutiveWins.worst = { val: stats.maxConsecutiveWins, idx: index };
            if (stats.maxConsecutiveLosses > simulationState.candidates.maxConsecutiveLosses.worst.val) simulationState.candidates.maxConsecutiveLosses.worst = { val: stats.maxConsecutiveLosses, idx: index };
            if (stats.maxConsecutiveLosses < simulationState.candidates.maxConsecutiveLosses.best.val) simulationState.candidates.maxConsecutiveLosses.best = { val: stats.maxConsecutiveLosses, idx: index };
        });
        
        renderRankingTable(simulationState.currentRankingStats, true); // <-- از حافظه برای رندر اولیه استفاده می‌کنیم

        renderOverallStats();
        renderPercentileStatsSummary(); 
        renderChart();
        const activeTab = document.querySelector('#chart-tabs .tab-btn.active');
        const initialPeriod = activeTab ? parseInt(activeTab.dataset.period) : simulationState.params.totalDays;
        renderTable(initialPeriod);
        simSelectorEl.max = simulationState.params.numSimulations;
        updateSingleChartUI();
        renderSingleSimulationChart();
        populateRankingOptions();
        //renderRankingTable(simulationState.fullStats, true);
        renderRankingTable(simulationState.currentRankingStats, true); // <-- از حافظه برای رندر اولیه استفاده می‌کنیم
    }
    
    // --- NEW: Metric Definitions ---
    const metricProperties = {
        finalBalance: { label: 'موجودی نهایی ($)', type: 'currency', higherIsBetter: true },
        peakBalance: { label: 'بیشترین موجودی  ($)', type: 'currency', higherIsBetter: true },
        minBalance: { label: 'کمترین موجودی  ($)', type: 'currency', higherIsBetter: false },
        totalProfitPercent: { label: 'رشد کل (%)', type: 'percent', higherIsBetter: true },
        relativeDrawdown: { label: 'دراودان از اولیه ($)', type: 'currency', higherIsBetter: false },
        relativeDdPercent: { label: 'دراودان از اولیه (%)', type: 'percent', higherIsBetter: false },
        maxDrawdown: { label: 'بیشترین دراودان ($)', type: 'currency', higherIsBetter: false },
        maxDrawdownPercent: { label: 'بیشترین دراودان (%)', type: 'percent', higherIsBetter: false },
        winRate: { label: 'نرخ برد (%)', type: 'percent', higherIsBetter: true },
        profitFactor: { label: 'فاکتور سود', type: 'number', higherIsBetter: true },
        periodTotalTrades: { label: 'تعداد کل معاملات', type: 'integer', higherIsBetter: true },
        maxConsecutiveWins: { label: 'بیشترین بردهای پیاپی', type: 'integer', higherIsBetter: true },
        maxWinStreakPL: { label: 'سود دوره پیاپی ($)', type: 'currency', higherIsBetter: true },
        maxConsecutiveLosses: { label: 'بیشترین باخت‌های پیاپی', type: 'integer', higherIsBetter: false },
        maxLossStreakPL: { label: 'زیان دوره پیاپی ($)', type: 'currency', higherIsBetter: false },
        totalWithdrawals: { label: 'مجموع برداشت ($)', type: 'currency', higherIsBetter: true },
        daysInDrawdown: { label: 'روزهای زیر بالانس اولیه', type: 'integer', higherIsBetter: false },
        daysInDdFromPeak: { label: 'روزهای در ضرر نسبت به اوج', type: 'integer', higherIsBetter: false },
        maxDdStreak: { label: 'طولانی‌ترین دوره افت پیاپی (روز)', type: 'integer', higherIsBetter: false },
        maxDailyDrawdownDynamicPercent: { label: 'شمار روزهای در ضرر نسبت به اوج', type: 'integer', higherIsBetter: false },
        periodTotalWins: { label: 'کل ترید های برنده', type: 'integer', higherIsBetter: true },
        periodTotalLosses: { label: 'کل تریدهای بازنده', type: 'integer', higherIsBetter: false },
    };

    function renderOverallStats() {
        if (!simulationState.isComplete) return;

        const percentileHtml = (title, key, unit) => {
            const higherIsBetter = metricProperties[key].higherIsBetter;
            const allValues = simulationState.fullStats.map(s => s[key]).sort((a,b) => a-b);
            const p25_val = getPercentile(allValues, 25);
            const p50_val = getPercentile(allValues, 50);
            const p75_val = getPercentile(allValues, 75);

            const color25 = higherIsBetter ? 'text-red-400' : 'text-green-400';
            const color75 = higherIsBetter ? 'text-green-400' : 'text-red-400';
            return `<div class="stat-category">
                <h4 class="font-bold text-cyan-400 mb-3 text-center">${title}</h4>
                <table class="percentile-table">
                    <thead><tr><th>P25 (بدبینانه)</th><th>P50 (میانه)</th><th>P75 (خوش‌بینانه)</th></tr></thead>
                    <tbody><tr>
                        <td class="${color25}">${p25_val.toFixed(2)}${unit}</td>
                        <td class="text-yellow-300">${p50_val.toFixed(2)}${unit}</td>
                        <td class="${color75}">${p75_val.toFixed(2)}${unit}</td>
                    </tr></tbody>
                </table>
            </div>`;
        };

        const candidates = simulationState.candidates;
        const candidateHtml = (title, bestIdx, worstIdx, bestLabel = 'بهترین', worstLabel = 'بدترین') => {
            if (bestIdx < 0 || worstIdx < 0) return '';
            return `<div class="stat-category"><h4 class="font-bold text-cyan-400 mb-2 text-center">${title}</h4><div class="flex justify-between items-center"><span>${bestLabel}:</span> <b class="stat-link" data-sim-index="${bestIdx}">#${bestIdx + 1}</b></div><div class="flex justify-between items-center"><span>${worstLabel}:</span> <b class="stat-link" data-sim-index="${worstIdx}">#${worstIdx + 1}</b></div></div>`;
        }

        const maxDrawdownCandidateHtml = () => {
            const unit = simulationState.ui.maxDrawdownCandidateUnit;
            const bestVal = unit === 'percent' ? `${candidates.maxDrawdown.best.p.toFixed(2)}%` : formatCurrency(candidates.maxDrawdown.best.val);
            const worstVal = unit === 'percent' ? `${candidates.maxDrawdown.worst.p.toFixed(2)}%` : formatCurrency(candidates.maxDrawdown.worst.val);

            return `<div class="stat-category">
                <div class="candidate-header">
                    <h4 class="font-bold text-cyan-400 text-center">دراودان از اوج</h4>
                    <div id="dd-unit-toggle" class="flex items-center bg-slate-700 rounded-md p-1 toggle-btn-group">
                        <button id="dd-unit-percent" class="flex-1 btn btn-xs ${unit === 'percent' ? 'active' : ''}">%</button>
                        <button id="dd-unit-usd" class="flex-1 btn btn-xs ${unit === 'usd' ? 'active' : ''}">$</button>
                    </div>
                </div>
                <div class="flex justify-between items-center"><span>کمترین:</span> <div><b class="stat-link" data-sim-index="${candidates.maxDrawdown.best.idx}">#${candidates.maxDrawdown.best.idx + 1}</b> (${bestVal})</div></div>
                <div class="flex justify-between items-center"><span>بیشترین:</span> <div><b class="stat-link" data-sim-index="${candidates.maxDrawdown.worst.idx}">#${candidates.maxDrawdown.worst.idx + 1}</b> (${worstVal})</div></div>
            </div>`;
        }
        
        let candidatesGridHtml = `
            ${candidateHtml('کاندیدا: بالانس نهایی', candidates.finalBalance.best.idx, candidates.finalBalance.worst.idx)}
            ${candidateHtml('کاندیدا: افت از بالانس اولیه', candidates.relativeDdPercent.best.idx, candidates.relativeDdPercent.worst.idx, 'کمترین', 'بیشترین')}
            ${maxDrawdownCandidateHtml()}
            ${candidateHtml('کاندیدا: روزهای متوالی در ضرر', candidates.daysInDrawdown.best.idx, candidates.daysInDrawdown.worst.idx, 'کمترین', 'بیشترین')}
            ${candidateHtml('کاندیدا: بیشترین بردهای پیاپی', candidates.maxConsecutiveWins.best.idx, candidates.maxConsecutiveWins.worst.idx, 'بیشترین', 'کمترین')}
            ${candidateHtml('کاندیدا: بیشترین باخت‌های پیاپی', candidates.maxConsecutiveLosses.best.idx, candidates.maxConsecutiveLosses.worst.idx, 'کمترین', 'بیشترین')}
        `;

        const modeInfo = (() => {
            if (simulationState.params.simulationMode !== 'trades') return '';
            const tradesExecuted = getPercentile(simulationState.fullStats.map(s => s.totalTradesSimulated ?? s.periodTotalTrades).sort((a,b) => a-b), 50);
            const daysElapsed = getPercentile(simulationState.allSimulations.map(s => s.simulatedDays ?? (s.balances.length - 1)).sort((a,b) => a-b), 50);
            return `<div class="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-4">
                <div class="text-cyan-300 font-semibold mb-2">حالت معاملات (بر اساس تعداد)</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-200">
                    <div class="flex justify-between"><span>هدف معاملات:</span><b>${simulationState.params.targetTrades.toLocaleString('fa-IR')}</b></div>
                    <div class="flex justify-between"><span>میانه معاملات انجام شده:</span><b>${tradesExecuted.toFixed(0)}</b></div>
                    <div class="flex justify-between"><span>میانه روزهای طی شده:</span><b>${Math.round(daysElapsed)}</b></div>
                </div>
            </div>`;
        })();

        overallStatsInfo.innerHTML = `
            ${modeInfo}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                ${percentileHtml('نرخ برد واقعی', 'winRate', '%')}
                ${percentileHtml('فاکتور سود', 'profitFactor', '')}
                ${percentileHtml('بردهای پیاپی', 'maxConsecutiveWins', '')}
                ${percentileHtml('باخت‌های پیاپی', 'maxConsecutiveLosses', '')}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm border-t border-slate-700 pt-6 mt-6">
                ${candidatesGridHtml}
            </div>
        `;
    }
    function renderPercentileStatsSummary() {
        if (!simulationState.isComplete || simulationState.allSimulations.length < 4) { percentileStatsContainer.innerHTML = ''; return; }
        const simsWithFinalBalance = [...simulationState.fullStats].sort((a, b) => a.finalBalance - b.finalBalance);
        
        const p25Stats = simsWithFinalBalance[Math.floor((simsWithFinalBalance.length - 1) * 0.25)];
        const p50Stats = simsWithFinalBalance[Math.floor((simsWithFinalBalance.length - 1) * 0.50)];
        const p75Stats = simsWithFinalBalance[Math.floor((simsWithFinalBalance.length - 1) * 0.75)];

        const scenarios = [
            { title: 'سناریوی بدبینانه (نماینده P25)', stats: p25Stats, simIndex: p25Stats.index, color: 'red' },
            { title: 'سناریوی واقع‌بینانه (نماینده P50)', stats: p50Stats, simIndex: p50Stats.index, color: 'yellow' },
            { title: 'سناریوی خوش‌بینانه (نماینده P75)', stats: p75Stats, simIndex: p75Stats.index, color: 'green' }
        ];
        let html = `<div class="card mt-4"><div class="card-header collapsible-header"><h3 class="text-lg font-semibold text-cyan-400">بررسی عمیق سناریوهای پرسنتایل</h3><svg class="collapse-icon w-6 h-6 transition-transform text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg></div><div class="card-content hidden space-y-8">`;
        scenarios.forEach(scenario => { html += renderInDepthStats(scenario.stats, false, scenario.title, scenario.simIndex, scenario.color); });
        html += `</div></div>`;
        percentileStatsContainer.innerHTML = html;
    }
    function renderChart() {
        if (!simulationState.isComplete) return;
        const activeTab = document.querySelector('#chart-tabs .tab-btn.active');
        const maxAvailableDays = simulationState.maxSimulatedDays || simulationState.params.totalDays;
        const numDays = activeTab ? Math.min(parseInt(activeTab.dataset.period), maxAvailableDays) : maxAvailableDays;
        const dailyPercentiles = { p25: [], p50: [], p75: [] };
        for (let day = 0; day <= numDays; day++) {
            const balancesOnDay = simulationState.allSimulations.map(s => s.balances[Math.min(day, s.balances.length - 1)] ?? s.balances[s.balances.length - 1]).sort((a,b) => a-b);
            dailyPercentiles.p25.push(getPercentile(balancesOnDay, 25));
            dailyPercentiles.p50.push(getPercentile(balancesOnDay, 50));
            dailyPercentiles.p75.push(getPercentile(balancesOnDay, 75));
        }
        const labels = simulationState.chartDates.slice(0, numDays + 1);
        if (balanceChart) balanceChart.destroy();
        balanceChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'پرسنتایل ۷۵ (خوش‌بینانه)', data: dailyPercentiles.p75, borderColor: 'rgba(74, 222, 128, 0.8)', borderWidth: 2, fill: '+1', backgroundColor: 'rgba(74, 222, 128, 0.1)', pointRadius: 0, tension: 0.2 },
                    { label: 'میانه (واقع‌بینانه)', data: dailyPercentiles.p50, borderColor: 'rgba(56, 189, 248, 1)', borderWidth: 3, fill: false, pointRadius: 0, tension: 0.2 },
                    { label: 'پرسنتایل ۲۵ (بدبینانه)', data: dailyPercentiles.p25, borderColor: 'rgba(248, 113, 113, 0.8)', borderWidth: 2, fill: false, pointRadius: 0, tension: 0.2 }
                ]
            },
            options: getChartOptions('percentile')
        });
        setupChartInteraction(mainChartControls, balanceChart);
    }
    // --- FINAL REPLACEMENT for the entire renderSingleSimulationChart function ---
    function renderSingleSimulationChart() {
        if (!simulationState.isComplete) return;
        const activeTab = document.querySelector('#single-sim-chart-tabs .tab-btn.active');
        const maxAvailableDays = simulationState.maxSimulatedDays || simulationState.params.totalDays;
        const numDays = activeTab ? Math.min(parseInt(activeTab.dataset.period), maxAvailableDays) : maxAvailableDays;
        const periodLabel = activeTab ? activeTab.dataset.label : 'کل دوره';
        const labels = simulationState.chartDates.slice(0, numDays + 1);
        let datasets = [];
        let chartOptions = getChartOptions(simulationState.singleChartMode);
        inDepthStatsContainer.innerHTML = '';
        tradeLogSection.classList.add('hidden'); 
        multiSimLegendContainer.innerHTML = '';

        if (singleSimChart) {
            singleSimChart.destroy();
        }

        if (simulationState.singleChartMode === 'multi') {
            if (simulationState.randomSimIndices.length === 0) {
                // Default to 10 if none are selected yet
                showMultiSimView(10);
                return; // The function will be called again with the right data
            }
            datasets = simulationState.randomSimIndices.map(index => {
                const simData = simulationState.allSimulations[index];
                return {
                    label: `شبیه‌سازی #${index + 1}`,
                    data: Array.from({ length: numDays + 1 }, (_, i) => simData.balances[Math.min(i, simData.balances.length - 1)]),
                    borderColor: getRandomColor(),
                    borderWidth: 1.5,
                    fill: false,
                    pointRadius: 0,
                    tension: 0.1
                };
            });
            const avgStats = calculatePeriodStats(null, numDays, true, periodLabel);
            inDepthStatsContainer.innerHTML = renderInDepthStats(avgStats, true, `خلاصه میانگین ${simulationState.randomSimIndices.length} شبیه‌سازی`);
        } else { // 'single' mode
            const simIndex = parseInt(simSelectorEl.value) - 1;
            if (simIndex < 0 || simIndex >= simulationState.allSimulations.length) return;

            const simData = simulationState.allSimulations[simIndex];
            const stats = calculatePeriodStats(simData, numDays, false, periodLabel);
            if (!stats) return;

            const mainData = Array.from({ length: numDays + 1 }, (_, i) => simData.balances[Math.min(i, simData.balances.length - 1)]);
            const peakLine = [];
            let currentPeak = -Infinity;
            for(let i=0; i < mainData.length; i++) {
                const balanceValue = simData.balancesWithoutWithdrawals[Math.min(i, simData.balancesWithoutWithdrawals.length - 1)];
                if (balanceValue > currentPeak) {
                    currentPeak = balanceValue;
                }
                peakLine.push(currentPeak);
            }

            datasets.push({
                label: 'Peak (for drawdown)',
                data: peakLine,
                borderColor: 'transparent',
                backgroundColor: 'rgba(220, 38, 38, 0.18)',
                pointRadius: 0,
                borderWidth: 0,
                fill: 0 // Fill to the next dataset (the balance line)
            });

            datasets.push({
                label: `موجودی شبیه‌سازی #${simIndex + 1}`,
                data: mainData,
                borderColor: (context) => {
                    const {ctx, chartArea, scales} = context.chart;
                    if (!chartArea) return 'rgba(56,189,248,1)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    const initialY = scales.y.getPixelForValue(simulationState.params.initialBalance);
                    const stopPoint = scales.y.max > scales.y.min ? (initialY - chartArea.top) / (chartArea.bottom - chartArea.top) : 0;
                    const clampedStopPoint = Math.max(0, Math.min(1, stopPoint));
                    gradient.addColorStop(0, 'rgba(34, 197, 94, 1)');
                    gradient.addColorStop(Math.max(0, clampedStopPoint - 0.01), 'rgba(59, 130, 246, 1)');
                    gradient.addColorStop(clampedStopPoint, 'rgba(209, 213, 219, 1)');
                    gradient.addColorStop(Math.min(1, clampedStopPoint + 0.01), 'rgba(249, 115, 22, 1)');
                    gradient.addColorStop(1, 'rgba(220, 38, 38, 1)');
                    return gradient;
                },
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                borderWidth: 2,
                fill: false, // Balance line should not be filled
                pointRadius: 0,
                tension: 0.1
            });
            inDepthStatsContainer.innerHTML = renderInDepthStats(stats, false, `آمار دقیق شبیه‌سازی #${simIndex + 1}`, simIndex);
            renderEventLogTable(simIndex);
        }

        singleSimChart = new Chart(singleSimChartCanvas, { type: 'line', data: { labels, datasets }, options: chartOptions });
        setupChartInteraction(singleChartControls, singleSimChart);
    }
    
    function renderInDepthStats(stats, isAverage, title, simIndex = null, color = 'cyan') {
        const p = simulationState.params;
        let withdrawalInfo = '';
        if (!isAverage && p.withdrawEnabled) {
            withdrawalInfo = `<div class="flex justify-between"><span>موجودی بدون برداشت:</span> <b class="text-cyan-300">${formatCurrency(stats.finalBalanceWithoutWithdrawals)}</b></div><div class="flex justify-between"><span>مجموع برداشت‌ها:</span> <b class="text-blue-400">${formatCurrency(stats.totalWithdrawals)}</b></div>`;
        }
        
        const formatAvg = (val) => isAverage ? val.toFixed(2) : val;

        const titleHtml = simIndex !== null 
            ? `<div class="flex justify-between items-center"><h3 class="text-lg font-semibold text-${color}-400 mb-4">${title}</h3></div>`
            : `<h3 class="text-lg font-semibold text-cyan-400 mb-4">${title}</h3>`;

        return `
            <div class="border-t border-slate-700 pt-4">${titleHtml}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-slate-300 text-sm">
                <div class="bg-slate-800 p-4 rounded-lg space-y-2">
                    <h4 class="font-bold text-cyan-500 text-center mb-2">عملکرد کلی</h4>
                    <div class="flex justify-between"><span>سود/زیان نهایی:</span> <b class="${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}">${formatCurrency(stats.totalProfit)} (${stats.totalProfitPercent.toFixed(2)}%)</b></div>
                    <div class="flex justify-between"><span>موجودی نهایی:</span> <b>${formatCurrency(stats.finalBalance)}</b></div>
                    ${withdrawalInfo}
                    <div class="flex justify-between"><span>سود ناخالص:</span> <b class="text-green-400">${formatCurrency(stats.grossProfit)}</b></div>
                    <div class="flex justify-between"><span>زیان ناخالص:</span> <b class="text-red-400">${formatCurrency(stats.grossLoss)}</b></div>
                    <div class="flex justify-between"><span>کارمزد کل در بازه:</span> <b class="text-amber-400">${formatCurrency(stats.totalCommission)}</b></div>
                </div>
                <div class="bg-slate-800 p-4 rounded-lg space-y-2">
                    <h4 class="font-bold text-cyan-500 text-center mb-2">ریسک و دراودان</h4>
                    <div class="flex justify-between"><span>بیشترین موجودی (Peak):</span> <b class="text-green-400">${formatCurrency(stats.peakBalance)}</b></div> 
                    <div class="flex justify-between"><span>کمترین موجودی (Low):</span> <b class="text-red-400">${formatCurrency(stats.minBalance)}</b></div>
                    <div class="flex justify-between"><span>دراودان از Peak:</span> <b class="text-red-400">${formatCurrency(stats.maxDrawdown)} (${stats.maxDrawdownPercent.toFixed(2)}%)</b></div>
                    <div class="flex justify-between"><span>دراودان از اولیه:</span> <b class="text-orange-400">${formatCurrency(stats.relativeDrawdown)} (${stats.relativeDdPercent.toFixed(2)}%)</b></div>
                    <div class="flex justify-between"><span>دراوداون روزانه (دینامیک):</span> <b class="text-red-500">${stats.maxDailyDrawdownDynamicPercent.toFixed(2)}%</b></div>
                </div>
                <div class="bg-slate-800 p-4 rounded-lg space-y-2">
                    <h4 class="font-bold text-cyan-500 text-center mb-2">آمار معاملات</h4>
                    <div class="flex justify-between"><span>کل معاملات:</span> <b>${formatAvg(stats.periodTotalTrades)}</b></div>
                    <div class="flex justify-between"><span>معاملات سودده:</span> <b class="text-green-400">${formatAvg(stats.periodTotalWins)}</b></div>
                    <div class="flex justify-between"><span>معاملات بازنده:</span> <b class="text-red-400">${formatAvg(stats.periodTotalLosses)}</b></div>
                    <div class="flex justify-between"><span>نرخ برد واقعی:</span> <b>${stats.winRate.toFixed(2)}%</b></div>
                    <div class="flex justify-between"><span>فاکتور سود:</span> <b class="${stats.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}">${stats.profitFactor.toFixed(2)}</b></div>
                    ${p.simulationMode === 'trades' ? `<div class="flex justify-between"><span>هدف معاملات:</span> <b>${p.targetTrades.toLocaleString('fa-IR')}</b></div>
                    <div class="flex justify-between"><span>معاملات اجرا شده:</span> <b>${formatAvg(stats.totalTradesSimulated ?? stats.periodTotalTrades)}</b></div>
                    <div class="flex justify-between"><span>روزهای شبیه‌سازی شده:</span> <b>${formatAvg(stats.simulatedDays ?? stats.periodCalendarDays)}</b></div>` : ''}
                </div>
                <div class="bg-slate-800 p-4 rounded-lg space-y-2">
                    <h4 class="font-bold text-cyan-500 text-center mb-2">آمار زمانی</h4>
                    <div class="flex justify-between"><span>روزهای تقویمی (${stats.periodLabel}):</span> <b>${stats.periodCalendarDays}</b></div>
                    <div class="flex justify-between"><span>روزهای کاری ممکن:</span> <b>${formatAvg(stats.periodTradingDaysCount)}</b></div>
                    <div class="flex justify-between"><span>روزهای دارای معامله:</span> <b>${formatAvg(stats.periodActiveTradingDays)}</b></div>
                    <div class="flex justify-between"><span>روزهای زیر بالانس اولیه:</span> <b>${formatAvg(stats.daysInDrawdown)}</b></div>
                    <div class="flex justify-between"><span>کل روزهای افت از اوج:</span> <b>${formatAvg(stats.daysInDdFromPeak)}</b></div>
                    <div class="flex justify-between"><span>طولانی‌ترین دوره افت پیاپی (روز):</span> <b>${formatAvg(stats.maxDdStreak)}</b></div>
                </div>
                <div class="bg-slate-800 p-4 rounded-lg space-y-2">
                    <h4 class="font-bold text-cyan-500 text-center mb-2">آمار بردهای پیاپی</h4>
                    <div class="flex justify-between">
                        <span>بیشترین تعداد پیاپی:</span>
                        <b class="text-green-400">${formatAvg(stats.maxConsecutiveWins)}</b>
                    </div>
                    <div class="flex justify-between">
                        <span>بیشترین سود دلاری پیاپی:</span>
                        <b class="text-green-400">${isAverage ? formatCurrency(stats.maxWinStreakDetails.pnl) : formatCurrency(stats.maxWinStreakDetails.pnl) + ` (${stats.maxWinStreakDetails.count} برد)`}</b>
                    </div>
                    ${!isAverage && stats.maxWinStreakDetails.startTrade > 0 ? `<div class="text-xs text-slate-400 text-center pt-1">در لاگ: حوالی معامله ${stats.maxWinStreakDetails.startTrade} تا ${stats.maxWinStreakDetails.endTrade}</div>` : ''}
                </div>
                <div class="bg-slate-800 p-4 rounded-lg space-y-2">
                    <h4 class="font-bold text-cyan-500 text-center mb-2">آمار ضررهای پیاپی</h4>
                    <div class="flex justify-between">
                        <span>بیشترین تعداد پیاپی:</span>
                        <b class="text-red-400">${formatAvg(stats.maxConsecutiveLosses)}</b>
                    </div>
                    <div class="flex justify-between">
                        <span>بیشترین ضرر دلاری پیاپی:</span>
                        <b class="text-red-400">${isAverage ? formatCurrency(stats.maxLossStreakDetails.pnl) : formatCurrency(stats.maxLossStreakDetails.pnl) + ` (${stats.maxLossStreakDetails.count} باخت)`}</b>
                    </div>
                    ${!isAverage && stats.maxLossStreakDetails.startTrade > 0 ? `<div class="text-xs text-slate-400 text-center pt-1">در لاگ: حوالی معامله ${stats.maxLossStreakDetails.startTrade} تا ${stats.maxLossStreakDetails.endTrade}</div>` : ''}
                </div>
                ${(p.enableMaxDailySL || p.enableMaxDailyTP || p.enableDailyLossLimit || p.enableDailyProfitTarget) ? `
                <div class="bg-slate-800 p-4 rounded-lg space-y-2">
                    <h4 class="font-bold text-cyan-500 text-center mb-2">گزارش قوانین روزانه</h4>
                    ${p.enableMaxDailySL ? `<div class="flex justify-between"><span>حد استاپ (تعداد):</span> <b class="text-yellow-400">${formatAvg(stats.slLimitHitCount)} روز (${stats.slLimitHitPercent.toFixed(1)}%)</b></div>` : ''}
                    ${p.enableMaxDailyTP ? `<div class="flex justify-between"><span>حد سود (تعداد):</span> <b class="text-yellow-400">${formatAvg(stats.tpLimitHitCount)} روز (${stats.tpLimitHitPercent.toFixed(1)}%)</b></div>` : ''}
                    ${p.enableDailyLossLimit ? `<div class="flex justify-between"><span>حد ضرر (%):</span> <b class="text-yellow-400">${formatAvg(stats.lossLimitHitCount)} روز (${stats.lossLimitHitPercent.toFixed(1)}%)</b></div>` : ''}
                    ${p.enableDailyProfitTarget ? `<div class="flex justify-between"><span>هدف سود (%):</span> <b class="text-yellow-400">${formatAvg(stats.profitTargetHitCount)} روز (${stats.profitTargetHitPercent.toFixed(1)}%)</b></div>` : ''}
                </div>` : ''}
            </div>
            </div>
        `;
    }

    // --- REPLACEMENT for toggleSingleMultiView ---
    function showMultiSimView(count) {
        simulationState.singleChartMode = 'multi';
        simulationState.randomSimIndices = []; // Reset to get new random ones

        // Generate new random indices
        const indices = [];
        const maxSims = simulationState.allSimulations.length;
        while(indices.length < count && indices.length < maxSims){
            const r = Math.floor(Math.random() * maxSims);
            if(indices.indexOf(r) === -1) indices.push(r);
        }
        simulationState.randomSimIndices = indices;

        updateSingleChartUI();
        renderSingleSimulationChart();
    }

    function showSingleSimView() {
        simulationState.singleChartMode = 'single';
        updateSingleChartUI();
        renderSingleSimulationChart();
    }
    // --- FINAL REPLACEMENT for updateSingleChartUI function ---
    function updateSingleChartUI() {
        const isMulti = simulationState.singleChartMode === 'multi';

        // Toggle visibility of control groups
        singleSimControls.classList.toggle('hidden', isMulti);
        multiSimControls.classList.toggle('hidden', false); // Always keep the container visible

        // Toggle visibility of buttons inside the multi-sim container
        newRandomBtn.classList.toggle('hidden', !isMulti);
        showSingleSimBtn.classList.toggle('hidden', !isMulti);

        tradeLogSection.classList.toggle('hidden', isMulti);
        multiSimLegendContainer.classList.toggle('hidden', !isMulti);

        // Update active state on multi-sim buttons (5, 10, 15)
        const count = simulationState.randomSimIndices.length;
        multiSimControls.querySelectorAll('button[data-count]').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.count) === count && isMulti);
        });
    }
    function renderTable(periodInDays) {
        resultsTableBody.innerHTML = '';
        if (!simulationState.isComplete) return;
        const p = simulationState.params;
        const dayIndex = Math.min(periodInDays, p.totalDays, simulationState.maxSimulatedDays || p.totalDays);
        const scenarios = [
            { label: 'خوش‌بینانه (P75)', percentile: 75 },
            { label: 'واقع‌بینانه (P50)', percentile: 50 },
            { label: 'بدبینانه (P25)', percentile: 25 }
        ];
        if (p.withdrawEnabled) {
            summaryTableHead.innerHTML = `<tr><th class="px-4 py-3 rounded-r-lg">سناریو</th><th class="px-4 py-3">موجودی نهایی ($)</th><th class="px-4 py-3">موجودی درصورت عدم برداشت ($)</th><th class="px-4 py-3">رشد بالانس فعلی</th><th class="px-4 py-3">مجموع برداشت ($)</th><th class="px-4 py-3">رشد کلی</th><th class="px-4 py-3 rounded-l-lg">برداشت (تومان)</th></tr>`;
            const finalBalances = simulationState.allSimulations.map(s => s.balances[dayIndex]).sort((a,b)=>a-b);
            const finalBalancesNoWithdrawal = simulationState.allSimulations.map(s => s.balancesWithoutWithdrawals[dayIndex]).sort((a,b)=>a-b);
            scenarios.forEach(sc => {
                const balance = getPercentile(finalBalances, sc.percentile);
                const balanceNoWithdrawal = getPercentile(finalBalancesNoWithdrawal, sc.percentile);
                const withdrawals = balanceNoWithdrawal - balance;
                const currentBalanceGrowth = (balance / p.initialBalance - 1) * 100;
                const totalGrowth = (balanceNoWithdrawal / p.initialBalance - 1) * 100;
                const tr = document.createElement('tr');
                tr.className = 'border-b border-slate-700 hover:bg-slate-700/50';
                tr.innerHTML = `<td class="px-4 py-4 font-medium text-white whitespace-nowrap">${sc.label}</td><td class="px-4 py-4">${formatCurrency(balance, 'USD')}</td><td class="px-4 py-4">${formatCurrency(balanceNoWithdrawal, 'USD')}</td><td class="px-4 py-4 ${currentBalanceGrowth >= 0 ? 'text-green-400' : 'text-red-400'}">${currentBalanceGrowth.toFixed(2)}%</td><td class="px-4 py-4 text-blue-400">${formatCurrency(withdrawals)}</td><td class="px-4 py-4 ${totalGrowth >= 0 ? 'text-green-400' : 'text-red-400'}">${totalGrowth.toFixed(2)}%</td><td class="px-4 py-4">${formatCurrency(withdrawals * p.usdToIrt, 'IRT')}</td>`;
                resultsTableBody.appendChild(tr);
            });
        } else {
            summaryTableHead.innerHTML = `<tr><th class="px-4 py-3 rounded-r-lg">سناریو</th><th class="px-4 py-3">موجودی نهایی ($)</th><th class="px-4 py-3 rounded-l-lg">رشد نهایی</th></tr>`;
            const finalBalances = simulationState.allSimulations.map(s => s.balances[dayIndex]).sort((a,b)=>a-b);
            scenarios.forEach(sc => {
                const balance = getPercentile(finalBalances, sc.percentile);
                const growth = (balance / p.initialBalance - 1) * 100;
                const tr = document.createElement('tr');
                tr.className = 'border-b border-slate-700 hover:bg-slate-700/50';
                tr.innerHTML = `<td class="px-4 py-4 font-medium text-white whitespace-nowrap">${sc.label}</td><td class="px-4 py-4">${formatCurrency(balance, 'USD')}</td><td class="px-4 py-4 ${growth >= 0 ? 'text-green-400' : 'text-red-400'}">${growth.toFixed(2)}%</td>`;
                resultsTableBody.appendChild(tr);
            });
        }
    }
    function renderEventLogTable(simIndex) {
        tradeLogBody.innerHTML = '';
        const simData = simulationState.allSimulations[simIndex];
        if (!simData || !simData.eventLog) return;
        tradeLogSection.classList.remove('hidden');
        if (simulationState.params.enableLotCalculation) {
            tradeLogHead.innerHTML = `<tr><th class="px-4 py-3 rounded-r-lg">#</th><th class="px-4 py-3">تاریخ</th><th class="px-4 py-3">نوع</th><th class="px-4 py-3">سود/زیان ($)</th><th class="px-4 py-3">لات</th><th class="px-4 py-3">SL (پیپ)</th><th class="px-4 py-3">کارمزد ($)</th><th class="px-4 py-3">R تجمعی</th><th class="px-4 py-3 rounded-l-lg">موجودی نهایی ($)</th></tr>`;
        } else {
            tradeLogHead.innerHTML = `<tr><th class="px-4 py-3 rounded-r-lg">#</th><th class="px-4 py-3">تاریخ</th><th class="px-4 py-3">نوع</th><th class="px-4 py-3">مقدار ($)</th><th class="px-4 py-3">R تجمعی</th><th class="px-4 py-3 rounded-l-lg">موجودی نهایی ($)</th></tr>`;
        }
        const fragment = document.createDocumentFragment();
        const initialRow = document.createElement('tr');
        initialRow.className = 'border-b border-slate-800 bg-slate-700/50';
        const initialCols = simulationState.params.enableLotCalculation ? 9 : 6;
        initialRow.innerHTML = `<td class="px-4 py-2">0</td><td class="px-4 py-2">${simulationState.chartDates[0].toLocaleDateString('fa-IR')}</td><td class="px-4 py-2 font-semibold">شروع</td><td colspan="${initialCols - 4}" class="px-4 py-2 text-center">-</td><td class="px-4 py-2">${formatCurrency(simulationState.params.initialBalance)}</td>`;
        fragment.appendChild(initialRow);
        if (simData.eventLog.length === 0) {
            tradeLogBody.appendChild(fragment);
            tradeLogBody.innerHTML += `<tr><td colspan="${initialCols}" class="text-center p-4">هیچ رویدادی در این شبیه‌سازی ثبت نشده است.</td></tr>`;
            return;
        }
        simData.eventLog.forEach((event) => {
            const tr = document.createElement('tr');
            let typeText, typeClass, amountText;
            switch(event.type) {
                case 'win': typeText = 'برد'; typeClass = 'text-green-400'; tr.className = 'border-b border-slate-800 bg-green-600/10 hover:bg-slate-700/50'; amountText = `+${formatCurrency(event.amount)}`; break;
                case 'loss': typeText = 'باخت'; typeClass = 'text-red-400'; tr.className = 'border-b border-slate-800 bg-red-600/10 hover:bg-slate-700/50'; amountText = formatCurrency(event.amount); break;
                case 'withdrawal': typeText = 'برداشت'; typeClass = 'text-blue-400'; tr.className = 'border-b border-slate-800 bg-blue-600/10 hover:bg-slate-700/50'; amountText = formatCurrency(event.amount); break;
                default: 
                    const limitTypes = {'sl_limit_hit': 'حد استاپ روزانه', 'tp_limit_hit': 'حد سود روزانه', 'profit_target_hit': 'هدف سود روزانه', 'loss_limit_hit': 'حد ضرر روزانه'};
                    typeText = limitTypes[event.type] || 'رویداد';
                    typeClass = 'text-yellow-400'; 
                    tr.className = 'border-b border-slate-800 bg-yellow-600/10 hover:bg-slate-700/50'; 
                    amountText = '-'; 
                    break;
            }
            const cumulativeRText = (event && typeof event.cumulativeR === 'number') ? event.cumulativeR.toFixed(2) : '-';
            if (simulationState.params.enableLotCalculation) {
                 tr.innerHTML = `<td class="px-4 py-2">${event.id}</td><td class="px-4 py-2">${event.date.toLocaleDateString('fa-IR')}</td><td class="px-4 py-2 font-semibold ${typeClass}">${typeText}</td><td class="px-4 py-2 ${typeClass}">${amountText}</td><td class="px-4 py-2">${event.lotSize != null ? event.lotSize.toFixed(2) : '-'}</td><td class="px-4 py-2">${event.stopLossInPips != null ? event.stopLossInPips.toFixed(1) : '-'}</td><td class="px-4 py-2">${event.commission > 0 ? formatCurrency(event.commission) : '-'}</td><td class="px-4 py-2">${cumulativeRText}</td><td class="px-4 py-2">${formatCurrency(event.balanceAfter)}</td>`;
            } else {
                 tr.innerHTML = `<td class="px-4 py-2">${event.id}</td><td class="px-4 py-2">${event.date.toLocaleDateString('fa-IR')}</td><td class="px-4 py-2 font-semibold ${typeClass}">${typeText}</td><td class="px-4 py-2 ${typeClass}">${amountText}</td><td class="px-4 py-2">${cumulativeRText}</td><td class="px-4 py-2">${formatCurrency(event.balanceAfter)}</td>`;
            }
            fragment.appendChild(tr);
        });
        tradeLogBody.appendChild(fragment);
    }
    
    function populateRankingOptions() {
        sortMetricEl.innerHTML = '';
        for (const key in metricProperties) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = metricProperties[key].label;
            sortMetricEl.appendChild(option);
        }
    }

    function renderRankingTable(statsToRender, isUpdate = false) {
        if (!simulationState.isComplete) return;

        const metric = sortMetricEl.value;
        const order = sortDescBtn.classList.contains('active') ? 'desc' : 'asc';
        const higherIsBetter = metricProperties[metric].higherIsBetter;

        // Update aggregate stats summary with smart colors
        const allValues = statsToRender.map(s => s[metric]).filter(v => isFinite(v)).sort((a, b) => a - b);
        const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
        const median = getPercentile(allValues, 50);
        const p25 = getPercentile(allValues, 25);
        const p75 = getPercentile(allValues, 75);

        const formatMetricValue = (key, value) => {
            const props = metricProperties[key];
            if (props.type === 'percent') return `${value.toFixed(2)}%`;
            if (props.type === 'currency') return formatCurrency(value);
            if (props.type === 'number') return value.toFixed(2);
            return value.toFixed(0);
        };
        
        const p25Color = higherIsBetter ? 'text-red-400' : 'text-green-400';
        const p75Color = higherIsBetter ? 'text-green-400' : 'text-red-400';

        rankingStatsSummaryEl.innerHTML = `
            <div class="text-center"><div class="text-sm text-slate-400">میانگین</div><div class="text-lg font-bold text-cyan-400">${formatMetricValue(metric, mean)}</div></div>
            <div class="text-center"><div class="text-sm text-slate-400">میانه (P50)</div><div class="text-lg font-bold text-yellow-300">${formatMetricValue(metric, median)}</div></div>
            <div class="text-center"><div class="text-sm text-slate-400">پرسنتایل 25</div><div class="text-lg font-bold ${p25Color}">${formatMetricValue(metric, p25)}</div></div>
            <div class="text-center"><div class="text-sm text-slate-400">پرسنتایل 75</div><div class="text-lg font-bold ${p75Color}">${formatMetricValue(metric, p75)}</div></div>
        `;

        // Sort and render table only if necessary (initial load or explicit update)
        if (!isUpdate) return;
        
        const sortedStats = [...statsToRender].sort((a, b) => {
            const valA = a[metric];
            const valB = b[metric];
            const sortOrder = higherIsBetter ? (order === 'desc' ? 1 : -1) : (order === 'desc' ? -1 : 1);
            return (valB - valA) * sortOrder;
        });

        // --- Dynamic Columns Logic ---
        const fixedHeaders = ['رتبه', '# Sim', 'موجودی نهایی', 'رشد کل'];
        const dynamicHeaders = [];
        const dynamicKeys = [];

        if (!['finalBalance', 'totalProfitPercent'].includes(metric)) {
            dynamicHeaders.push(metricProperties[metric].label);
            dynamicKeys.push(metric);
        }
        // Add related metrics
        if (metric === 'maxDrawdownPercent') { dynamicHeaders.push('Max DD ($)'); dynamicKeys.push('maxDrawdown'); }
        if (metric === 'relativeDrawdown') { dynamicHeaders.push('دراودان از اولیه (%)'); dynamicKeys.push('relativeDdPercent'); }
        if (metric === 'relativeDdPercent') { dynamicHeaders.push('دراداون از اولیه ($)'); dynamicKeys.push('relativeDrawdown'); }
        if (metric === 'maxConsecutiveWins') { dynamicHeaders.push('سود دوره پیاپی ($)'); dynamicKeys.push('maxWinStreakPL'); }
        if (metric === 'maxConsecutiveLosses') { dynamicHeaders.push('زیان دوره پیاپی ($)'); dynamicKeys.push('maxLossStreakPL'); }

        rankingTableHeadEl.innerHTML = `<tr>${[...fixedHeaders, ...dynamicHeaders].map(h => `<th class="px-4 py-3 text-center">${h}</th>`).join('')}</tr>`;

        const fragment = document.createDocumentFragment();
        sortedStats.forEach((stats, i) => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-800 hover:bg-slate-700/50';
            
            const fixedCells = `
                <td class="px-2 py-2 text-slate-400 text-center">${i + 1}</td>
                <td class="px-2 py-2 font-semibold text-center"><a href="#" class="stat-link" data-sim-index="${stats.index}">${stats.index + 1}</a></td>
                <td class="px-4 py-2 font-bold text-center ${stats.finalBalance > simulationState.params.initialBalance ? 'text-green-400' : 'text-red-400'}">${formatCurrency(stats.finalBalance)}</td>
                <td class="px-4 py-2 text-center">${stats.totalProfitPercent.toFixed(2)}%</td>
            `;
            
            const dynamicCells = dynamicKeys.map(key => {
                const value = stats[key];
                const props = metricProperties[key];
                let colorClass = '';
                if (props && props.higherIsBetter !== undefined) {
                    const medianValue = median; // Use the median from the summary stats
                    if (props.higherIsBetter) {
                        colorClass = value >= medianValue ? 'text-green-400' : 'text-red-400';
                    } else {
                        colorClass = value <= medianValue ? 'text-green-400' : 'text-red-400';
                    }
                }
                return `<td class="px-4 py-2 text-center ${colorClass}">${formatMetricValue(key, value)}</td>`;
            }).join('');

            tr.innerHTML = fixedCells + dynamicCells;
            fragment.appendChild(tr);
        });
        rankingTableBodyEl.innerHTML = '';
        rankingTableBodyEl.appendChild(fragment);
    }

    // --- Helpers & Utilities ---
    function calculatePeriodStats(simData, endDateIndex, isAverage = false, periodLabel = 'کل دوره') {
        const p = simulationState.params;
        const initialBalance = p.initialBalance;
        if (isAverage) {
            const indices = simulationState.singleChartMode === 'multi' ? simulationState.randomSimIndices : Array.from(Array(simulationState.allSimulations.length).keys());
            if (indices.length === 0) return {};
            const avgKeys = [
                'finalBalance', 'finalBalanceWithoutWithdrawals', 'peakBalance', 'minBalance', 'maxDrawdown', 'maxDrawdownPercent',
                'relativeDrawdown', 'relativeDdPercent', 'profitFactor', 'periodTotalWins', 'periodTotalLosses',
                'periodTotalTrades', 'grossProfit', 'grossLoss', 'totalCommission', 'maxConsecutiveWins', 'maxConsecutiveLosses',
                'maxDailyDrawdownDynamicPercent', 'periodTradingDaysCount', 'periodActiveTradingDays', 'daysInDrawdown', 'daysInDdFromPeak', 'maxDdStreak', 'totalTradesSimulated', 'simulatedDays',
                'slLimitHitCount', 'tpLimitHitCount', 'lossLimitHitCount', 'profitTargetHitCount', 'totalWithdrawals'
            ];
            let avgStats = Object.fromEntries(avgKeys.map(k => [k, 0]));
            avgStats.maxWinStreakDetails = { pnl: 0 };
            avgStats.maxLossStreakDetails = { pnl: 0 };
            let finiteProfitFactorCount = 0;

            indices.forEach(index => {
                const singleSimStats = calculatePeriodStats(simulationState.allSimulations[index], endDateIndex, false, periodLabel);
                // --- ADD THESE TWO LINES ---
                avgStats.maxWinStreakDetails.pnl += singleSimStats.maxWinStreakDetails.pnl;
                avgStats.maxLossStreakDetails.pnl += singleSimStats.maxLossStreakDetails.pnl;
                // --- END OF ADDITION ---
                Object.keys(avgStats).forEach(key => { 
                    if(isFinite(singleSimStats[key])) {
                        if (key === 'profitFactor') {
                            avgStats[key] += singleSimStats[key];
                            finiteProfitFactorCount++;
                        } else {
                            avgStats[key] += singleSimStats[key];
                        }
                    }
                });
            });

            const count = indices.length;
            Object.keys(avgStats).forEach(key => {
                if (key !== 'profitFactor') avgStats[key] /= count;
            });
            if(finiteProfitFactorCount > 0) avgStats.profitFactor /= finiteProfitFactorCount;
            
            avgStats.winRate = avgStats.periodTotalTrades > 0 ? (avgStats.periodTotalWins / avgStats.periodTotalTrades) * 100 : 0;
            avgStats.totalProfit = avgStats.finalBalance - initialBalance;
            avgStats.totalProfitPercent = (avgStats.totalProfit / initialBalance) * 100;
            avgStats.avgTradesPerDay = avgStats.periodActiveTradingDays > 0 ? (avgStats.periodTotalTrades / avgStats.periodActiveTradingDays) : 0;
            avgStats.slLimitHitPercent = avgStats.periodTradingDaysCount > 0 ? (avgStats.slLimitHitCount / avgStats.periodTradingDaysCount * 100) : 0;
            avgStats.tpLimitHitPercent = avgStats.periodTradingDaysCount > 0 ? (avgStats.tpLimitHitCount / avgStats.periodTradingDaysCount * 100) : 0;
            avgStats.lossLimitHitPercent = avgStats.periodTradingDaysCount > 0 ? (avgStats.lossLimitHitCount / avgStats.periodTradingDaysCount * 100) : 0;
            avgStats.profitTargetHitPercent = avgStats.periodTradingDaysCount > 0 ? (avgStats.profitTargetHitCount / avgStats.periodTradingDaysCount * 100) : 0;
            avgStats.periodLabel = periodLabel;
            avgStats.periodCalendarDays = endDateIndex;
            avgStats.simulatedDays = avgStats.simulatedDays / count;
            // --- ADD THESE TWO LINES AFTER IT ---
            avgStats.maxWinStreakDetails.pnl /= count;
            avgStats.maxLossStreakDetails.pnl /= count;
            // --- END OF ADDITION ---
            return avgStats;
        }
        const safeEndDateIndex = Math.min(endDateIndex, simData.balances.length - 1);
        const performanceBalances = simData.balancesWithoutWithdrawals.slice(0, safeEndDateIndex + 1);
        const finalBalance = simData.balances[safeEndDateIndex];
        const finalBalanceWithoutWithdrawals = performanceBalances[Math.min(endDateIndex, performanceBalances.length - 1)];
        const totalProfit = finalBalance - initialBalance;
        const totalProfitPercent = initialBalance > 0 ? (totalProfit / initialBalance) * 100 : 0;
        let peak = -Infinity, maxDd = 0;
        let minBalanceVal = Infinity, peakBalanceVal = -Infinity;
        performanceBalances.forEach((balance) => {
            if (balance > peak) peak = balance;
            if (balance > peakBalanceVal) peakBalanceVal = balance;
            if (balance < minBalanceVal) minBalanceVal = balance;
            const drawdown = peak - balance;
            if (drawdown > maxDd) maxDd = drawdown;
        });
        const maxDdPercent = peak > 0 ? (maxDd / peak) * 100 : 0;
        const relativeDd = Math.max(0, initialBalance - minBalanceVal);
        const relativeDdPercent = initialBalance > 0 ? (relativeDd / initialBalance) * 100 : 0;
        const periodEvents = simData.eventLog.filter(e => e.dayIndex <= safeEndDateIndex);
        
        let periodTradingDaysCount = 0;
        const startDate = new Date(p.startDate);
        for(let i=1; i <= safeEndDateIndex; i++){
            let currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 6 && dayOfWeek !== 0) {
                periodTradingDaysCount++;
            }
        }

        const periodGrossProfit = periodEvents.filter(e=>e.type === 'win').reduce((sum, e) => sum + e.amount, 0);
        const periodGrossLoss = Math.abs(periodEvents.filter(e=>e.type === 'loss').reduce((sum, e) => sum + e.amount, 0));
        const totalCommission = periodEvents.reduce((sum, e) => sum + (e.commission || 0), 0);
        const profitFactor = periodGrossLoss > 0 ? periodGrossProfit / periodGrossLoss : Infinity;
        const periodWins = periodEvents.filter(e => e.type === 'win').length;
        const periodLosses = periodEvents.filter(e => e.type === 'loss').length;
        const totalTradesInPeriod = periodWins + periodLosses;
        const winRate = totalTradesInPeriod > 0 ? (periodWins / totalTradesInPeriod) * 100 : 0;
        
        const periodActiveTradingDays = [...new Set(periodEvents.filter(e => e.type === 'win' || e.type === 'loss').map(e => e.dayIndex))].length;
        
        const daysInDrawdown = performanceBalances.filter(b => b < initialBalance).length;

        const dailyDds = simData.dailyDrawdowns.filter(d => d.dayIndex <= safeEndDateIndex);
        let maxDailyDrawdownDynamicPercent = 0;
        dailyDds.forEach(d => { if (d.base > 0) { const percent = (d.dd / d.base) * 100; if (percent > maxDailyDrawdownDynamicPercent) maxDailyDrawdownDynamicPercent = percent; } });
        
        const slLimitHitCount = periodEvents.filter(e => e.type === 'sl_limit_hit').length;
        const tpLimitHitCount = periodEvents.filter(e => e.type === 'tp_limit_hit').length;
        const lossLimitHitCount = periodEvents.filter(e => e.type === 'loss_limit_hit').length;
        const profitTargetHitCount = periodEvents.filter(e => e.type === 'profit_target_hit').length;
        const totalWithdrawalsInPeriod = periodEvents.filter(e => e.type === 'withdrawal').reduce((sum, e) => sum - e.amount, 0);

        return {
            finalBalance, finalBalanceWithoutWithdrawals, totalProfit, totalProfitPercent, peakBalance: peakBalanceVal, minBalance: minBalanceVal,
            maxDrawdown: maxDd, maxDrawdownPercent: maxDdPercent,
            relativeDrawdown: relativeDd, relativeDdPercent, maxDailyDrawdownDynamicPercent, profitFactor, winRate,
            periodTotalTrades: totalTradesInPeriod, periodTotalWins: periodWins, periodTotalLosses: periodLosses,
            grossProfit: periodGrossProfit, grossLoss: periodGrossLoss, totalCommission,
            totalWithdrawals: totalWithdrawalsInPeriod,
            periodCalendarDays: safeEndDateIndex, periodTradingDaysCount, periodActiveTradingDays,
            
            // Corrected data passing:
            daysInDrawdown: simData.daysInDrawdown, 
            daysInDdFromPeak: simData.daysInDdFromPeak, 
            maxDdStreak: simData.maxDdStreak,
        
            avgTradesPerDay: periodActiveTradingDays > 0 ? (totalTradesInPeriod / periodActiveTradingDays) : 0,
            maxConsecutiveWins: simData.maxConsecutiveWins, maxWinStreakDetails: simData.maxWinStreakDetails,
            maxConsecutiveLosses: simData.maxConsecutiveLosses, maxLossStreakDetails: simData.maxLossStreakDetails,
            slLimitHitCount, tpLimitHitCount, lossLimitHitCount, profitTargetHitCount,
            slLimitHitPercent: periodTradingDaysCount > 0 ? (slLimitHitCount / periodTradingDaysCount * 100) : 0,
            tpLimitHitPercent: periodTradingDaysCount > 0 ? (tpLimitHitCount / periodTradingDaysCount * 100) : 0,
            lossLimitHitPercent: periodTradingDaysCount > 0 ? (lossLimitHitCount / periodTradingDaysCount * 100) : 0,
            profitTargetHitPercent: periodTradingDaysCount > 0 ? (profitTargetHitCount / periodTradingDaysCount * 100) : 0,
            periodLabel,
            totalTradesSimulated: simData.totalTradesSimulated ?? totalTradesInPeriod,
            simulatedDays: simData.simulatedDays ?? safeEndDateIndex,
            tradeTarget: p.targetTrades
        };
    }
    
    function updateProgressBar(current, total = 100, stage = '') {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        const displayPercentage = Math.max(0, Math.min(100, percentage));
        progressBar.style.width = `${displayPercentage}%`;
        progressText.textContent = stage;
    }

    function getPercentile(sortedArr, p) {
        if (!sortedArr || sortedArr.length === 0) return 0;
        const pos = (sortedArr.length - 1) * (p / 100);
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sortedArr[base + 1] !== undefined) return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
        else return sortedArr[base];
    }
    const formatCurrency = (value, currency = 'USD') => {
        if (typeof value !== 'number' || !isFinite(value)) return 'N/A';
        if (currency === 'IRT') return new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' تومان';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
    };
    function setChartScale(chartInstance, type) {
        if (!chartInstance) return;
        if (type === 'logarithmic') {
            const hasNonPositive = chartInstance.data.datasets.some(dataset => dataset.data.some(value => value <= 0));
            if (hasNonPositive) { console.warn("Cannot switch to logarithmic scale: data contains zero or negative values."); return; }
        }
        chartInstance.options.scales.y.type = type;
        chartInstance.update();
        const parentPanel = chartInstance.canvas.closest('.card, #fullscreen-container');
        if (parentPanel) {
            parentPanel.querySelectorAll('.btn[id*="scale-"]').forEach(btn => btn.classList.remove('active'));
            const activeButtonId = `#${chartInstance.canvas.id.includes('single') ? 'single-' : ''}scale-${type}`;
            const activeButton = parentPanel.querySelector(activeButtonId);
            if (activeButton) activeButton.classList.add('active');
        }
    }
    function getRandomColor() { return `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`; }
    function generateAllDates(startDate, totalDays) {
        const dates = [new Date(startDate)];
        for (let i = 1; i <= totalDays; i++) {
            let nextDate = new Date(startDate);
            nextDate.setDate(startDate.getDate() + i);
            dates.push(nextDate);
        }
        return dates;
    }
    function calculateTradeModeDays(targetTrades, minTrades, maxTrades) {
        const positiveTarget = Math.max(1, targetTrades);
        const dailyCapacity = Math.max(1, Math.max(minTrades || 0, maxTrades || 0));
        const estimatedDays = Math.ceil(positiveTarget / dailyCapacity);
        const buffer = Math.max(30, Math.ceil(estimatedDays * 0.2));
        return estimatedDays + buffer;
    }
    function generateDynamicTimeTabs() {
        const totalDays = simulationState.params.totalDays;
        const totalMonths = simulationState.params.totalMonths;
        const tabs = [chartTabs, singleSimChartTabs];
        const periods = new Set();
        const addPeriod = (months, days) => {
            const label = months % 12 === 0 && months > 0 ? `${months/12} سال` : `${months} ماه`;
            periods.add({months, days, label});
        }
        if (totalMonths <= 12) [1, 3, 6, 12].forEach(m => { if (m <= totalMonths) addPeriod(m, Math.round(m * 30.44)); });
        else {
            addPeriod(1, 30); addPeriod(3, 91); addPeriod(6, 182); addPeriod(12, 365);
            for (let y = 2; y * 12 <= totalMonths; y++) addPeriod(y * 12, y * 365);
        }
        periods.add({months: totalMonths, days: totalDays, label: totalMonths % 12 === 0 ? `${totalMonths/12} سال` : `${totalMonths} ماه`});
        const sortedPeriods = Array.from(periods).filter(p => p.days <= totalDays).sort((a,b) => a.days - b.days).filter((v,i,a)=>a.findIndex(t=>(t.label === v.label))===i);
        tabs.forEach(tabContainer => {
            tabContainer.innerHTML = '';
            sortedPeriods.forEach((period) => {
                const isDefault = period.days >= totalDays;
                const btn = document.createElement('button');
                btn.className = `tab-btn btn btn-secondary btn-sm ${isDefault ? 'active' : ''}`;
                btn.dataset.period = period.days; btn.dataset.label = period.label; btn.textContent = period.label;
                tabContainer.appendChild(btn);
            });
        });
    }

    function downloadCSV(csvContent, fileName) {
        // A Blob is used to handle the data, with a BOM (\uFEFF) for better Excel compatibility
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function exportSummaryCSV() {
        if (!simulationState.isComplete) {
            alert('لطفا ابتدا شبیه‌سازی را اجرا کنید.');
            return;
        }
    
        const headers = [
            "#", "Final Balance", "Balance + Withdrawals", "Total Profit ($)", "Total Profit (%)", 
            "Peak Balance ($)", "Min Balance ($)", "Max DD ($)", "Max DD (%)", "Relative DD ($)", 
            "Relative DD (%)", "Profit Factor", "Win Rate (%)", "Total Trades", "Total Wins", 
            "Total Losses", "Gross Profit ($)", "Gross Loss ($)", "Commissions ($)", "Withdrawals ($)", 
            "Max Win Streak", "Max Win Streak PnL ($)", "Max Loss Streak", "Max Loss Streak PnL ($)", 
            "Trading Days", "Active Days", "Days in DD"
        ];
    
        const rows = simulationState.fullStats.map(s => [
            s.index + 1, s.finalBalance, s.finalBalanceWithoutWithdrawals, s.totalProfit, s.totalProfitPercent,
            s.peakBalance, s.minBalance, s.maxDrawdown, s.maxDrawdownPercent, s.relativeDrawdown,
            s.relativeDdPercent, s.profitFactor, s.winRate, s.periodTotalTrades, s.periodTotalWins, 
            s.periodTotalLosses, s.grossProfit, s.grossLoss, s.totalCommission, s.totalWithdrawals, 
            s.maxConsecutiveWins, s.maxWinStreakDetails.pnl, s.maxConsecutiveLosses, s.maxLossStreakDetails.pnl, 
            s.periodTradingDaysCount, s.periodActiveTradingDays, s.daysInDrawdown,
        ]);
    
        let csvContent = headers.join(",") + "\r\n";
        
        rows.forEach(rowArray => {
            let row = rowArray.map(val => {
                // Check if the value is a finite number
                if (typeof val === 'number' && isFinite(val)) {
                    // *** CHANGE HERE: Round the number to 2 decimal places ***
                    return val.toFixed(2);
                }
                // For non-numeric or special values (like "Infinity"), enclose in quotes
                return `"${String(val)}"`;
            }).join(",");
            csvContent += row + "\r\n";
        });
    
        downloadCSV(csvContent, `monte_carlo_summary_${new Date().toISOString().slice(0,10)}.csv`);
    }

    function exportLogsCSV() {
        if (!simulationState.isComplete) {
            alert('لطفا ابتدا شبیه‌سازی را اجرا کنید.');
            return;
        }
    
        const headers = [
            "Simulation Index", "Event ID", "Date", "Day Index", "Type", "Amount ($)", 
            "Lot Size", "StopLoss (Pips)", "Commission ($)", "Cumulative R", "Balance After ($)"
        ];
    
        let csvContent = headers.join(",") + "\r\n";
    
        simulationState.allSimulations.forEach((sim, simIndex) => {
            sim.eventLog.forEach(event => {
                const rowData = [
                    simIndex + 1, event.id, event.date.toISOString().slice(0, 10), event.dayIndex, event.type,
                    event.amount, event.lotSize, event.stopLossInPips, event.commission,
                    event.cumulativeR, event.balanceAfter
                ];
                
                const row = rowData.map(val => {
                    if (typeof val === 'number' && isFinite(val)) {
                        // *** CHANGE HERE: Round the number to 2 decimal places ***
                        return val.toFixed(2);
                    }
                    // For null/undefined values or strings, handle gracefully
                    return `"${String(val ?? '')}"`; // Using ?? '' for empty string on null/undefined
                }).join(",");
                csvContent += row + "\r\n";
            });
        });
    
        downloadCSV(csvContent, `monte_carlo_tradelogs_${new Date().toISOString().slice(0,10)}.csv`);
    }

    // --- Charting ---
    const advancedTooltip = (context) => {
        const { chart, tooltip } = context;
        if (tooltip.opacity === 0 || !tooltip.dataPoints.length) { customTooltipEl.style.opacity = 0; return; }
        const dataIndex = tooltip.dataPoints[0].dataIndex;
        const date = new Date(tooltip.dataPoints[0].parsed.x);
        const dayOfWeek = date.toLocaleDateString('fa-IR', { weekday: 'long' });
        const fullDate = date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
        let tooltipBodyHtml = '';
        const MAX_MULTI_TOOLTIP_ROWS = 8;
        if (chart.canvas.id === 'singleSimChart') {
            // --- IMPROVED multi-simulation tooltip logic ---
            if (simulationState.singleChartMode === 'multi') {
                // Sort the data points from highest balance to lowest
                const sortedPoints = [...tooltip.dataPoints].sort((a, b) => b.raw - a.raw);
                const totalPoints = sortedPoints.length;
                const displayPoints = [];
                const seenKeys = new Set();
                const addPoint = (dp) => {
                    const key = dp.datasetIndex;
                    if (seenKeys.has(key)) return;
                    seenKeys.add(key);
                    displayPoints.push(dp);
                };

                if (totalPoints > MAX_MULTI_TOOLTIP_ROWS) {
                    const bestCount = Math.min(3, MAX_MULTI_TOOLTIP_ROWS - 2);
                    const worstCount = Math.min(2, MAX_MULTI_TOOLTIP_ROWS - bestCount);
                    sortedPoints.slice(0, bestCount).forEach(addPoint);
                    sortedPoints.slice(-worstCount).forEach(addPoint);
                } else {
                    sortedPoints.forEach(addPoint);
                }

                const listItems = displayPoints.map((dp, index) => {
                    const simIndex = simulationState.randomSimIndices[dp.datasetIndex];
                    const color = dp.dataset.borderColor;
                    let valueClass = '';
                    if (index === 0) valueClass = 'text-green-400';
                    if (index === displayPoints.length - 1 && totalPoints > 1) valueClass = 'text-red-400';

                    return `<div class="tooltip-row">
                                <span class="tooltip-label" style="color: ${color};">&#9632; Sim #${simIndex + 1}</span>
                                <span class="tooltip-value ${valueClass}">${formatCurrency(dp.raw)}</span>
                            </div>`;
                }).join('');

                const hiddenCount = totalPoints - displayPoints.length;
                const moreRow = hiddenCount > 0
                    ? `<div class="tooltip-row text-xs text-slate-400" style="justify-content: flex-end;">+${hiddenCount} مسیر دیگر…</div>`
                    : '';

                // Add a median value for better context
                const medianValue = getPercentile(sortedPoints.map(dp => dp.raw), 50);
                const medianHtml = `<div class="tooltip-row mt-2 pt-2 border-t border-slate-700">
                                        <span class="tooltip-label">میانه (Median):</span>
                                        <span class="tooltip-value text-yellow-300">${formatCurrency(medianValue)}</span>
                                    </div>`;

                tooltipBodyHtml = `<div class="multi-sim-list">${listItems}${moreRow}</div>${medianHtml}`;
            } else {
                const simIndex = parseInt(simSelectorEl.value) - 1;
                const sim = simulationState.allSimulations[simIndex];
                const dailyData = sim.dailyStats[dataIndex];
                const balance = sim.balances[dataIndex];
                const prevBalance = dataIndex > 0 ? sim.balances[dataIndex - 1] : simulationState.params.initialBalance;
                const dailyGrowth = prevBalance > 0 ? ((balance / prevBalance) - 1) * 100 : 0;
                const pnlColor = dailyData.pnl > 0 ? 'text-green-400' : (dailyData.pnl < 0 ? 'text-red-400' : 'text-slate-400');
                tooltipBodyHtml = `<div class="tooltip-row"><span class="tooltip-label">موجودی:</span> <span class="tooltip-value">${formatCurrency(balance)}</span></div><div class="tooltip-row"><span class="tooltip-label">آمار روز:</span> <span class="tooltip-value"><span class="text-green-400">${dailyData.wins} برد</span> | <span class="text-red-400">${dailyData.losses} باخت</span></span></div><div class="tooltip-row"><span class="tooltip-label">سود/زیان روز:</span> <span class="tooltip-value ${pnlColor}">${formatCurrency(dailyData.pnl)}</span></div><div class="tooltip-row"><span class="tooltip-label">رشد روزانه:</span> <span class="tooltip-value ${dailyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}">${dailyGrowth.toFixed(2)}%</span></div>`;
            }
        } else {
            tooltipBodyHtml = `<div class="tooltip-row"><span class="tooltip-label" style="color: rgba(74, 222, 128, 0.8);">&#9632; خوش‌بینانه (P75):</span> <span class="tooltip-value">${formatCurrency(tooltip.dataPoints[0].raw)}</span></div><div class="tooltip-row"><span class="tooltip-label" style="color: rgba(56, 189, 248, 1);">&#9632; واقع‌بینانه (P50):</span> <span class="tooltip-value">${formatCurrency(tooltip.dataPoints[1].raw)}</span></div><div class="tooltip-row"><span class="tooltip-label" style="color: rgba(248, 113, 113, 0.8);">&#9632; بدبینانه (P25):</span> <span class="tooltip-value">${formatCurrency(tooltip.dataPoints[2].raw)}</span></div>`;
        }
        customTooltipEl.innerHTML = `<div class="tooltip-header"><span>${dayOfWeek}</span><span>${fullDate}</span></div><div class="tooltip-body">${tooltipBodyHtml}</div>`;
        
        //const chartRect = chart.canvas.getBoundingClientRect();

        //customTooltipEl.style.opacity = 1;
        //customTooltipEl.style.left = chartRect.left + window.scrollX + tooltip.caretX + 'px';
        //customTooltipEl.style.top = chartRect.top + window.scrollY + tooltip.caretY + 'px';
        // --- Replace the positioning logic at the end of advancedTooltip ---
        const { canvas } = chart;
        const canvasRect = canvas.getBoundingClientRect();

        // Check if the chart is inside the fullscreen container
        const isFullscreen = canvas.closest('#fullscreen-container');

        let left = 0;
        let top = 0;

        if (isFullscreen) {
            // In fullscreen, coordinates are simpler and relative to the viewport
            left = canvasRect.left + tooltip.caretX;
            top = canvasRect.top + tooltip.caretY;
        } else {
            // In normal mode, account for page scroll
            left = canvasRect.left + window.scrollX + tooltip.caretX;
            top = canvasRect.top + window.scrollY + tooltip.caretY;
        }

        customTooltipEl.style.opacity = 1;
        customTooltipEl.style.left = left + 'px';
        customTooltipEl.style.top = top + 'px';
        // --- End of replacement ---
    };
    function getChartOptions(type = 'percentile') {
        return {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', beginAtZero: false, ticks: { color: '#94a3b8', callback: (value) => '$' + value.toLocaleString() }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                x: { type: 'time', time: { unit: 'month', tooltipFormat: 'MMM dd, yyyy', displayFormats: { month: 'MMM yyyy' } }, ticks: { color: '#94a3b8', source: 'auto', maxRotation: 0, autoSkip: true }, grid: { display: false } }
            },
            plugins: {
                legend: { display: type === 'multi' || type === 'percentile', labels: { color: '#e2e8f0' } },
                tooltip: { enabled: false, external: advancedTooltip, mode: 'index', intersect: false },
                // --- FINAL CORRECTED zoom plugin configuration ---
                zoom: {
                    pan: {
                        enabled: true, // Let's enable it by default
                        mode: 'x',
                    },
                    zoom: {
                        drag: {
                            enabled: false, // Drag-to-zoom is now disabled by default
                        },
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    }
                }
            },
            interaction: { mode: 'index', intersect: false }
        };
    }
    function clampInput(input, min, max) {
        let value = parseFloat(input.value);
        if (isNaN(value)) return;
        if (value > max) input.value = max;
        if (value < min) input.value = min;
    }

    // --- Fullscreen Logic ---
    let originalChartContainer = null;
    let fullscreenChartId = null;
    let originalTooltipParent = null;
    let activeChartInstance = null;

    // --- CORRECTED enterFullscreen function ---
    function enterFullscreen(chartId) {
        const chartCanvas = document.getElementById(chartId);
        if (!chartCanvas) return;
        
        activeChartInstance = chartId === 'balanceChart' ? balanceChart : singleSimChart;
        if (!activeChartInstance) return;

        // --- Start of Fix ---
        // 1. Store the original parent BEFORE moving anything
        originalChartContainer = chartCanvas.parentElement;
        originalTooltipParent = customTooltipEl.parentElement; // Now it correctly captures the body
        fullscreenChartId = chartId;

        // 2. Move the elements to the fullscreen container
        fullscreenChartContainer.appendChild(chartCanvas);
        fullscreenContainer.appendChild(customTooltipEl);
        // --- End of Fix ---

        const sourceTabsId = chartId === 'balanceChart' ? 'chart-tabs' : 'single-sim-chart-tabs';
        const sourceTabs = document.getElementById(sourceTabsId);
        fullscreenTabsContainer.innerHTML = sourceTabs.innerHTML;
        
        fullscreenTabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                fullscreenTabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const originalBtn = sourceTabs.querySelector(`[data-period='${e.target.dataset.period}']`);
                if(originalBtn) {
                    sourceTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    originalBtn.classList.add('active');
                }
                
                if (chartId === 'balanceChart') renderChart();
                else renderSingleSimulationChart();
            });
        });

        if (fullscreenContainer.requestFullscreen) {
            fullscreenContainer.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        }
    }

    function exitFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }

    function handleFullscreenChange() {
        const isFullscreen = !!document.fullscreenElement;
        
        if (isFullscreen) {
            if(activeChartInstance) {
                setTimeout(() => activeChartInstance.resize(), 50);
            }
        } else {
            if (originalChartContainer && fullscreenChartId) {
                const chartCanvas = document.getElementById(fullscreenChartId);
                originalChartContainer.appendChild(chartCanvas);
                
                if(activeChartInstance) {
                    setTimeout(() => activeChartInstance.resize(), 50);
                }
                if (originalTooltipParent) {
                    document.body.appendChild(customTooltipEl);
                }
                originalChartContainer = null;
                fullscreenChartId = null;
                originalTooltipParent = null;
                activeChartInstance = null;
            }
        }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    exitFullscreenBtn.addEventListener('click', exitFullscreen);

    // --- Initial Setup ---
    restoreFontSizePreference();
    loadParamsFromLocalStorage();
    populateRankingOptions();
    applyNavVisibility(currentNavTarget);
    if (navButtons.length) {
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.navTarget || 'config';
                applyNavVisibility(target);
                if (target === 'logs' && tradeLogSection) {
                    tradeLogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        window.addEventListener('resize', () => applyNavVisibility(currentNavTarget));
    }
    if (fontSizeToggleBtn) {
        fontSizeToggleBtn.addEventListener('click', cycleFontSizePreference);
    }
    allInputEls.forEach(el => {
        const eventType = (el.tagName === 'INPUT' && el.type === 'number') ? 'input' : 'change';
        el.addEventListener(eventType, saveParamsToLocalStorage);
    });
    riskPercentEl.addEventListener('input', () => clampInput(riskPercentEl, 0, 100));
    winRateEl.addEventListener('input', () => clampInput(winRateEl, 0, 100));
    withdrawalPercentEl.addEventListener('input', () => clampInput(withdrawalPercentEl, 0, 100));
    withdrawalPeriodEl.addEventListener('input', () => clampInput(withdrawalPeriodEl, 1, 52));
    stepUpMultiplierEl.addEventListener('input', () => clampInput(stepUpMultiplierEl, 1.1, 100));
    rrRatioRewardEl.addEventListener('input', () => clampInput(rrRatioRewardEl, 0.1, 200));
    minDailyTradesEl.addEventListener('input', () => clampInput(minDailyTradesEl, 0, 100));
    maxDailyTradesEl.addEventListener('input', () => clampInput(maxDailyTradesEl, 0, 100));
    const clampDuration = () => {
        const unit = durationUnitEl.value;
        const max = unit === 'years' ? 10 : 120;
        clampInput(durationValueEl, 1, max);
    };
    durationValueEl.addEventListener('input', clampDuration);
    durationUnitEl.addEventListener('change', clampDuration);
});
