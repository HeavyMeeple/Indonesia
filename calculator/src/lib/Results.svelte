<script lang="ts">
    import type { CompanyResult } from './solver.js'
    import { GOOD_COLOR, GOOD_REVENUE } from './types.js'

    let { results }: { results: CompanyResult[] } = $props()

    function cityName(id: string) { return id }
    function zoneNum(zoneId: string) {
        const parts = zoneId.split(':zone:')
        return parts[1] ?? zoneId
    }
</script>

<div class="results">
    {#if results.length === 0}
        <p class="hint">ตั้งค่าบริษัทและเมืองแล้วกด Calculate</p>
    {:else}
        {#each results as r}
            {@const goodColor = GOOD_COLOR[r.company.good]}
            <div class="company-result">
                <div class="company-header" style="border-left:4px solid {r.player.color}">
                    <span class="good-badge" style="background:{goodColor}">{r.company.good}</span>
                    <span class="player-name" style="color:{r.player.color}">{r.player.name}</span>
                    <div class="summary-nums">
                        <span class="num green">+${r.plan.revenue}</span>
                        <span class="num red">−${r.plan.shippingCost}</span>
                        <span class="num bold" style="color:{r.plan.netIncome >= 0 ? '#4ade80' : '#f87171'}">
                            = ${r.plan.netIncome}
                        </span>
                        <span class="delivered">{r.plan.totalDelivered} goods</span>
                    </div>
                </div>

                {#if r.plan.deliveries.length === 0}
                    <p class="no-deliveries">ไม่มีการส่งสินค้า (ไม่มีเมืองที่เชื่อมถึงหรือ demand = 0)</p>
                {:else}
                    <table class="delivery-table">
                        <thead>
                            <tr>
                                <th>Zone</th>
                                <th>→ เมือง</th>
                                <th>จำนวน</th>
                                <th>เรือ (ผ่าน)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each r.plan.deliveries as d}
                                <tr>
                                    <td>Zone {zoneNum(d.zoneId)}</td>
                                    <td>{d.cityId}</td>
                                    <td class="qty">{d.quantity}</td>
                                    <td class="sea-path">{d.seaPathAreaIds.join(' → ')}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {/if}

                {#if r.plan.shippingPayments.length > 0}
                    <div class="shipping-payments">
                        <span class="label">ค่าเรือ:</span>
                        {#each r.plan.shippingPayments as pay}
                            <span class="payment-tag">ค่าเรือ = ${pay.amount}</span>
                        {/each}
                    </div>
                {/if}

                {#if r.plan.shipUses && r.plan.shipUses.length > 0}
                    <div class="ship-uses">
                        <span class="label">Ship uses:</span>
                        {#each r.plan.shipUses as use}
                            <span class="use-tag">{use.seaAreaId} ×{use.uses}</span>
                        {/each}
                    </div>
                {/if}
            </div>
        {/each}

        <!-- Grand total per player -->
        <div class="totals">
            <h3>สรุปรวมต่อผู้เล่น</h3>
            {#each [...new Map(results.map(r => [r.player.id, r.player])).values()] as player}
                {@const playerResults = results.filter(r => r.player.id === player.id)}
                {@const totalNet = playerResults.reduce((s, r) => s + r.plan.netIncome, 0)}
                {@const totalRevenue = playerResults.reduce((s, r) => s + r.plan.revenue, 0)}
                {@const totalShipping = playerResults.reduce((s, r) => s + r.plan.shippingCost, 0)}
                <div class="player-total" style="border-left:4px solid {player.color}">
                    <span style="color:{player.color};font-weight:700">{player.name}</span>
                    <span class="num green">+${totalRevenue}</span>
                    <span class="num red">−${totalShipping}</span>
                    <span class="num bold" style="color:{totalNet >= 0 ? '#4ade80' : '#f87171'}">= ${totalNet}</span>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .results { display:flex; flex-direction:column; gap:10px; padding:8px; overflow-y:auto; height:100%; font-size:12px; }
    .company-result { background:#1e293b; border-radius:8px; padding:10px; }
    .company-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; padding-left:8px; flex-wrap:wrap; }
    .good-badge { padding:2px 8px; border-radius:10px; color:white; font-size:11px; font-weight:700; }
    .player-name { font-weight:600; font-size:13px; }
    .summary-nums { display:flex; gap:8px; align-items:center; margin-left:auto; flex-wrap:wrap; }
    .num { font-size:13px; }
    .num.green { color:#4ade80; }
    .num.red { color:#f87171; }
    .num.bold { font-weight:700; font-size:15px; }
    .delivered { color:#94a3b8; font-size:11px; }
    .delivery-table { width:100%; border-collapse:collapse; }
    .delivery-table th { text-align:left; padding:4px 6px; color:#64748b; border-bottom:1px solid #334155; font-size:11px; }
    .delivery-table td { padding:4px 6px; border-bottom:1px solid #1e293b; color:#e2e8f0; }
    .qty { font-weight:700; color:#f0abfc; }
    .sea-path { color:#7dd3fc; font-size:11px; }
    .no-deliveries { color:#64748b; font-style:italic; padding:4px; }
    .shipping-payments, .ship-uses { display:flex; gap:6px; align-items:center; margin-top:6px; flex-wrap:wrap; }
    .label { color:#64748b; font-size:11px; }
    .payment-tag, .use-tag { background:#0f172a; border:1px solid #334155; border-radius:4px; padding:2px 6px; color:#e2e8f0; font-size:11px; }
    .totals { background:#0f172a; border-radius:8px; padding:10px; margin-top:4px; }
    .totals h3 { margin:0 0 8px; font-size:12px; color:#94a3b8; text-transform:uppercase; }
    .player-total { display:flex; align-items:center; gap:10px; padding:6px 8px; margin-bottom:4px; background:#1e293b; border-radius:6px; flex-wrap:wrap; }
    .hint { color:#64748b; text-align:center; padding:20px; }
</style>
