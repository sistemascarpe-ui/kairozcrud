import React, { useState } from 'react';
import { migrationCheck } from '../utils/migrationCheck';
import Button from './ui/Button';

const MigrationHelper = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async () => {
    setLoading(true);
    setStatus('Verificando base de datos...');
    
    try {
      const result = await migrationCheck.checkAndMigrate();
      setResult(result);
      
      if (result.success) {
        setStatus('✅ Verificación completada');
      } else if (result.needsManualMigration) {
        setStatus('⚠️ Se requiere migración manual');
      } else {
        setStatus('❌ Error en verificación');
      }
    } catch (error) {
      setStatus('❌ Error: ' + error.message);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        🔧 Herramienta de Migración
      </h3>
      <p className="text-yellow-700 mb-4">
        Esta herramienta verifica el estado de la base de datos y migra los datos si es necesario.
      </p>
      
      <Button 
        onClick={handleCheck} 
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Verificando...' : 'Verificar y Migrar Base de Datos'}
      </Button>
      
      {status && (
        <div className="mb-4">
          <p className="font-medium">{status}</p>
        </div>
      )}
      
      {result && (
        <div className="bg-white border rounded p-3">
          <h4 className="font-semibold mb-2">Resultado:</h4>
          <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.needsManualMigration && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <h5 className="font-semibold text-red-800">Acción Requerida:</h5>
              <p className="text-red-700 mt-1">
                Necesitas ejecutar el SQL de migración en Supabase. 
                Ve al archivo bd.sql y ejecuta las consultas de migración.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MigrationHelper;