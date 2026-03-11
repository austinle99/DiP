import { prisma } from '../config/db.js';
import { AppError } from '../utils/errors.js';

interface SkuItem {
  skuId: string;
  quantity: number;
}

interface RecommendationRequest {
  customerId: string;
  skuList: SkuItem[];
}

export async function recommendContainer(req: RecommendationRequest) {
  const customer = await prisma.customer.findUnique({
    where: { externalId: req.customerId },
    select: { id: true },
  });

  if (!customer) throw AppError.notFound('Customer');

  const totalQuantity = req.skuList.reduce((sum, sku) => sum + sku.quantity, 0);

  // Container recommendation logic
  let recommendationType: 'SINGLE_CONTAINER' | 'SPLIT_LOAD' | 'MANUAL_REVIEW';
  let containerType: string | null;
  let utilizationPercent: number;
  let reasonCodes: string[];
  let confidenceLabel: 'HIGH' | 'MEDIUM' | 'LOW';
  let sparseDataMode = false;

  // Check historical data density for this customer
  const historyCount = await prisma.containerMix.count({
    where: { customerId: customer.id },
  });
  if (historyCount < 3) sparseDataMode = true;

  if (totalQuantity > 1500) {
    recommendationType = 'SPLIT_LOAD';
    containerType = null;
    utilizationPercent = 100;
    reasonCodes = ['VOL_EXCEEDS_40HC', 'SPLIT_RECOMMENDED'];
    confidenceLabel = totalQuantity > 3000 ? 'HIGH' : 'MEDIUM';
  } else if (totalQuantity > 800) {
    recommendationType = 'SINGLE_CONTAINER';
    containerType = '40HC';
    utilizationPercent = Math.min(Math.round((totalQuantity / 1500) * 100), 99);
    reasonCodes = ['FITS_STANDARD_40HC', 'WEIGHT_OPTIMIZED'];
    confidenceLabel = 'HIGH';
  } else if (totalQuantity > 300) {
    recommendationType = 'SINGLE_CONTAINER';
    containerType = '20GP';
    utilizationPercent = Math.min(Math.round((totalQuantity / 800) * 100), 99);
    reasonCodes = ['FITS_STANDARD_20GP', 'COST_OPTIMIZED'];
    confidenceLabel = 'HIGH';
  } else {
    recommendationType = 'MANUAL_REVIEW';
    containerType = '20GP';
    utilizationPercent = Math.round((totalQuantity / 800) * 100);
    reasonCodes = ['LOW_VOLUME', 'CONSOLIDATION_POSSIBLE'];
    confidenceLabel = 'LOW';
  }

  // Persist recommendation
  const recommendation = await prisma.recommendation.create({
    data: {
      customerId: customer.id,
      recommendationType,
      containerType,
      utilizationPercent,
      reasonCodes,
      confidenceLabel,
      sparseDataMode,
      skuInput: JSON.parse(JSON.stringify(req.skuList)),
    },
  });

  return {
    recommendationId: recommendation.id,
    recommendationType,
    containerType,
    utilizationPercent,
    reasonCodes,
    confidenceLabel,
    sparseDataMode,
  };
}
