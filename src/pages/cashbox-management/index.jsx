import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import {
  useOpenSessionState,
  useOpenCashbox,
  useCloseCashbox,
  useMovements,
  useMovementsCount,
  useSessionTotals,
  useCreateMovement
} from '../../hooks/useCashbox';

const CashboxManagement = () => {
  const { userProfile } = useAuth();
  const { data: sessionRes } = useOpenSessionState();
  const openMutation = useOpenCashbox();
  const closeMutation = useCloseCashbox();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const sesionId = sessionRes?.data?.id || null;
  const { data: totalsRes } = useSessionTotals(sesionId);
  const [filters, setFilters] = useState({ tipo: '', metodo_pago: '', categoria: '' });
  const { data: movementsRes, isLoading: movementsLoading } = useMovements(sesionId, page, limit, filters);
  const { data: movementsCountRes } = useMovementsCount(sesionId, filters);
  const createMovementMutation = useCreateMovement();

  const handleOpen = async () => {
    const usuarioId = userProfile?.id || null;
    const result = await openMutation.mutateAsync({ usuarioId, saldoInicial: 0, observaciones: '' });
    if (result?.error) toast.error(result.error);
  };

  const handleClose = async () => {
    if (!sesionId) return;
    const usuarioId = userProfile?.id || null;
    const saldoCierre = totalsRes?.data?.saldoActual || 0;
    const result = await closeMutation.mutateAsync({ sesionId, usuarioId, saldoCierre, observaciones: '' });
    if (result?.error) toast.error(result.error);
  };

  const [movementForm, setMovementForm] = useState({ tipo: 'ingreso', monto: '', concepto: '', metodo_pago: 'efectivo', categoria: '', referencia: '' });
  const handleCreateMovement = async () => {
    if (!sesionId) {
      toast.error('No hay sesión de caja abierta');
      return;
    }
    const monto = parseFloat(movementForm.monto || 0);
    if (!movementForm.tipo || !(monto > 0)) {
      toast.error('Tipo y monto válidos requeridos');
      return;
    }
    const usuarioId = userProfile?.id || null;
    const payload = { sesionId, tipo: movementForm.tipo, monto, concepto: movementForm.concepto, categoria: movementForm.categoria, metodo_pago: movementForm.metodo_pago, referencia: movementForm.referencia, ventaId: null, usuarioId };
    const result = await createMovementMutation.mutateAsync(payload);
    if (result?.error) toast.error(result.error);
    else setMovementForm({ tipo: 'ingreso', monto: '', concepto: '', metodo_pago: 'efectivo', categoria: '', referencia: '' });
  };

  const totalPages = movementsCountRes?.count ? Math.ceil(movementsCountRes.count / limit) : 1;

  const sessionError = sessionRes?.error || null;

  // Apertura manual únicamente: sin auto-apertura aquí

  return (
    <>
      <Helmet><title>Caja</title></Helmet>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Caja</h1>
              <p className="mt-2 text-gray-600">Registra ingresos y egresos diarios</p>
            </div>
            {sessionRes?.data ? (
              <Button variant="outline" onClick={handleClose}>Cerrar caja</Button>
            ) : (
              <Button onClick={handleOpen}>Abrir caja</Button>
            )}
          </div>

          {sessionError && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
              <p>La base de datos de caja no está configurada. Presentaré la propuesta SQL antes de crear las tablas.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-sm font-medium text-gray-500">Saldo inicial</p>
              <p className="text-2xl font-bold text-gray-900">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalsRes?.data?.saldoInicial || 0)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-sm font-medium text-gray-500">Ingresos</p>
              <p className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalsRes?.data?.ingresos || 0)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <p className="text-sm font-medium text-gray-500">Egresos</p>
              <p className="text-2xl font-bold text-red-600">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalsRes?.data?.egresos || 0)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
            <p className="text-sm font-medium text-gray-500">Saldo actual</p>
            <p className="text-3xl font-bold text-gray-900">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalsRes?.data?.saldoActual || 0)}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo movimiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select value={movementForm.tipo} onChange={(v) => setMovementForm({ ...movementForm, tipo: v })} options={[{ value: 'ingreso', label: 'Ingreso' }, { value: 'egreso', label: 'Egreso' }]} />
              <Input type="number" placeholder="Monto" value={movementForm.monto} onChange={(e) => setMovementForm({ ...movementForm, monto: e.target.value })} />
              <Input placeholder="Concepto" value={movementForm.concepto} onChange={(e) => setMovementForm({ ...movementForm, concepto: e.target.value })} />
              <Select value={movementForm.metodo_pago} onChange={(v) => setMovementForm({ ...movementForm, metodo_pago: v })} options={[{ value: 'efectivo', label: 'Efectivo' }, { value: 'tarjeta', label: 'Tarjeta' }, { value: 'transferencia', label: 'Transferencia' }]} />
              <Input placeholder="Categoría" value={movementForm.categoria} onChange={(e) => setMovementForm({ ...movementForm, categoria: e.target.value })} />
              <Input placeholder="Referencia" value={movementForm.referencia} onChange={(e) => setMovementForm({ ...movementForm, referencia: e.target.value })} />
            </div>
            <div className="mt-4">
              <Button onClick={handleCreateMovement}>Registrar</Button>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Mostrando {movementsRes?.data?.length || 0} de {movementsCountRes?.count || 0} movimientos{movementsCountRes?.count ? ` (Página ${page} de ${totalPages})` : ''}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Concepto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Método</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Monto</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(movementsRes?.data || []).map(m => (
                  <tr key={m.id}>
                    <td className="px-4 py-2 text-sm text-gray-700">{new Date(m.created_at).toLocaleString('es-MX')}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{m.tipo}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{m.concepto || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{m.metodo_pago || '-'}</td>
                    <td className="px-4 py-2 text-sm font-semibold {m.tipo==='ingreso' ? 'text-green-600' : 'text-red-600'}">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(m.monto || 0)}</td>
                  </tr>
                ))}
                {movementsLoading && (
                  <tr><td className="px-4 py-4 text-center text-sm text-gray-500" colSpan={5}>Cargando...</td></tr>
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center items-center space-x-4 p-4">
                <Button variant="outline" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Anterior</Button>
                <span className="text-sm text-gray-700">Página {page} de {totalPages}</span>
                <Button variant="outline" onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>Siguiente</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CashboxManagement;
