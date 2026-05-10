import { PLAYER_COLORS, type CityConfig, type Player, type ProductionCompany, type ShippingCompany, type Tool } from './types.js'

function uid() {
    return Math.random().toString(36).slice(2, 9)
}

export const players = $state<Player[]>([
    { id: uid(), name: 'Player 1', color: PLAYER_COLORS[0] },
    { id: uid(), name: 'Player 2', color: PLAYER_COLORS[1] }
])

export const productionCompanies = $state<ProductionCompany[]>([])
export const shippingCompanies = $state<ShippingCompany[]>([])
export const cities = $state<CityConfig[]>([])
export const activeToolState = $state<{ value: Tool }>({ value: { kind: 'none' } })

export function addPlayer() {
    if (players.length >= 4) return
    players.push({ id: uid(), name: `Player ${players.length + 1}`, color: PLAYER_COLORS[players.length] })
}

export function removePlayer(id: string) {
    const idx = players.findIndex(p => p.id === id)
    if (idx >= 0) players.splice(idx, 1)
    // Remove companies owned by this player
    for (let i = productionCompanies.length - 1; i >= 0; i--) {
        if (productionCompanies[i].playerId === id) productionCompanies.splice(i, 1)
    }
    for (let i = shippingCompanies.length - 1; i >= 0; i--) {
        if (shippingCompanies[i].playerId === id) shippingCompanies.splice(i, 1)
    }
}

export function addProductionCompany(playerId: string, good: import('./types.js').Good) {
    productionCompanies.push({ id: uid(), playerId, good, areaIds: [] })
}

export function removeProductionCompany(id: string) {
    const idx = productionCompanies.findIndex(c => c.id === id)
    if (idx >= 0) productionCompanies.splice(idx, 1)
    if (activeToolState.value.kind === 'factory' && activeToolState.value.companyId === id) {
        activeToolState.value = { kind: 'none' }
    }
}

export function addShippingCompany(playerId: string) {
    shippingCompanies.push({ id: uid(), playerId, hullLevel: 0, ships: {} })
}

export function removeShippingCompany(id: string) {
    const idx = shippingCompanies.findIndex(c => c.id === id)
    if (idx >= 0) shippingCompanies.splice(idx, 1)
    if (activeToolState.value.kind === 'ship' && activeToolState.value.companyId === id) {
        activeToolState.value = { kind: 'none' }
    }
}

export function setActiveTool(tool: Tool) {
    activeToolState.value = tool
}

export function handleLandClick(areaId: string) {
    if (activeToolState.value.kind === 'factory') {
        const company = productionCompanies.find(c => c.id === activeToolState.value.companyId)
        if (!company) return
        // Remove from any other company first
        for (const c of productionCompanies) {
            const i = c.areaIds.indexOf(areaId)
            if (i >= 0) c.areaIds.splice(i, 1)
        }
        // Remove from cities
        const cityIdx = cities.findIndex(c => c.areaId === areaId)
        if (cityIdx >= 0) cities.splice(cityIdx, 1)
        company.areaIds.push(areaId)
    } else if (activeToolState.value.kind === 'city') {
        // Remove from any factory
        for (const c of productionCompanies) {
            const i = c.areaIds.indexOf(areaId)
            if (i >= 0) c.areaIds.splice(i, 1)
        }
        const existing = cities.find(c => c.areaId === areaId)
        if (!existing) cities.push({ areaId, demands: {} })
    } else if (activeToolState.value.kind === 'erase') {
        for (const c of productionCompanies) {
            const i = c.areaIds.indexOf(areaId)
            if (i >= 0) c.areaIds.splice(i, 1)
        }
        const cityIdx = cities.findIndex(c => c.areaId === areaId)
        if (cityIdx >= 0) cities.splice(cityIdx, 1)
    }
}

export function handleSeaClick(areaId: string) {
    if (activeToolState.value.kind === 'ship') {
        const company = shippingCompanies.find(c => c.id === activeToolState.value.companyId)
        if (!company) return
        company.ships[areaId] = (company.ships[areaId] ?? 0) + 1
    } else if (activeToolState.value.kind === 'erase') {
        for (const c of shippingCompanies) {
            delete c.ships[areaId]
        }
    }
}

export function removeShipFromArea(companyId: string, seaAreaId: string) {
    const company = shippingCompanies.find(c => c.id === companyId)
    if (!company) return
    if ((company.ships[seaAreaId] ?? 0) <= 1) {
        delete company.ships[seaAreaId]
    } else {
        company.ships[seaAreaId]--
    }
}

export function setCityDemand(areaId: string, good: import('./types.js').Good, demand: number) {
    const city = cities.find(c => c.areaId === areaId)
    if (!city) return
    if (demand <= 0) {
        delete city.demands[good]
    } else {
        city.demands[good] = demand
    }
}
