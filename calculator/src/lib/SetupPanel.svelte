<script lang="ts">
    import {
        players, productionCompanies, shippingCompanies, cities,
        activeToolState, setActiveTool,
        addPlayer, removePlayer,
        addProductionCompany, removeProductionCompany,
        addShippingCompany, removeShippingCompany,
        removeShipFromArea, setCityDemand
    } from './state.svelte.js'
    import { GOODS, GOOD_LABEL, GOOD_COLOR, PLAYER_COLORS, type Good } from './types.js'

    function playerColor(playerId: string) {
        return players.find(p => p.id === playerId)?.color ?? '#6b7280'
    }
    function playerName(playerId: string) {
        return players.find(p => p.id === playerId)?.name ?? '?'
    }

    function isActiveFactory(companyId: string) {
        return activeToolState.value.kind === 'factory' && activeToolState.value.companyId === companyId
    }
    function isActiveShip(companyId: string) {
        return activeToolState.value.kind === 'ship' && activeToolState.value.companyId === companyId
    }
</script>

<div class="panel">
    <!-- Active Tool Banner -->
    <div class="tool-banner" class:active={activeToolState.value.kind !== 'none'}>
        {#if activeToolState.value.kind === 'none'}
            <span>เลือก Tool ด้านล่าง แล้วคลิกบนแผนที่</span>
        {:else if activeToolState.value.kind === 'city'}
            <span>🏙 กำลังวางเมือง – คลิก Land area</span>
        {:else if activeToolState.value.kind === 'factory'}
            {@const c = productionCompanies.find(c => c.id === activeToolState.value.companyId)}
            <span>🏭 วาง Factory ของ {c?.good} – คลิก Land area</span>
        {:else if activeToolState.value.kind === 'ship'}
            <span>⚓ วางเรือ – คลิก Sea area</span>
        {:else if activeToolState.value.kind === 'erase'}
            <span>🗑 ลบ – คลิก area ที่ต้องการลบ</span>
        {/if}
        {#if activeToolState.value.kind !== 'none'}
            <button class="btn-xs" onclick={() => setActiveTool({ kind: 'none' })}>✕ ยกเลิก</button>
        {/if}
    </div>

    <!-- Erase tool -->
    <div class="section-row">
        <button
            class="btn-tool"
            class:selected={activeToolState.value.kind === 'erase'}
            onclick={() => setActiveTool(activeToolState.value.kind === 'erase' ? { kind: 'none' } : { kind: 'erase' })}
        >🗑 ลบ</button>
    </div>

    <!-- Players -->
    <div class="section">
        <div class="section-header">
            <h3>ผู้เล่น</h3>
            {#if players.length < 4}
                <button class="btn-sm" onclick={addPlayer}>+ เพิ่มผู้เล่น</button>
            {/if}
        </div>
        {#each players as player}
            <div class="player-row">
                <span class="color-dot" style="background:{player.color}"></span>
                <input class="name-input" bind:value={player.name} />
                {#if players.length > 1}
                    <button class="btn-xs danger" onclick={() => removePlayer(player.id)}>✕</button>
                {/if}
            </div>
        {/each}
    </div>

    <!-- Production Companies -->
    <div class="section">
        <h3>🏭 บริษัทผลิต</h3>
        {#each players as player}
            <div class="sub-section">
                <div class="sub-header">
                    <span class="color-dot" style="background:{player.color}"></span>
                    <span>{player.name}</span>
                    {#each GOODS as good}
                        <button
                            class="btn-good"
                            style="background:{GOOD_COLOR[good]}"
                            onclick={() => addProductionCompany(player.id, good)}
                            title="เพิ่ม {good}"
                        >+{good[0]}</button>
                    {/each}
                </div>
                {#each productionCompanies.filter(c => c.playerId === player.id) as company}
                    <div class="company-row">
                        <span class="good-badge" style="background:{GOOD_COLOR[company.good]}">{company.good}</span>
                        <span class="area-count">{company.areaIds.length} areas</span>
                        <button
                            class="btn-sm"
                            class:selected={isActiveFactory(company.id)}
                            onclick={() => setActiveTool(
                                isActiveFactory(company.id)
                                    ? { kind: 'none' }
                                    : { kind: 'factory', companyId: company.id }
                            )}
                        >{isActiveFactory(company.id) ? '✓ วางอยู่' : '📍 วาง Factory'}</button>
                        <button class="btn-xs danger" onclick={() => removeProductionCompany(company.id)}>✕</button>
                    </div>
                {/each}
            </div>
        {/each}
    </div>

    <!-- Shipping Companies -->
    <div class="section">
        <h3>🚢 บริษัทขนส่ง</h3>
        {#each players as player}
            <div class="sub-section">
                <div class="sub-header">
                    <span class="color-dot" style="background:{player.color}"></span>
                    <span>{player.name}</span>
                    <button class="btn-sm" onclick={() => addShippingCompany(player.id)}>+ เพิ่มบริษัทเรือ</button>
                </div>
                {#each shippingCompanies.filter(c => c.playerId === player.id) as company}
                    <div class="company-row">
                        <div class="ship-company">
                            <div class="ship-company-header">
                                <span>Hull Lv.</span>
                                <select bind:value={company.hullLevel}>
                                    <option value={0}>0 (1/ship)</option>
                                    <option value={1}>1 (2/ship)</option>
                                    <option value={2}>2 (3/ship)</option>
                                    <option value={3}>3 (4/ship)</option>
                                </select>
                                <button
                                    class="btn-sm"
                                    class:selected={isActiveShip(company.id)}
                                    onclick={() => setActiveTool(
                                        isActiveShip(company.id)
                                            ? { kind: 'none' }
                                            : { kind: 'ship', companyId: company.id }
                                    )}
                                >{isActiveShip(company.id) ? '✓ วางอยู่' : '⚓ วางเรือ'}</button>
                                <button class="btn-xs danger" onclick={() => removeShippingCompany(company.id)}>✕</button>
                            </div>
                            {#if Object.keys(company.ships).length > 0}
                                <div class="ships-list">
                                    {#each Object.entries(company.ships) as [seaId, count]}
                                        <span class="ship-tag">
                                            {seaId}: {count}⚓
                                            <button class="btn-xs" onclick={() => removeShipFromArea(company.id, seaId)}>−</button>
                                        </span>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/each}
    </div>

    <!-- Cities -->
    <div class="section">
        <h3>🏙 เมือง</h3>
        <div class="section-row">
            <button
                class="btn-tool"
                class:selected={activeToolState.value.kind === 'city'}
                onclick={() => setActiveTool(activeToolState.value.kind === 'city' ? { kind: 'none' } : { kind: 'city' })}
            >🏙 วางเมือง</button>
        </div>
        {#each cities as city}
            <div class="city-row">
                <span class="city-id">{city.areaId}</span>
                <div class="demand-inputs">
                    {#each GOODS as good}
                        <label class="demand-label">
                            <span style="color:{GOOD_COLOR[good]}">{good[0]}</span>
                            <input
                                type="number" min="0" max="10"
                                value={city.demands[good] ?? 0}
                                oninput={(e) => setCityDemand(city.areaId, good, parseInt((e.target as HTMLInputElement).value) || 0)}
                                class="demand-input"
                            />
                        </label>
                    {/each}
                </div>
            </div>
        {/each}
        {#if cities.length === 0}
            <p class="hint">คลิก "วางเมือง" แล้วคลิก land area เพื่อเพิ่มเมือง</p>
        {/if}
    </div>
</div>

<style>
    .panel { display:flex; flex-direction:column; gap:8px; padding:8px; overflow-y:auto; height:100%; font-size:13px; }
    .section { background:#1e293b; border-radius:8px; padding:8px; }
    .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
    .sub-section { margin-bottom:8px; }
    .sub-header { display:flex; align-items:center; gap:4px; flex-wrap:wrap; margin-bottom:4px; font-weight:600; }
    h3 { margin:0 0 6px 0; font-size:13px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; }
    .player-row { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
    .color-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
    .name-input { flex:1; background:#0f172a; border:1px solid #334155; border-radius:4px; padding:2px 6px; color:#e2e8f0; font-size:13px; }
    .company-row { display:flex; align-items:center; gap:6px; margin-bottom:4px; flex-wrap:wrap; }
    .good-badge { padding:2px 8px; border-radius:10px; color:white; font-size:11px; font-weight:700; }
    .area-count { color:#94a3b8; font-size:11px; }
    .ship-company { width:100%; }
    .ship-company-header { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
    .ships-list { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px; }
    .ship-tag { background:#0f172a; border:1px solid #334155; border-radius:4px; padding:2px 6px; font-size:11px; display:flex; align-items:center; gap:4px; color:#e2e8f0; }
    .city-row { background:#0f172a; border-radius:6px; padding:6px; margin-bottom:4px; }
    .city-id { font-weight:700; color:#e2e8f0; font-size:12px; }
    .demand-inputs { display:flex; gap:4px; flex-wrap:wrap; margin-top:4px; }
    .demand-label { display:flex; align-items:center; gap:2px; font-size:11px; }
    .demand-input { width:36px; background:#1e293b; border:1px solid #334155; border-radius:4px; padding:2px 4px; color:#e2e8f0; font-size:12px; text-align:center; }
    .btn-sm { background:#334155; border:none; border-radius:4px; padding:3px 8px; color:#e2e8f0; cursor:pointer; font-size:11px; }
    .btn-sm:hover { background:#475569; }
    .btn-sm.selected { background:#3b82f6; color:white; }
    .btn-xs { background:#334155; border:none; border-radius:4px; padding:2px 6px; color:#e2e8f0; cursor:pointer; font-size:11px; }
    .btn-xs.danger { background:#7f1d1d; color:#fca5a5; }
    .btn-xs:hover { background:#475569; }
    .btn-good { border:none; border-radius:4px; padding:2px 6px; color:white; cursor:pointer; font-size:11px; font-weight:700; }
    .btn-tool { background:#334155; border:none; border-radius:6px; padding:4px 12px; color:#e2e8f0; cursor:pointer; font-size:12px; }
    .btn-tool:hover { background:#475569; }
    .btn-tool.selected { background:#3b82f6; color:white; }
    .tool-banner { background:#1e3a5f; border-radius:6px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center; color:#93c5fd; font-size:12px; }
    .tool-banner.active { background:#1e40af; color:white; }
    .section-row { display:flex; gap:6px; margin-bottom:4px; }
    .hint { color:#64748b; font-size:11px; text-align:center; padding:8px; }
    select { background:#0f172a; border:1px solid #334155; border-radius:4px; padding:2px 4px; color:#e2e8f0; font-size:11px; }
</style>
