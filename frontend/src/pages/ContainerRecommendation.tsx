import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { mockRecommendContainer } from '../lib/mocks/handlers';
import { ContainerRecommendationRequest } from '../lib/api/contract';
import { ReasonCodeBadge } from '../components/shared/ReasonCodeBadge';
import { Package, Truck, AlertTriangle } from 'lucide-react';

export const ContainerRecommendationWorkspace = () => {
  const [skuQty, setSkuQty] = useState(500);

  const mutation = useMutation({
    mutationFn: (data: ContainerRecommendationRequest) => mockRecommendContainer(data),
  });

  const handlePredict = () => {
    mutation.mutate({
      customerId: "CUST-8819",
      skuList: [{ skuId: "SKU-A1", quantity: skuQty }]
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Container Planning Workspace</h1>
        <p className="text-sm text-slate-500">Run capacity predictions against requested order mixes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Zone */}
        <div className="col-span-1 bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <h3 className="font-medium mb-4 flex items-center gap-2 text-slate-800">
            <Package size={16} /> Order Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">SKU-A1 Quantity</label>
              <input 
                type="number" 
                value={skuQty}
                onChange={(e) => setSkuQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <button 
              onClick={handlePredict}
              disabled={mutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-md transition-colors disabled:bg-blue-300"
            >
              {mutation.isPending ? 'Computing Load Plan...' : 'Generate Recommendation'}
            </button>
          </div>
        </div>

        {/* Output Zone */}
        <div className="col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-lg shadow-inner flex flex-col justify-center items-center min-h-[300px]">
          {mutation.isIdle && (
            <div className="text-slate-400 flex flex-col items-center">
              <Truck size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Submit an order mix to calculate required containers.</p>
            </div>
          )}

          {mutation.isPending && (
            <div className="text-blue-600 flex flex-col items-center animate-pulse">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium">Running spatial optimization model...</p>
            </div>
          )}

          {mutation.isError && (
            <div className="text-red-600 flex flex-col items-center">
              <AlertTriangle size={32} className="mb-2" />
              <p className="text-sm">Engine timeout. Try again or escalate to manual review.</p>
            </div>
          )}

          {mutation.isSuccess && (
            <div className="w-full bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Recommendation</div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {mutation.data.recommendationType === 'SPLIT_LOAD' ? 'Split Load Required' : `${mutation.data.containerType} Container`}
                  </h2>
                </div>
                <ReasonCodeBadge 
                  codes={mutation.data.reasonCodes} 
                  sparseDataMode={mutation.data.sparseDataMode} 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">Predicted Capacity Utilization</span>
                  <span className="font-mono text-slate-900">{mutation.data.utilizationPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full ${mutation.data.utilizationPercent > 90 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${mutation.data.utilizationPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-50 font-medium">Escalate to Manual</button>
                <button className="px-4 py-2 text-sm text-white bg-slate-900 rounded hover:bg-slate-800 font-medium">Approve Booking</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};