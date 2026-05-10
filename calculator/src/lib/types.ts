export type Good = 'Rice' | 'Spice' | 'Rubber' | 'Oil' | 'SiapSaji'
export const GOODS: Good[] = ['Rice', 'Spice', 'Rubber', 'Oil', 'SiapSaji']
export const GOOD_REVENUE: Record<Good, number> = {
    Rice: 20, Spice: 25, Rubber: 30, SiapSaji: 35, Oil: 40
}
export const GOOD_LABEL: Record<Good, string> = {
    Rice: 'Rice 🌾', Spice: 'Spice 🌶', Rubber: 'Rubber 🌿', SiapSaji: 'Siap Saji 🍜', Oil: 'Oil 🛢'
}
export const GOOD_COLOR: Record<Good, string> = {
    Rice: '#22c55e', Spice: '#ef4444', Rubber: '#84cc16', SiapSaji: '#f97316', Oil: '#1d4ed8'
}

export const PLAYER_COLORS = ['#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

export type Player = {
    id: string
    name: string
    color: string
}

export type ProductionCompany = {
    id: string
    playerId: string
    good: Good
    areaIds: string[]
}

export type ShippingCompany = {
    id: string
    playerId: string
    hullLevel: number
    ships: Record<string, number>
}

export type CityConfig = {
    areaId: string
    demands: Partial<Record<Good, number>>
}

export type Tool =
    | { kind: 'none' }
    | { kind: 'city' }
    | { kind: 'ship'; companyId: string }
    | { kind: 'factory'; companyId: string }
    | { kind: 'erase' }
