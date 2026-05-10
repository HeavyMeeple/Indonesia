<script lang="ts">
    import Map from './lib/Map.svelte'
    import SetupPanel from './lib/SetupPanel.svelte'
    import Results from './lib/Results.svelte'
    import { players, productionCompanies, shippingCompanies, cities } from './lib/state.svelte.js'
    import { calculate, type CompanyResult } from './lib/solver.js'

    let results = $state<CompanyResult[]>([])
    let error = $state('')
    let activeTab = $state<'setup' | 'results'>('setup')

    function runCalculate() {
        try {
            error = ''
            results = calculate(players, productionCompanies, shippingCompanies, cities)
            activeTab = 'results'
        } catch (e: any) {
            error = e?.message ?? String(e)
        }
    }
</script>

<div class="app">
    <header>
        <h1>🏝 Indonesia – Operations Calculator</h1>
        <button class="btn-calc" onclick={runCalculate}>⚡ Calculate</button>
    </header>

    <div class="layout">
        <!-- Left: Map -->
        <div class="map-pane">
            <Map />
        </div>

        <!-- Right: Side panel with tabs -->
        <div class="side-pane">
            <div class="tabs">
                <button class="tab" class:active={activeTab === 'setup'} onclick={() => activeTab = 'setup'}>⚙ Setup</button>
                <button class="tab" class:active={activeTab === 'results'} onclick={() => activeTab = 'results'}>
                    📊 Results
                    {#if results.length > 0}<span class="badge">{results.length}</span>{/if}
                </button>
            </div>

            {#if error}
                <div class="error">{error}</div>
            {/if}

            <div class="tab-content">
                {#if activeTab === 'setup'}
                    <SetupPanel />
                {:else}
                    <Results {results} />
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
    :global(body) { background: #0f172a; color: #e2e8f0; font-family: system-ui, sans-serif; height: 100vh; overflow: hidden; }
    :global(#app) { height: 100vh; display: flex; flex-direction: column; }

    .app { display: flex; flex-direction: column; height: 100vh; }

    header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 16px; background: #1e293b; border-bottom: 1px solid #334155;
        flex-shrink: 0;
    }
    h1 { font-size: 16px; font-weight: 700; color: #f1f5f9; }

    .btn-calc {
        background: #22c55e; color: white; border: none; border-radius: 6px;
        padding: 8px 20px; font-size: 14px; font-weight: 700; cursor: pointer;
    }
    .btn-calc:hover { background: #16a34a; }

    .layout { display: flex; flex: 1; overflow: hidden; }

    .map-pane { flex: 1; overflow: hidden; position: relative; }

    .side-pane {
        width: 340px; flex-shrink: 0; background: #0f172a;
        border-left: 1px solid #334155; display: flex; flex-direction: column;
    }

    .tabs { display: flex; border-bottom: 1px solid #334155; }
    .tab {
        flex: 1; padding: 8px; background: none; border: none; color: #64748b;
        cursor: pointer; font-size: 13px; font-weight: 600;
    }
    .tab:hover { color: #e2e8f0; }
    .tab.active { color: #e2e8f0; border-bottom: 2px solid #3b82f6; }
    .badge {
        display: inline-flex; align-items: center; justify-content: center;
        background: #3b82f6; color: white; border-radius: 10px;
        width: 18px; height: 18px; font-size: 11px; margin-left: 4px;
    }

    .tab-content { flex: 1; overflow: hidden; }

    .error {
        background: #7f1d1d; color: #fca5a5; padding: 8px 12px;
        font-size: 12px; border-bottom: 1px solid #991b1b;
    }
</style>
