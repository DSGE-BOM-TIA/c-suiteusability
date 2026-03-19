import Fastify from 'fastify';
import { pool } from '../tests/helpers/setup';

const app = Fastify();

// Health check
app.get('/health', async () => {
  return { status: 'ok' };
});

// Run scenario
app.get('/scenarios/:id/run', async (req, reply) => {
  const { id } = req.params as { id: string };

  const result = await pool.query(
    `SELECT parameters FROM scenarios WHERE id = $1`,
    [id]
  );

  if (result.rowCount === 0) {
    return reply.status(404).send({ error: 'Scenario not found' });
  }

  const params = result.rows[0].parameters;

  // --- Core economics logic ---
  const feedstockCost = params.feedstock.cost;
  const transportCost =
    params.feedstock.transportDistance *
    params.feedstock.transportCostPerMile;

  const processingBase =
    params.processing.energyCost +
    params.processing.laborCost +
    params.processing.maintenanceCost +
    params.processing.overheadCost;

  const yieldRate = params.processing.yieldRate / 100;

  const processingCost = processingBase / yieldRate;

  const totalCost = feedstockCost + transportCost + processingCost;
  const revenue = params.market.sellingPrice;

  const margin = revenue - totalCost;
  const marginPct = (margin / revenue) * 100;

  // Decision logic
  let decision = 'HOLD';
  if (marginPct > 60) decision = 'SCALE';
  else if (marginPct > 30) decision = 'CONDITIONAL';

  return {
    decision,
    kpis: {
      totalCost,
      revenue,
      margin,
      marginPct,
    },
    drivers: {
      feedstockCost,
      transportCost,
      processingCost,
    },
  };
});

// Narrative brief
app.get('/scenarios/:id/brief', async (req) => {
  const run = await app.inject({
    method: 'GET',
    url: `/scenarios/${(req.params as any).id}/run`,
  });

  const data = JSON.parse(run.body);

  return {
    brief: `This scenario shows a ${data.kpis.marginPct.toFixed(
      1
    )}% gross margin. The primary cost driver is processing (${data.drivers.processingCost.toFixed(
      2
    )}/ton). Recommendation: ${data.decision}.`,
  };
});

app.listen({ port: 3000 }, () => {
  console.log('API running on http://localhost:3000');
});
