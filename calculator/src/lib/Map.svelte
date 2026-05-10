<script lang="ts">
    import { BOARD_WIDTH, BOARD_HEIGHT, LAND_POSITIONS, SEA_POSITIONS } from './mapData.js'
    import { cities, productionCompanies, shippingCompanies, activeToolState, handleLandClick, handleSeaClick } from './state.svelte.js'
    import type { Good } from './types.js'
    import { GOOD_COLOR } from './types.js'

    const LAND_IDS = Object.keys(LAND_POSITIONS)
    const SEA_IDS = Object.keys(SEA_POSITIONS)

    function getLandFill(areaId: string): string {
        // Check if factory
        for (const c of productionCompanies) {
            if (c.areaIds.includes(areaId)) {
                const player = players.find(p => p.id === c.playerId)
                return player?.color ?? '#6b7280'
            }
        }
        // Check if city
        if (cities.some(c => c.areaId === areaId)) return '#facc15'
        return '#d1d5db'
    }

    function getLandStroke(areaId: string): string {
        const tool = activeToolState.value
        if (tool.kind === 'factory' || tool.kind === 'city' || tool.kind === 'erase') {
            return '#60a5fa'
        }
        return '#6b7280'
    }

    function getSeaFill(areaId: string): string {
        const hasShips = shippingCompanies.some(c => (c.ships[areaId] ?? 0) > 0)
        if (hasShips) return '#0ea5e9'
        return '#93c5fd'
    }

    function getFactoryLabel(areaId: string): string {
        for (const c of productionCompanies) {
            if (c.areaIds.includes(areaId)) return c.good[0]
        }
        return ''
    }

    function getCityLabel(areaId: string): string {
        const city = cities.find(c => c.areaId === areaId)
        if (!city) return ''
        const total = Object.values(city.demands).reduce((s, v) => s + (v ?? 0), 0)
        return total > 0 ? `${total}` : 'C'
    }

    function getShipCount(areaId: string): string {
        const total = shippingCompanies.reduce((s, c) => s + (c.ships[areaId] ?? 0), 0)
        return total > 0 ? `${total}` : ''
    }

    import { players } from './state.svelte.js'
</script>

<div class="map-container">
    <svg
        viewBox="0 0 {BOARD_WIDTH} {BOARD_HEIGHT}"
        xmlns="http://www.w3.org/2000/svg"
        style="width:100%;height:100%;background:#bfdbfe;"
    >
        <!-- Sea areas -->
        {#each SEA_IDS as id}
            {@const pos = SEA_POSITIONS[id]}
            {@const ships = getShipCount(id)}
            <g
                class="area-group"
                role="button"
                tabindex="0"
                onclick={() => handleSeaClick(id)}
                onkeydown={(e) => e.key === 'Enter' && handleSeaClick(id)}
            >
                <circle
                    cx={pos.x} cy={pos.y} r="45"
                    fill={getSeaFill(id)}
                    stroke="#3b82f6" stroke-width="2"
                    opacity="0.85"
                />
                <text x={pos.x} y={pos.y - 12} text-anchor="middle" font-size="18" fill="#1e3a5f" font-weight="bold">{id}</text>
                {#if ships}
                    <text x={pos.x} y={pos.y + 18} text-anchor="middle" font-size="22" fill="#0c4a6e" font-weight="bold">⚓{ships}</text>
                {/if}
            </g>
        {/each}

        <!-- Land areas -->
        {#each LAND_IDS as id}
            {@const pos = LAND_POSITIONS[id]}
            {@const fill = getLandFill(id)}
            {@const label = getFactoryLabel(id) || getCityLabel(id)}
            {@const isCity = cities.some(c => c.areaId === id)}
            <g
                class="area-group"
                role="button"
                tabindex="0"
                onclick={() => handleLandClick(id)}
                onkeydown={(e) => e.key === 'Enter' && handleLandClick(id)}
            >
                <circle
                    cx={pos.x} cy={pos.y} r={isCity ? 38 : 28}
                    fill={fill}
                    stroke={getLandStroke(id)} stroke-width="2"
                />
                <text x={pos.x} y={pos.y - 10} text-anchor="middle" font-size="14" fill="#374151">{id}</text>
                {#if label}
                    <text x={pos.x} y={pos.y + 14} text-anchor="middle" font-size="16" fill="#111827" font-weight="bold">{label}</text>
                {/if}
            </g>
        {/each}
    </svg>
</div>

<style>
    .map-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    .area-group {
        cursor: pointer;
    }
    .area-group:hover circle {
        opacity: 0.8;
        filter: brightness(1.1);
    }
</style>
