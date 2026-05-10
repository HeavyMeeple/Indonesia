import { IndonesiaGraph, IndonesiaAreaType, IndonesiaNeighborDirection } from '@tabletop/indonesia'
import { solveDeliveryProblem } from '@tabletop/indonesia'
import { DeliveryTieBreakPolicy, SHIPPING_FEE_PER_SHIP_USE } from '@tabletop/indonesia'
import type { DeliveryPlan, DeliveryProblem, ZoneSupply, CityDemand, ShippingCompanyNetwork, SeaAreaCapacity, SeaLane } from '@tabletop/indonesia'
import type { ProductionCompany, ShippingCompany, CityConfig, Player, Good } from './types.js'
import type { IndonesiaNodeId } from '@tabletop/indonesia'

export type CompanyResult = {
    company: ProductionCompany
    player: Player
    plan: DeliveryPlan
}

function sortIds(ids: string[]): IndonesiaNodeId[] {
    return [...ids].sort((a, b) => a.localeCompare(b)) as IndonesiaNodeId[]
}

function buildZoneSupplies(graph: IndonesiaGraph, company: ProductionCompany): ZoneSupply[] {
    const areaIdSet = new Set(company.areaIds as IndonesiaNodeId[])
    const unvisited = sortIds([...areaIdSet])
    const groups: IndonesiaNodeId[][] = []

    while (unvisited.length > 0) {
        const seed = unvisited.shift()!
        const queue: IndonesiaNodeId[] = [seed]
        const group: IndonesiaNodeId[] = []
        const remaining = new Set(unvisited)
        remaining.delete(seed)

        while (queue.length > 0) {
            const cur = queue.shift()!
            group.push(cur)
            const node = graph.nodeById(cur)
            if (!node) continue
            for (const neighbor of graph.neighborsOf(node, IndonesiaNeighborDirection.Land)) {
                if (neighbor.type !== IndonesiaAreaType.Land) continue
                if (!remaining.has(neighbor.id as IndonesiaNodeId)) continue
                remaining.delete(neighbor.id as IndonesiaNodeId)
                queue.push(neighbor.id as IndonesiaNodeId)
            }
        }
        unvisited.splice(0, unvisited.length, ...sortIds([...remaining]))
        groups.push(sortIds(group))
    }

    return groups.map((areaIds, i) => {
        const adjacentSeaAreaIds = new Set<IndonesiaNodeId>()
        for (const areaId of areaIds) {
            const node = graph.nodeById(areaId)
            if (!node) continue
            for (const seaId of node.neighbors[IndonesiaNeighborDirection.Sea]) {
                const seaNode = graph.nodeById(seaId as IndonesiaNodeId)
                if (seaNode?.type === IndonesiaAreaType.Sea) adjacentSeaAreaIds.add(seaId as IndonesiaNodeId)
            }
        }
        return {
            zoneId: `${company.id}:zone:${i + 1}`,
            areaIds: areaIds,
            adjacentSeaAreaIds: sortIds([...adjacentSeaAreaIds]),
            supply: areaIds.length
        }
    })
}

function buildCityDemands(graph: IndonesiaGraph, cities: CityConfig[], good: Good): CityDemand[] {
    const demands: CityDemand[] = []
    for (const city of cities) {
        const demand = city.demands[good] ?? 0
        if (demand <= 0) continue
        const cityNode = graph.nodeById(city.areaId as IndonesiaNodeId)
        if (!cityNode) continue
        const adjacentSeaAreaIds = new Set<IndonesiaNodeId>()
        for (const seaId of cityNode.neighbors[IndonesiaNeighborDirection.Sea]) {
            const seaNode = graph.nodeById(seaId as IndonesiaNodeId)
            if (seaNode?.type === IndonesiaAreaType.Sea) adjacentSeaAreaIds.add(seaId as IndonesiaNodeId)
        }
        demands.push({
            cityId: city.areaId,
            cityAreaId: city.areaId as IndonesiaNodeId,
            adjacentSeaAreaIds: sortIds([...adjacentSeaAreaIds]),
            remainingDemand: demand
        })
    }
    return demands.sort((a, b) => a.cityId.localeCompare(b.cityId))
}

function buildShippingNetworks(graph: IndonesiaGraph, shippingCompanies: ShippingCompany[]): ShippingCompanyNetwork[] {
    const networks: ShippingCompanyNetwork[] = []
    for (const company of [...shippingCompanies].sort((a, b) => a.id.localeCompare(b.id))) {
        const seaAreaIds = sortIds(Object.keys(company.ships).filter(id => (company.ships[id] ?? 0) > 0))
        if (seaAreaIds.length === 0) continue
        const capacityPerShip = 1 + company.hullLevel
        const seaAreaCapacities: SeaAreaCapacity[] = seaAreaIds.map(seaId => ({
            seaAreaId: seaId,
            capacity: (company.ships[seaId] ?? 0) * capacityPerShip
        }))
        const seaIdSet = new Set(seaAreaIds)
        const laneByKey = new Map<string, SeaLane>()
        for (const seaId of seaAreaIds) {
            const node = graph.nodeById(seaId)
            if (!node) continue
            for (const neighbor of graph.neighborsOf(node, IndonesiaNeighborDirection.Sea)) {
                if (!seaIdSet.has(neighbor.id as IndonesiaNodeId)) continue
                const [a, b] = [seaId, neighbor.id as IndonesiaNodeId].sort()
                const key = `${a}|${b}`
                if (!laneByKey.has(key)) laneByKey.set(key, { fromSeaAreaId: a as IndonesiaNodeId, toSeaAreaId: b as IndonesiaNodeId })
            }
        }
        networks.push({
            shippingCompanyId: company.id,
            seaLanes: [...laneByKey.values()].sort((a, b) => `${a.fromSeaAreaId}|${a.toSeaAreaId}`.localeCompare(`${b.fromSeaAreaId}|${b.toSeaAreaId}`)),
            seaAreaCapacities
        })
    }
    return networks
}

export function calculate(
    players: Player[],
    productionCompanies: ProductionCompany[],
    shippingCompanies: ShippingCompany[],
    cities: CityConfig[]
): CompanyResult[] {
    const graph = new IndonesiaGraph()
    const shippingNetworks = buildShippingNetworks(graph, shippingCompanies)

    return productionCompanies.map(company => {
        const player = players.find(p => p.id === company.playerId)!
        const ownedShippingIds = shippingCompanies
            .filter(sc => sc.playerId === company.playerId)
            .map(sc => sc.id)
            .sort()

        const problem: DeliveryProblem = {
            operatingCompanyId: company.id,
            operatingCompanyOwnerId: company.playerId,
            ownedShippingCompanyIds: ownedShippingIds,
            good: company.good as any,
            shippingFeePerShipUse: SHIPPING_FEE_PER_SHIP_USE,
            tieBreakPolicy: DeliveryTieBreakPolicy.MinShippingCost,
            zoneSupplies: buildZoneSupplies(graph, company),
            cityDemands: buildCityDemands(graph, cities, company.good),
            shippingCompanyNetworks: shippingNetworks
        }

        const plan = solveDeliveryProblem(problem)
        return { company, player, plan }
    })
}
